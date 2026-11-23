# O "contrato da API": o formato exato do que entra e do que sai de cada rota.
# O Pydantic valida tudo automaticamente e o Swagger (/docs) usa isto para se montar.

import re
from datetime import datetime, timezone
from decimal import Decimal
from typing import Annotated, List, Optional

from pydantic import (
    BaseModel,
    ConfigDict,
    computed_field,
    Field,
    StrictInt,
    field_validator,
    model_validator,
)

from config import settings

IdPositivo = Annotated[StrictInt, Field(gt=0)]


def _validar_preco(valor: Decimal) -> Decimal:
    if not valor.is_finite() or valor < 0 or valor.as_tuple().exponent < -2:
        raise ValueError("Informe um preço válido")
    return valor.quantize(Decimal("0.01"))


# ---------- ENTRADA (o que o app envia) ----------

class EspetoIn(BaseModel):
    nome: str
    preco: Decimal
    descricao: Optional[str] = None
    imagem: Optional[str] = None

    @field_validator("nome")
    @classmethod
    def validar_nome(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Informe o nome do espeto")
        return v.strip()

    @field_validator("preco")
    @classmethod
    def validar_preco(cls, v: Decimal) -> Decimal:
        return _validar_preco(v)


class ComboIn(BaseModel):
    nome: str
    preco: Decimal
    preco_original: Optional[Decimal] = None
    descricao: Optional[str] = None

    @field_validator("nome")
    @classmethod
    def validar_nome(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Informe o nome do combo")
        return v.strip()

    @field_validator("preco")
    @classmethod
    def validar_preco(cls, v: Decimal) -> Decimal:
        return _validar_preco(v)

    @field_validator("preco_original")
    @classmethod
    def validar_preco_original(cls, v: Optional[Decimal]) -> Optional[Decimal]:
        if v is None:
            return v
        try:
            return _validar_preco(v)
        except ValueError:
            raise ValueError("Preço original inválido")


class ClienteIn(BaseModel):
    nome: str
    email: str
    telefone: str

    @field_validator("nome", "email", "telefone")
    @classmethod
    def nao_vazio(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Informe nome, e-mail e telefone")
        return v.strip()

    @field_validator("email")
    @classmethod
    def email_minusculo(cls, v: str) -> str:
        return v.lower()

    @field_validator("email")
    @classmethod
    def email_valido(cls, v: str) -> str:
        if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", v):
            raise ValueError("Informe um e-mail válido")
        return v


def _validar_senha(v: str) -> str:
    if len(v) < 6:
        raise ValueError("A senha deve ter pelo menos 6 caracteres")
    if len(v.encode("utf-8")) > 72:
        raise ValueError("A senha é longa demais (máximo de 72 caracteres)")
    return v


class RegistroIn(ClienteIn):
    senha: str

    @field_validator("senha")
    @classmethod
    def validar_senha(cls, v: str) -> str:
        return _validar_senha(v)


class LoginIn(BaseModel):
    email: str
    senha: str

    @field_validator("email")
    @classmethod
    def email_limpo(cls, v: str) -> str:
        return v.strip().lower()


class FavoritoIn(BaseModel):
    espeto_id: IdPositivo


class ItemCarrinhoIn(BaseModel):
    espeto_id: Optional[IdPositivo] = None
    combo_id: Optional[IdPositivo] = None
    quantidade: IdPositivo = 1
    observacao: Optional[str] = None

    @field_validator("observacao")
    @classmethod
    def limpar_observacao(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        v = v.strip()
        if len(v) > 140:
            raise ValueError("A observação pode ter no máximo 140 caracteres")
        return v or None

    @model_validator(mode="after")
    def so_um_produto(self):
        if (self.espeto_id is None) == (self.combo_id is None):
            raise ValueError("Informe espeto_id ou combo_id, mas não ambos")
        return self


class QuantidadeIn(BaseModel):
    quantidade: StrictInt

    @field_validator("quantidade")
    @classmethod
    def validar_quantidade(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("Informe uma quantidade inteira positiva")
        return v


# ---------- SAÍDA (o que o backend devolve) ----------

def _para_float(v):
    return None if v is None else float(v)


class EspetoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str
    descricao: Optional[str] = None
    preco: float
    imagem: Optional[str] = None
    categoria_id: Optional[int] = None

    _preco_float = field_validator("preco", mode="before")(_para_float)


class ComboOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str
    descricao: Optional[str] = None
    preco: float
    preco_original: Optional[float] = None
    imagem: Optional[str] = None

    _precos_float = field_validator("preco", "preco_original", mode="before")(_para_float)


class ClienteOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str
    email: str
    telefone: str

    @computed_field
    @property
    def admin(self) -> bool:
        """True se este cliente é administrador (e-mail listado em ADMIN_EMAILS)."""
        return self.email.lower() in settings.admin_emails


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    cliente: ClienteOut


class ItemCarrinhoOut(BaseModel):
    id: int
    espeto_id: Optional[int] = None
    combo_id: Optional[int] = None
    nome: str
    quantidade: int
    preco_unitario: float
    subtotal: float
    observacao: Optional[str] = None


class CarrinhoOut(BaseModel):
    cliente_id: int
    itens: List[ItemCarrinhoOut]
    total: float


class MensagemOut(BaseModel):
    mensagem: str


class ItemAdicionadoOut(BaseModel):
    mensagem: str
    item_id: int


# ---------- PEDIDOS ----------

FORMAS_PAGAMENTO = ("dinheiro", "pix", "cartao")


class PedidoIn(BaseModel):
    forma_pagamento: str
    # Só para pagamento em dinheiro:
    precisa_troco: Optional[bool] = None
    valor_pago: Optional[Decimal] = None
    cupom: Optional[str] = None

    @field_validator("forma_pagamento")
    @classmethod
    def validar_forma(cls, v: str) -> str:
        v = v.strip().lower()
        if v not in FORMAS_PAGAMENTO:
            raise ValueError("Escolha a forma de pagamento: dinheiro, pix ou cartao")
        return v

    @field_validator("valor_pago")
    @classmethod
    def validar_valor_pago(cls, v: Optional[Decimal]) -> Optional[Decimal]:
        if v is None:
            return v
        try:
            return _validar_preco(v)
        except ValueError:
            raise ValueError("Informe um valor válido para o pagamento")

    @field_validator("cupom")
    @classmethod
    def validar_cupom_codigo(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        v = v.strip().upper()
        return v or None

    @model_validator(mode="after")
    def validar_dinheiro(self):
        if self.forma_pagamento == "dinheiro":
            if self.precisa_troco is None:
                raise ValueError("Informe se precisa de troco")
            if self.precisa_troco and self.valor_pago is None:
                raise ValueError("Informe com quanto você vai pagar")
        return self


class ItemPedidoOut(BaseModel):
    nome: str
    quantidade: int
    preco_unitario: float
    subtotal: float
    observacao: Optional[str] = None


class AvaliacaoOut(BaseModel):
    nota: int
    comentario: Optional[str] = None
    criado_em: datetime

    @field_validator("criado_em")
    @classmethod
    def com_fuso_horario(cls, v: datetime) -> datetime:
        return v.replace(tzinfo=timezone.utc) if v.tzinfo is None else v


class PedidoOut(BaseModel):
    id: int
    status: str
    forma_pagamento: str
    total: float
    valor_pago: Optional[float] = None
    troco: Optional[float] = None
    cupom_codigo: Optional[str] = None
    desconto: Optional[float] = None
    criado_em: datetime
    itens: List[ItemPedidoOut]
    avaliacao: Optional[AvaliacaoOut] = None
    pix_copia_cola: Optional[str] = None  # só em pedidos Pix (com PIX_CHAVE configurada)

    @field_validator("criado_em")
    @classmethod
    def com_fuso_horario(cls, v: datetime) -> datetime:
        # O SQLite devolve a data sem fuso; sabemos que foi gravada em UTC.
        return v.replace(tzinfo=timezone.utc) if v.tzinfo is None else v


# ---------- PERFIL ----------

class PerfilIn(BaseModel):
    nome: str
    telefone: str

    @field_validator("nome", "telefone")
    @classmethod
    def nao_vazio(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Informe nome e telefone")
        return v.strip()


class TrocarSenhaIn(BaseModel):
    senha_atual: str
    senha_nova: str

    @field_validator("senha_nova")
    @classmethod
    def validar_senha_nova(cls, v: str) -> str:
        return _validar_senha(v)


# ---------- SOBRE A CASA ----------

class HorarioOut(BaseModel):
    dia: str
    abre: Optional[str] = None  # "18:00"; vazio = fechado nesse dia
    fecha: Optional[str] = None


class CasaOut(BaseModel):
    nome: str
    descricao: str
    endereco: str
    telefone: str
    horarios: List[HorarioOut]


# ---------- CONTA: RECUPERAR SENHA E TROCAR E-MAIL ----------

def _email_valido(v: str) -> str:
    v = v.strip().lower()
    if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", v):
        raise ValueError("Informe um e-mail válido")
    return v


class RecuperarIn(BaseModel):
    email: str

    @field_validator("email")
    @classmethod
    def validar_email(cls, v: str) -> str:
        return _email_valido(v)


class RedefinirIn(BaseModel):
    email: str
    codigo: str
    senha_nova: str

    @field_validator("email")
    @classmethod
    def validar_email(cls, v: str) -> str:
        return _email_valido(v)

    @field_validator("codigo")
    @classmethod
    def validar_codigo(cls, v: str) -> str:
        v = v.strip()
        if not re.fullmatch(r"\d{6}", v):
            raise ValueError("O código tem 6 números")
        return v

    @field_validator("senha_nova")
    @classmethod
    def validar_senha_nova(cls, v: str) -> str:
        return _validar_senha(v)


class AlterarEmailIn(BaseModel):
    email_novo: str
    senha: str

    @field_validator("email_novo")
    @classmethod
    def validar_email(cls, v: str) -> str:
        return _email_valido(v)


# ---------- AVALIAÇÕES ----------

class AvaliacaoIn(BaseModel):
    nota: StrictInt
    comentario: Optional[str] = None

    @field_validator("nota")
    @classmethod
    def validar_nota(cls, v: int) -> int:
        if v < 1 or v > 5:
            raise ValueError("A nota precisa ser de 1 a 5")
        return v

    @field_validator("comentario")
    @classmethod
    def limpar_comentario(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        v = v.strip()
        if len(v) > 500:
            raise ValueError("O comentário pode ter no máximo 500 caracteres")
        return v or None


class AvaliacaoPublicaOut(BaseModel):
    nome: str
    nota: int
    comentario: Optional[str] = None
    criado_em: datetime

    @field_validator("criado_em")
    @classmethod
    def com_fuso_horario(cls, v: datetime) -> datetime:
        return v.replace(tzinfo=timezone.utc) if v.tzinfo is None else v


class ResumoAvaliacoesOut(BaseModel):
    media: float
    total: int
    recentes: List[AvaliacaoPublicaOut]


# ---------- CATEGORIAS ----------

class CategoriaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str
    ordem: int = 0


# ---------- CUPONS ----------

class CupomValidarIn(BaseModel):
    codigo: str

    @field_validator("codigo")
    @classmethod
    def limpar(cls, v: str) -> str:
        v = v.strip().upper()
        if not v:
            raise ValueError("Digite o código do cupom")
        return v


class ValidacaoCupomOut(BaseModel):
    codigo: str
    descricao: str
    desconto: float
    subtotal: float
    total: float


class CupomDisponivelOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    codigo: str
    descricao: str
    tipo: str
    valor: float
    minimo: float
    validade: Optional[datetime] = None

    @field_validator("valor", "minimo", mode="before")
    @classmethod
    def para_float(cls, v):
        return float(v)

    @field_validator("validade")
    @classmethod
    def com_fuso_horario(cls, v: Optional[datetime]) -> Optional[datetime]:
        if v is None:
            return None
        return v.replace(tzinfo=timezone.utc) if v.tzinfo is None else v


# ---------- STATUS DO PEDIDO, NOTIFICAÇÕES E ADMINISTRAÇÃO ----------

class PedidoAdminOut(PedidoOut):
    cliente_nome: str
    cliente_telefone: str
    proximos: List[str] = []


class StatusIn(BaseModel):
    status: str

    @field_validator("status")
    @classmethod
    def limpar(cls, v: str) -> str:
        return v.strip().lower()


class NotificacaoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    titulo: str
    mensagem: str
    lida: bool
    criado_em: datetime

    @field_validator("criado_em")
    @classmethod
    def com_fuso_horario(cls, v: datetime) -> datetime:
        return v.replace(tzinfo=timezone.utc) if v.tzinfo is None else v


class ListaNotificacoesOut(BaseModel):
    nao_lidas: int
    itens: List[NotificacaoOut]


# ---------- COMMANDIZ CLUB ----------

class RecompensaOut(BaseModel):
    id: str
    titulo: str
    custo: int


class MovimentoOut(BaseModel):
    pontos: int
    motivo: str
    criado_em: datetime

    @field_validator("criado_em")
    @classmethod
    def com_fuso_horario(cls, v: datetime) -> datetime:
        return v.replace(tzinfo=timezone.utc) if v.tzinfo is None else v


class ClubeOut(BaseModel):
    pontos: int
    ganhos_totais: int
    nivel: str
    proximo_nivel: Optional[str] = None
    faltam: int
    progresso: float
    recompensas: List[RecompensaOut]
    historico: List[MovimentoOut]


class ResgatarIn(BaseModel):
    recompensa_id: str


class ResgateOut(BaseModel):
    codigo: str
    descricao: str
    validade: datetime

    @field_validator("validade")
    @classmethod
    def com_fuso_horario(cls, v: datetime) -> datetime:
        return v.replace(tzinfo=timezone.utc) if v.tzinfo is None else v


# ---------- ADMINISTRAÇÃO: CARDÁPIO, CATEGORIAS E CUPONS ----------

class ProdutoAdminIn(BaseModel):
    """Serve para criar e editar espetos e combos. Na edição, só vale o que for enviado."""

    nome: Optional[str] = None
    descricao: Optional[str] = None
    preco: Optional[Decimal] = None
    preco_original: Optional[Decimal] = None  # só combos
    imagem: Optional[str] = None
    categoria_id: Optional[int] = None  # só espetos
    ativo: Optional[bool] = None

    @field_validator("nome")
    @classmethod
    def validar_nome(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        v = v.strip()
        if not v:
            raise ValueError("Informe o nome")
        if len(v) > 100:
            raise ValueError("O nome pode ter no máximo 100 caracteres")
        return v

    @field_validator("preco", "preco_original")
    @classmethod
    def validar_precos(cls, v: Optional[Decimal]) -> Optional[Decimal]:
        if v is None:
            return None
        return _validar_preco(v)

    @field_validator("imagem")
    @classmethod
    def validar_imagem(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        v = v.strip()
        if v and not re.match(r"^https?://", v):
            raise ValueError("A imagem deve ser um link que começa com http:// ou https://")
        if len(v) > 500:
            raise ValueError("O link da imagem é longo demais")
        return v


class EspetoAdminOut(EspetoOut):
    ativo: Optional[bool] = True


class ComboAdminOut(ComboOut):
    ativo: Optional[bool] = True


class CategoriaAdminIn(BaseModel):
    nome: str
    ordem: int = 0

    @field_validator("nome")
    @classmethod
    def validar_nome(cls, v: str) -> str:
        v = v.strip()
        if not v or len(v) > 60:
            raise ValueError("Informe o nome da categoria (até 60 letras)")
        return v


class CardapioAdminOut(BaseModel):
    espetos: List[EspetoAdminOut]
    combos: List[ComboAdminOut]
    categorias: List[CategoriaOut]


class CupomAdminIn(BaseModel):
    codigo: str
    descricao: Optional[str] = None
    tipo: str
    valor: Decimal
    minimo: Decimal = Decimal("0.00")
    validade_dias: Optional[int] = None  # vale por quantos dias a partir de agora
    limite_usos: Optional[int] = None
    ativo: bool = True

    @field_validator("codigo")
    @classmethod
    def validar_codigo(cls, v: str) -> str:
        v = v.strip().upper()
        if not re.fullmatch(r"[A-Z0-9_-]{3,30}", v):
            raise ValueError("O código deve ter de 3 a 30 letras, números, - ou _")
        return v

    @field_validator("tipo")
    @classmethod
    def validar_tipo(cls, v: str) -> str:
        v = v.strip().lower()
        if v not in ("percentual", "valor"):
            raise ValueError("O tipo deve ser 'percentual' ou 'valor'")
        return v

    @field_validator("valor")
    @classmethod
    def validar_valor(cls, v: Decimal) -> Decimal:
        v = _validar_preco(v)
        if v <= 0:
            raise ValueError("O valor do desconto precisa ser maior que zero")
        return v

    @field_validator("minimo")
    @classmethod
    def validar_minimo(cls, v: Decimal) -> Decimal:
        return _validar_preco(v)

    @field_validator("validade_dias", "limite_usos")
    @classmethod
    def validar_positivos(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and v < 1:
            raise ValueError("Informe um número maior que zero (ou deixe em branco)")
        return v

    @model_validator(mode="after")
    def percentual_ate_100(self):
        if self.tipo == "percentual" and self.valor > 100:
            raise ValueError("Desconto percentual não pode passar de 100")
        return self


class CupomAdminPatch(BaseModel):
    ativo: Optional[bool] = None
    descricao: Optional[str] = None
    limite_usos: Optional[int] = None
    validade_dias: Optional[int] = None

    @field_validator("limite_usos", "validade_dias")
    @classmethod
    def validar_positivos(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and v < 1:
            raise ValueError("Informe um número maior que zero")
        return v


class CupomAdminOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    codigo: str
    descricao: str
    tipo: str
    valor: float
    minimo: float
    validade: Optional[datetime] = None
    limite_usos: Optional[int] = None
    usos: int
    ativo: bool
    cliente_id: Optional[int] = None

    @field_validator("valor", "minimo", mode="before")
    @classmethod
    def para_float(cls, v):
        return float(v)

    @field_validator("validade")
    @classmethod
    def com_fuso_horario(cls, v: Optional[datetime]) -> Optional[datetime]:
        if v is None:
            return None
        return v.replace(tzinfo=timezone.utc) if v.tzinfo is None else v

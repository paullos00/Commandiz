# As tabelas do banco (mesmas do app.py antigo em Flask).

from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Table,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from database import Base

favoritos = Table(
    "favoritos",
    Base.metadata,
    Column("cliente_id", Integer, ForeignKey("clientes.id", ondelete="CASCADE"), primary_key=True),
    Column("espeto_id", Integer, ForeignKey("espetos.id", ondelete="CASCADE"), primary_key=True),
)


class Cliente(Base):
    __tablename__ = "clientes"

    id = Column(Integer, primary_key=True)
    nome = Column(String(100), nullable=False)
    email = Column(String(120), unique=True, nullable=False)
    telefone = Column(String(20), nullable=False)
    senha_hash = Column(String(128))  # nunca guardamos a senha, só o "embaralhado" (bcrypt)

    espetos_favoritos = relationship("Espeto", secondary=favoritos, backref="clientes_favoritaram")
    carrinho = relationship(
        "Carrinho",
        back_populates="cliente",
        uselist=False,
        cascade="all, delete-orphan",
    )


class Espeto(Base):
    __tablename__ = "espetos"

    id = Column(Integer, primary_key=True)
    nome = Column(String(100), nullable=False)
    descricao = Column(Text)
    preco = Column(Numeric(10, 2), nullable=False)
    imagem = Column(String(500))
    categoria_id = Column(Integer, ForeignKey("categorias.id"))
    ativo = Column(Boolean, nullable=False, default=True)  # False = escondido do cardápio


class Combo(Base):
    __tablename__ = "combos"

    id = Column(Integer, primary_key=True)
    nome = Column(String(100), nullable=False)
    descricao = Column(Text)
    preco = Column(Numeric(10, 2), nullable=False)
    preco_original = Column(Numeric(10, 2))
    imagem = Column(String(500))
    ativo = Column(Boolean, nullable=False, default=True)


class Carrinho(Base):
    __tablename__ = "carrinhos"

    id = Column(Integer, primary_key=True)
    cliente_id = Column(
        Integer,
        ForeignKey("clientes.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )

    cliente = relationship("Cliente", back_populates="carrinho")
    itens = relationship("ItemCarrinho", back_populates="carrinho", cascade="all, delete-orphan")


class ItemCarrinho(Base):
    __tablename__ = "itens_carrinho"

    id = Column(Integer, primary_key=True)
    carrinho_id = Column(Integer, ForeignKey("carrinhos.id", ondelete="CASCADE"), nullable=False)
    espeto_id = Column(Integer, ForeignKey("espetos.id"))
    combo_id = Column(Integer, ForeignKey("combos.id"))
    quantidade = Column(Integer, nullable=False, default=1)
    preco_unitario = Column(Numeric(10, 2), nullable=False)
    observacao = Column(String(140))  # ex.: "sem cebola"

    carrinho = relationship("Carrinho", back_populates="itens")
    espeto = relationship("Espeto")
    combo = relationship("Combo")

    __table_args__ = (
        CheckConstraint("quantidade > 0"),
        CheckConstraint(
            "(espeto_id IS NOT NULL AND combo_id IS NULL) OR "
            "(espeto_id IS NULL AND combo_id IS NOT NULL)"
        ),
        UniqueConstraint("carrinho_id", "espeto_id", name="uq_carrinho_espeto"),
        UniqueConstraint("carrinho_id", "combo_id", name="uq_carrinho_combo"),
    )


def _agora():
    return datetime.now(timezone.utc)


class Pedido(Base):
    __tablename__ = "pedidos"

    id = Column(Integer, primary_key=True)
    cliente_id = Column(Integer, ForeignKey("clientes.id"), nullable=False)
    total = Column(Numeric(10, 2), nullable=False)
    forma_pagamento = Column(String(20), nullable=False)
    status = Column(String(20), nullable=False, default="recebido")
    valor_pago = Column(Numeric(10, 2))  # só no pagamento em dinheiro
    troco = Column(Numeric(10, 2))  # só no pagamento em dinheiro
    cupom_codigo = Column(String(30))
    desconto = Column(Numeric(10, 2))
    criado_em = Column(DateTime, nullable=False, default=_agora)

    itens = relationship("ItemPedido", back_populates="pedido", cascade="all, delete-orphan")
    avaliacao = relationship("Avaliacao", back_populates="pedido", uselist=False, cascade="all, delete-orphan")
    cliente = relationship("Cliente")


class ItemPedido(Base):
    """Guarda uma 'foto' do item na hora da compra (nome e preço), para o histórico
    continuar certo mesmo que o cardápio mude depois."""

    __tablename__ = "itens_pedido"

    id = Column(Integer, primary_key=True)
    pedido_id = Column(Integer, ForeignKey("pedidos.id", ondelete="CASCADE"), nullable=False)
    espeto_id = Column(Integer)
    combo_id = Column(Integer)
    nome = Column(String(100), nullable=False)
    quantidade = Column(Integer, nullable=False)
    preco_unitario = Column(Numeric(10, 2), nullable=False)
    observacao = Column(String(140))

    pedido = relationship("Pedido", back_populates="itens")


def agora_naive() -> datetime:
    """Data/hora atual em UTC, sem fuso (é assim que gravamos no banco)."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


class RecuperacaoSenha(Base):
    """Código de 6 números enviado por e-mail para redefinir a senha (guardamos só o hash)."""

    __tablename__ = "recuperacoes_senha"

    id = Column(Integer, primary_key=True)
    cliente_id = Column(Integer, ForeignKey("clientes.id", ondelete="CASCADE"), nullable=False)
    codigo_hash = Column(String(64), nullable=False)
    expira_em = Column(DateTime, nullable=False)
    tentativas = Column(Integer, nullable=False, default=0)
    usado = Column(Boolean, nullable=False, default=False)
    criado_em = Column(DateTime, nullable=False, default=agora_naive)


class Avaliacao(Base):
    """Nota (1 a 5) e comentário do cliente sobre um pedido. Cada pedido tem no máximo uma."""

    __tablename__ = "avaliacoes"

    id = Column(Integer, primary_key=True)
    pedido_id = Column(Integer, ForeignKey("pedidos.id", ondelete="CASCADE"), unique=True, nullable=False)
    cliente_id = Column(Integer, ForeignKey("clientes.id"), nullable=False)
    nota = Column(Integer, nullable=False)
    comentario = Column(String(500))
    criado_em = Column(DateTime, nullable=False, default=agora_naive)

    pedido = relationship("Pedido", back_populates="avaliacao")
    cliente = relationship("Cliente")

    __table_args__ = (CheckConstraint("nota >= 1 AND nota <= 5"),)


class Categoria(Base):
    __tablename__ = "categorias"

    id = Column(Integer, primary_key=True)
    nome = Column(String(60), unique=True, nullable=False)
    ordem = Column(Integer, nullable=False, default=0)


class Cupom(Base):
    """Cupom de desconto. tipo = "percentual" (valor = % de desconto) ou "valor" (valor = R$)."""

    __tablename__ = "cupons"

    id = Column(Integer, primary_key=True)
    codigo = Column(String(30), unique=True, nullable=False)
    descricao = Column(String(120), nullable=False, default="")
    tipo = Column(String(10), nullable=False)
    valor = Column(Numeric(10, 2), nullable=False)
    minimo = Column(Numeric(10, 2), nullable=False, default=0)  # pedido mínimo
    validade = Column(DateTime)  # vazio = não vence
    limite_usos = Column(Integer)  # vazio = sem limite no total
    usos = Column(Integer, nullable=False, default=0)
    ativo = Column(Boolean, nullable=False, default=True)
    cliente_id = Column(Integer, ForeignKey("clientes.id"))  # preenchido = cupom só desse cliente
    criado_em = Column(DateTime, nullable=False, default=agora_naive)


class CupomUso(Base):
    """Registra quem já usou qual cupom (cada cliente usa cada cupom uma vez)."""

    __tablename__ = "cupons_usos"

    id = Column(Integer, primary_key=True)
    cupom_id = Column(Integer, ForeignKey("cupons.id"), nullable=False)
    cliente_id = Column(Integer, ForeignKey("clientes.id"), nullable=False)
    pedido_id = Column(Integer)
    criado_em = Column(DateTime, nullable=False, default=agora_naive)

    __table_args__ = (UniqueConstraint("cupom_id", "cliente_id", name="uq_cupom_cliente"),)


class Notificacao(Base):
    """Aviso para o cliente (ex.: 'Seu pedido está em preparo')."""

    __tablename__ = "notificacoes"

    id = Column(Integer, primary_key=True)
    cliente_id = Column(Integer, ForeignKey("clientes.id", ondelete="CASCADE"), nullable=False)
    titulo = Column(String(80), nullable=False)
    mensagem = Column(String(300), nullable=False)
    lida = Column(Boolean, nullable=False, default=False)
    criado_em = Column(DateTime, nullable=False, default=agora_naive)


class MovimentoPontos(Base):
    """Extrato do Commandiz Club: pontos ganhos (+) e resgatados (-)."""

    __tablename__ = "movimentos_pontos"

    id = Column(Integer, primary_key=True)
    cliente_id = Column(Integer, ForeignKey("clientes.id", ondelete="CASCADE"), nullable=False)
    pontos = Column(Integer, nullable=False)
    motivo = Column(String(120), nullable=False)
    pedido_id = Column(Integer)
    criado_em = Column(DateTime, nullable=False, default=agora_naive)

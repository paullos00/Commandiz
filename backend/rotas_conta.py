# Arquivo: backend/rotas_conta.py
# Recuperar senha (código por e-mail) e alterar o e-mail da conta.

import hmac
import hashlib
import secrets
from datetime import timedelta

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

import schemas
from auth import cliente_atual, gerar_hash, verificar_senha
from config import settings
from database import get_db
from email_envio import enviar_email
from models import Cliente, RecuperacaoSenha, agora_naive
from redis_cliente import limite_excedido

router = APIRouter(prefix="/auth", tags=["Conta"])

VALIDADE_CODIGO_MINUTOS = 15
MAXIMO_TENTATIVAS_CODIGO = 5


def _hash_codigo(cliente_id: int, codigo: str) -> str:
    chave = settings.SECRET_KEY.encode("utf-8")
    return hmac.new(chave, f"{cliente_id}:{codigo}".encode("utf-8"), hashlib.sha256).hexdigest()


def _ip(request: Request) -> str:
    return request.client.host if request.client else "desconhecido"


@router.post("/recuperar", response_model=schemas.MensagemOut)
def recuperar_senha(
    dados: schemas.RecuperarIn,
    request: Request,
    tarefas: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Envia um código de 6 números para o e-mail. A resposta é sempre a mesma,
    exista ou não a conta (assim ninguém descobre quem tem cadastro)."""
    espera = limite_excedido(f"recuperar:{_ip(request)}:{dados.email}", maximo=3, janela_segundos=3600)
    if espera:
        raise HTTPException(status_code=429, detail=f"Muitos pedidos. Tente de novo em {(espera + 59) // 60} minuto(s).")

    cliente = db.execute(select(Cliente).where(Cliente.email == dados.email)).scalar_one_or_none()
    if cliente is not None:
        codigo = f"{secrets.randbelow(1_000_000):06d}"

        # códigos antigos deixam de valer
        db.execute(
            update(RecuperacaoSenha)
            .where(RecuperacaoSenha.cliente_id == cliente.id, RecuperacaoSenha.usado.is_(False))
            .values(usado=True)
        )
        db.add(
            RecuperacaoSenha(
                cliente_id=cliente.id,
                codigo_hash=_hash_codigo(cliente.id, codigo),
                expira_em=agora_naive() + timedelta(minutes=VALIDADE_CODIGO_MINUTOS),
            )
        )
        db.commit()

        texto = (
            f"Olá, {cliente.nome}!\n\n"
            f"Seu código para redefinir a senha do Commandiz é: {codigo}\n\n"
            f"Ele vale por {VALIDADE_CODIGO_MINUTOS} minutos. "
            "Se você não pediu isso, ignore esta mensagem: sua senha continua a mesma."
        )
        tarefas.add_task(enviar_email, cliente.email, "Código para redefinir sua senha", texto)

    return {"mensagem": "Se o e-mail estiver cadastrado, enviamos um código de 6 números (vale por 15 minutos)."}


@router.post("/redefinir", response_model=schemas.MensagemOut)
def redefinir_senha(dados: schemas.RedefinirIn, request: Request, db: Session = Depends(get_db)):
    espera = limite_excedido(f"redefinir:{_ip(request)}:{dados.email}", maximo=10, janela_segundos=3600)
    if espera:
        raise HTTPException(status_code=429, detail=f"Muitas tentativas. Tente de novo em {(espera + 59) // 60} minuto(s).")

    invalido = HTTPException(status_code=400, detail="Código inválido ou expirado")

    cliente = db.execute(select(Cliente).where(Cliente.email == dados.email)).scalar_one_or_none()
    if cliente is None:
        raise invalido

    pedido = db.execute(
        select(RecuperacaoSenha)
        .where(RecuperacaoSenha.cliente_id == cliente.id, RecuperacaoSenha.usado.is_(False))
        .order_by(RecuperacaoSenha.id.desc())
        .limit(1)
    ).scalar_one_or_none()

    if pedido is None or pedido.expira_em < agora_naive() or pedido.tentativas >= MAXIMO_TENTATIVAS_CODIGO:
        raise invalido

    if not hmac.compare_digest(pedido.codigo_hash, _hash_codigo(cliente.id, dados.codigo)):
        pedido.tentativas += 1
        db.commit()
        raise invalido

    cliente.senha_hash = gerar_hash(dados.senha_nova)
    pedido.usado = True
    db.commit()
    return {"mensagem": "Senha alterada com sucesso. Entre com a nova senha."}


@router.put("/email", response_model=schemas.ClienteOut)
def alterar_email(
    dados: schemas.AlterarEmailIn,
    tarefas: BackgroundTasks,
    cliente: Cliente = Depends(cliente_atual),
    db: Session = Depends(get_db),
):
    """Troca o e-mail (que é o login). Pede a senha para confirmar."""
    if not cliente.senha_hash or not verificar_senha(dados.senha, cliente.senha_hash):
        raise HTTPException(status_code=400, detail="Senha incorreta")
    if dados.email_novo == cliente.email:
        raise HTTPException(status_code=400, detail="O novo e-mail é igual ao atual")

    email_antigo = cliente.email
    cliente.email = dados.email_novo
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Este e-mail já está cadastrado")

    db.refresh(cliente)
    tarefas.add_task(
        enviar_email,
        email_antigo,
        "Seu e-mail no Commandiz foi alterado",
        f"Olá, {cliente.nome}!\n\nO e-mail da sua conta agora é {dados.email_novo}. "
        "Se não foi você, redefina sua senha imediatamente.",
    )
    return cliente

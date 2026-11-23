# Segurança: senha embaralhada com bcrypt + login com token JWT (PyJWT).
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from config import settings
from database import get_db
from models import Cliente

ALGORITMO = "HS256"

# auto_error=False: quem monta a mensagem de erro somos nós ({"erro": "..."}).
bearer = HTTPBearer(auto_error=False)


def gerar_hash(senha: str) -> str:
    return bcrypt.hashpw(senha.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verificar_senha(senha: str, senha_hash: str) -> bool:
    try:
        return bcrypt.checkpw(senha.encode("utf-8"), senha_hash.encode("utf-8"))
    except ValueError:
        return False


def criar_token(cliente_id: int) -> str:
    agora = datetime.now(timezone.utc)
    dados = {
        "sub": str(cliente_id),
        "iat": agora,
        "exp": agora + timedelta(minutes=settings.TOKEN_EXPIRA_MINUTOS),
    }
    return jwt.encode(dados, settings.SECRET_KEY, algorithm=ALGORITMO)


def cliente_atual(
    credenciais: Optional[HTTPAuthorizationCredentials] = Depends(bearer),
    db: Session = Depends(get_db),
) -> Cliente:
    """O 'porteiro': só deixa passar quem mandou um token válido."""
    cabecalho = {"WWW-Authenticate": "Bearer"}

    if credenciais is None:
        raise HTTPException(status_code=401, detail="Faça login para continuar", headers=cabecalho)

    try:
        dados = jwt.decode(credenciais.credentials, settings.SECRET_KEY, algorithms=[ALGORITMO])
        cliente_id = int(dados["sub"])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Sessão expirada. Faça login novamente", headers=cabecalho)
    except (jwt.InvalidTokenError, KeyError, ValueError):
        raise HTTPException(status_code=401, detail="Token inválido", headers=cabecalho)

    cliente = db.get(Cliente, cliente_id)
    if cliente is None:
        raise HTTPException(status_code=401, detail="Token inválido", headers=cabecalho)
    return cliente


def cliente_da_rota(cliente_id: int, atual: Cliente = Depends(cliente_atual)) -> Cliente:
    """Garante que o cliente logado só mexe nos PRÓPRIOS dados."""
    if cliente_id != atual.id:
        raise HTTPException(status_code=403, detail="Você não tem permissão para acessar os dados de outro cliente")
    return atual



def admin_atual(cliente: Cliente = Depends(cliente_atual)) -> Cliente:
    """Só deixa passar quem tem o e-mail listado em ADMIN_EMAILS (no .env)."""
    if cliente.email.lower() not in settings.admin_emails:
        raise HTTPException(status_code=403, detail="Acesso restrito a administradores")
    return cliente

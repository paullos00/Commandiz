# Arquivo: backend/tests/conftest.py
# Prepara os testes: usa um banco TEMPORÁRIO (seu banco de verdade não é tocado),
# sem Redis, sem Sentry e sem e-mail.

import os
import sys
import tempfile
import uuid

_pasta_temporaria = tempfile.mkdtemp()
os.environ["DATABASE_URL"] = f"sqlite:///{_pasta_temporaria}/teste.db"
os.environ["SECRET_KEY"] = "chave-de-teste-chave-de-teste-chave-de-teste-123456"
os.environ["REDIS_URL"] = ""
os.environ["SENTRY_DSN"] = ""
os.environ["SMTP_HOST"] = ""
os.environ["DEBUG_MODE"] = "False"
os.environ["ADMIN_EMAILS"] = "admin@teste.com"
os.environ["PIX_CHAVE"] = "loja@teste.com"
os.environ["PIX_NOME_RECEBEDOR"] = "Espetaria Teste"
os.environ["PIX_CIDADE"] = "Sao Paulo"

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402


@pytest.fixture(scope="session")
def client():
    import main

    with TestClient(main.app) as c:
        yield c


def criar_cliente(client, email=None, senha="123456", nome="Cliente Teste"):
    email = email or f"{uuid.uuid4().hex[:10]}@teste.com"
    r = client.post(
        "/auth/registrar",
        json={"nome": nome, "email": email, "telefone": "11999999999", "senha": senha},
    )
    assert r.status_code == 201, r.text
    dados = r.json()
    return {
        "id": dados["cliente"]["id"],
        "email": email,
        "senha": senha,
        "headers": {"Authorization": f"Bearer {dados['access_token']}"},
    }


@pytest.fixture()
def cliente(client):
    return criar_cliente(client)


@pytest.fixture(scope="session")
def admin(client):
    return criar_cliente(client, email="admin@teste.com", nome="Admin")

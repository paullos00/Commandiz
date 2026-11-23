# Arquivo: backend/redis_cliente.py
# Redis = uma "memória rápida" do servidor. Usamos para duas coisas:
#   1) CACHE: guardar o cardápio pronto, para não consultar o banco toda hora.
#   2) LIMITE DE TENTATIVAS: barrar quem erra a senha muitas vezes seguidas.
#
# O Redis é OPCIONAL: se REDIS_URL estiver vazio no .env, ou se o Redis cair,
# o servidor continua funcionando normalmente (só fica sem cache e sem limite).

import json
from typing import Any, Optional

import redis

from config import settings

_cliente: Optional["redis.Redis"] = None


def obter_redis() -> Optional["redis.Redis"]:
    global _cliente
    if not settings.REDIS_URL:
        return None
    if _cliente is None:
        _cliente = redis.Redis.from_url(
            settings.REDIS_URL,
            decode_responses=True,
            socket_connect_timeout=2,
            socket_timeout=2,
        )
    return _cliente


def status_redis() -> str:
    """'desligado' (sem URL), 'ok' ou 'erro' (configurado, mas sem resposta)."""
    r = obter_redis()
    if r is None:
        return "desligado"
    try:
        r.ping()
        return "ok"
    except redis.RedisError:
        return "erro"


# ---------- Cache ----------

def cache_ler(chave: str) -> Optional[Any]:
    r = obter_redis()
    if r is None:
        return None
    try:
        valor = r.get(f"commandiz:{chave}")
        return json.loads(valor) if valor else None
    except (redis.RedisError, ValueError):
        return None


def cache_gravar(chave: str, valor: Any, segundos: int = 300) -> None:
    r = obter_redis()
    if r is None:
        return
    try:
        r.setex(f"commandiz:{chave}", segundos, json.dumps(valor))
    except (redis.RedisError, TypeError):
        pass


def cache_apagar(chave: str) -> None:
    """Use quando o cardápio mudar (ex.: um administrador editar um espeto)."""
    r = obter_redis()
    if r is None:
        return
    try:
        r.delete(f"commandiz:{chave}")
    except redis.RedisError:
        pass


# ---------- Limite de tentativas ----------

def limite_excedido(chave: str, maximo: int, janela_segundos: int) -> int:
    """Conta mais uma tentativa. Devolve 0 se ainda pode tentar, ou quantos
    segundos faltam para liberar quando passou do limite."""
    r = obter_redis()
    if r is None:
        return 0
    try:
        nome = f"commandiz:limite:{chave}"
        tentativas = r.incr(nome)
        if tentativas == 1:
            r.expire(nome, janela_segundos)
        if tentativas > maximo:
            return max(r.ttl(nome), 1)
        return 0
    except redis.RedisError:
        return 0


def limpar_limite(chave: str) -> None:
    r = obter_redis()
    if r is None:
        return
    try:
        r.delete(f"commandiz:limite:{chave}")
    except redis.RedisError:
        pass

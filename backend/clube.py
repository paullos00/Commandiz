# Arquivo: backend/clube.py
# Regras do Commandiz Club (fidelidade). Para mudar as regras, edite só as constantes abaixo.

import secrets
from datetime import timedelta
from decimal import Decimal

from fastapi import HTTPException
from sqlalchemy import func, select

from models import Cupom, MovimentoPontos, agora_naive
from servicos import notificar

PONTOS_POR_REAL = 1  # 1 ponto a cada R$ 1,00 do pedido (parte inteira)

# (nome, pontos acumulados necessários). Os níveis usam os pontos GANHOS no total.
NIVEIS = [("Bronze", 0), ("Prata", 100), ("Ouro", 300), ("Diamante", 600)]

# Recompensas: cada uma vira um cupom de desconto só do cliente, válido por 30 dias.
RECOMPENSAS = [
    {"id": "desc5", "titulo": "Cupom de R$ 5,00", "custo": 50, "valor": Decimal("5.00")},
    {"id": "desc10", "titulo": "Cupom de R$ 10,00", "custo": 100, "valor": Decimal("10.00")},
    {"id": "desc25", "titulo": "Cupom de R$ 25,00", "custo": 250, "valor": Decimal("25.00")},
]

VALIDADE_CUPOM_DIAS = 30


def saldo(db, cliente_id: int) -> int:
    return int(db.scalar(select(func.coalesce(func.sum(MovimentoPontos.pontos), 0)).where(MovimentoPontos.cliente_id == cliente_id)) or 0)


def ganhos_totais(db, cliente_id: int) -> int:
    return int(
        db.scalar(
            select(func.coalesce(func.sum(MovimentoPontos.pontos), 0)).where(
                MovimentoPontos.cliente_id == cliente_id, MovimentoPontos.pontos > 0
            )
        )
        or 0
    )


def calcular_nivel(ganhos: int) -> dict:
    atual = NIVEIS[0]
    for nivel in NIVEIS:
        if ganhos >= nivel[1]:
            atual = nivel
    proximo = next((n for n in NIVEIS if n[1] > ganhos), None)

    if proximo is None:
        return {"nivel": atual[0], "proximo_nivel": None, "faltam": 0, "progresso": 1.0}

    faixa = proximo[1] - atual[1]
    return {
        "nivel": atual[0],
        "proximo_nivel": proximo[0],
        "faltam": proximo[1] - ganhos,
        "progresso": round((ganhos - atual[1]) / faixa, 2),
    }


def creditar_pontos(db, pedido) -> None:
    """Dá os pontos de um pedido entregue (uma vez só por pedido). Quem chama faz o commit."""
    pontos = int(pedido.total) * PONTOS_POR_REAL
    if pontos <= 0:
        return
    ja_creditado = db.execute(
        select(MovimentoPontos.id).where(MovimentoPontos.pedido_id == pedido.id, MovimentoPontos.pontos > 0)
    ).first()
    if ja_creditado:
        return

    db.add(MovimentoPontos(cliente_id=pedido.cliente_id, pontos=pontos, motivo=f"Pedido #{pedido.id}", pedido_id=pedido.id))
    notificar(db, pedido.cliente_id, "Pontos do Clube 👑", f"Você ganhou {pontos} pontos com o pedido #{pedido.id}.")


def resgatar(db, cliente, recompensa_id: str) -> Cupom:
    recompensa = next((r for r in RECOMPENSAS if r["id"] == recompensa_id), None)
    if recompensa is None:
        raise HTTPException(status_code=404, detail="Recompensa não encontrada")
    if saldo(db, cliente.id) < recompensa["custo"]:
        raise HTTPException(status_code=409, detail="Você não tem pontos suficientes")

    cupom = Cupom(
        codigo=f"CLUB{secrets.token_hex(3).upper()}",
        descricao=f"Clube: {recompensa['titulo']}",
        tipo="valor",
        valor=recompensa["valor"],
        minimo=Decimal("0.00"),
        limite_usos=1,
        validade=agora_naive() + timedelta(days=VALIDADE_CUPOM_DIAS),
        cliente_id=cliente.id,
    )
    db.add(cupom)
    db.add(MovimentoPontos(cliente_id=cliente.id, pontos=-recompensa["custo"], motivo=f"Resgate: {recompensa['titulo']}"))
    db.flush()
    return cupom

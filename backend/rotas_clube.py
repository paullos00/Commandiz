# Arquivo: backend/rotas_clube.py
# Commandiz Club: pontos, nível e resgate de recompensas.

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

import schemas
from auth import cliente_da_rota
from clube import RECOMPENSAS, calcular_nivel, ganhos_totais, resgatar, saldo
from database import get_db
from models import Cliente, MovimentoPontos

router = APIRouter(tags=["Clube"])


@router.get("/clientes/{cliente_id}/clube", response_model=schemas.ClubeOut)
def ver_clube(cliente: Cliente = Depends(cliente_da_rota), db: Session = Depends(get_db)):
    ganhos = ganhos_totais(db, cliente.id)
    historico = db.execute(
        select(MovimentoPontos)
        .where(MovimentoPontos.cliente_id == cliente.id)
        .order_by(MovimentoPontos.id.desc())
        .limit(20)
    ).scalars().all()

    return {
        "pontos": saldo(db, cliente.id),
        "ganhos_totais": ganhos,
        **calcular_nivel(ganhos),
        "recompensas": [{"id": r["id"], "titulo": r["titulo"], "custo": r["custo"]} for r in RECOMPENSAS],
        "historico": [{"pontos": m.pontos, "motivo": m.motivo, "criado_em": m.criado_em} for m in historico],
    }


@router.post("/clientes/{cliente_id}/clube/resgatar", response_model=schemas.ResgateOut, status_code=201)
def resgatar_recompensa(
    dados: schemas.ResgatarIn,
    cliente: Cliente = Depends(cliente_da_rota),
    db: Session = Depends(get_db),
):
    cupom = resgatar(db, cliente, dados.recompensa_id)
    db.commit()
    return {"codigo": cupom.codigo, "descricao": cupom.descricao, "validade": cupom.validade}

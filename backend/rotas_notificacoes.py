# Arquivo: backend/rotas_notificacoes.py
# Central de notificações do cliente.

from fastapi import APIRouter, Depends
from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

import schemas
from auth import cliente_da_rota
from database import get_db
from models import Cliente, Notificacao

router = APIRouter(tags=["Notificações"])


@router.get("/clientes/{cliente_id}/notificacoes", response_model=schemas.ListaNotificacoesOut)
def listar_notificacoes(cliente: Cliente = Depends(cliente_da_rota), db: Session = Depends(get_db)):
    itens = db.execute(
        select(Notificacao).where(Notificacao.cliente_id == cliente.id).order_by(Notificacao.id.desc()).limit(50)
    ).scalars().all()
    nao_lidas = db.scalar(
        select(func.count(Notificacao.id)).where(Notificacao.cliente_id == cliente.id, Notificacao.lida.is_(False))
    )
    return {"nao_lidas": int(nao_lidas or 0), "itens": itens}


@router.post("/clientes/{cliente_id}/notificacoes/lidas", response_model=schemas.MensagemOut)
def marcar_como_lidas(cliente: Cliente = Depends(cliente_da_rota), db: Session = Depends(get_db)):
    db.execute(
        update(Notificacao)
        .where(Notificacao.cliente_id == cliente.id, Notificacao.lida.is_(False))
        .values(lida=True)
    )
    db.commit()
    return {"mensagem": "Notificações marcadas como lidas"}

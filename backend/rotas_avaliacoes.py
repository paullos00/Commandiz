# Arquivo: backend/rotas_avaliacoes.py
# Avaliações dos pedidos (nota de 1 a 5 e comentário).

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

import schemas
from auth import cliente_da_rota
from database import get_db
from models import Avaliacao, Cliente, Pedido
from redis_cliente import cache_apagar, cache_gravar, cache_ler
from servicos import montar_avaliacao

router = APIRouter(tags=["Avaliações"])


@router.post(
    "/clientes/{cliente_id}/pedidos/{pedido_id}/avaliacao",
    response_model=schemas.AvaliacaoOut,
    status_code=201,
)
def avaliar_pedido(
    pedido_id: int,
    dados: schemas.AvaliacaoIn,
    cliente: Cliente = Depends(cliente_da_rota),
    db: Session = Depends(get_db),
):
    pedido = db.get(Pedido, pedido_id)
    if pedido is None or pedido.cliente_id != cliente.id:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    if pedido.status == "cancelado":
        raise HTTPException(status_code=409, detail="Um pedido cancelado não pode ser avaliado")
    if pedido.avaliacao is not None:
        raise HTTPException(status_code=409, detail="Este pedido já foi avaliado")

    avaliacao = Avaliacao(pedido_id=pedido.id, cliente_id=cliente.id, nota=dados.nota, comentario=dados.comentario)
    db.add(avaliacao)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Este pedido já foi avaliado")

    db.refresh(avaliacao)
    cache_apagar("resumo_avaliacoes")
    return montar_avaliacao(avaliacao)


@router.get("/avaliacoes", response_model=schemas.ResumoAvaliacoesOut)
def resumo_avaliacoes(db: Session = Depends(get_db)):
    """Nota média e últimos comentários (público; mostra só o primeiro nome)."""
    guardado = cache_ler("resumo_avaliacoes")
    if guardado is not None:
        return guardado

    media, total = db.execute(select(func.avg(Avaliacao.nota), func.count(Avaliacao.id))).one()
    recentes = db.execute(
        select(Avaliacao).where(Avaliacao.comentario.is_not(None)).order_by(Avaliacao.id.desc()).limit(5)
    ).scalars().all()

    resposta = {
        "media": round(float(media), 1) if media is not None else 0.0,
        "total": int(total or 0),
        "recentes": [
            {
                "nome": (a.cliente.nome.split()[0] if a.cliente and a.cliente.nome else "Cliente"),
                "nota": a.nota,
                "comentario": a.comentario,
                "criado_em": a.criado_em.isoformat(),
            }
            for a in recentes
        ],
    }
    cache_gravar("resumo_avaliacoes", resposta)
    return resposta

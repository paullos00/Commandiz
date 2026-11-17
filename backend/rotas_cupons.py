# Arquivo: backend/rotas_cupons.py
# Cupons: conferir um código no carrinho e listar os cupons disponíveis para o cliente.

from decimal import Decimal
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

import schemas
from auth import cliente_da_rota
from cupons_servico import validar_cupom
from database import get_db
from models import Cliente, Cupom, CupomUso, agora_naive

router = APIRouter(tags=["Cupons"])


@router.post("/clientes/{cliente_id}/cupons/validar", response_model=schemas.ValidacaoCupomOut)
def validar(
    dados: schemas.CupomValidarIn,
    cliente: Cliente = Depends(cliente_da_rota),
    db: Session = Depends(get_db),
):
    carrinho = cliente.carrinho
    if carrinho is None or not carrinho.itens:
        raise HTTPException(status_code=409, detail="Seu carrinho está vazio")

    subtotal = sum((i.preco_unitario * i.quantidade for i in carrinho.itens), Decimal("0.00"))
    cupom, desconto = validar_cupom(db, dados.codigo, cliente, subtotal)

    return {
        "codigo": cupom.codigo,
        "descricao": cupom.descricao,
        "desconto": float(desconto),
        "subtotal": float(subtotal),
        "total": float(subtotal - desconto),
    }


@router.get("/clientes/{cliente_id}/cupons", response_model=List[schemas.CupomDisponivelOut])
def cupons_disponiveis(cliente: Cliente = Depends(cliente_da_rota), db: Session = Depends(get_db)):
    """Cupons que este cliente ainda pode usar (públicos e os exclusivos dele)."""
    usados = select(CupomUso.cupom_id).where(CupomUso.cliente_id == cliente.id)
    consulta = (
        select(Cupom)
        .where(
            Cupom.ativo.is_(True),
            or_(Cupom.cliente_id.is_(None), Cupom.cliente_id == cliente.id),
            or_(Cupom.validade.is_(None), Cupom.validade >= agora_naive()),
            or_(Cupom.limite_usos.is_(None), Cupom.usos < Cupom.limite_usos),
            Cupom.id.not_in(usados),
        )
        .order_by(Cupom.id)
    )
    return db.execute(consulta).scalars().all()

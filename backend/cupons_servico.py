# Arquivo: backend/cupons_servico.py
# Regras dos cupons de desconto (usadas ao validar no carrinho e ao fechar o pedido).

from decimal import ROUND_HALF_UP, Decimal

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from models import Cliente, Cupom, CupomUso, agora_naive
from servicos import formatar_real


def calcular_desconto(cupom: Cupom, subtotal: Decimal) -> Decimal:
    if cupom.tipo == "percentual":
        desconto = (subtotal * cupom.valor / Decimal(100)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    else:
        desconto = cupom.valor
    return min(desconto, subtotal)  # o desconto nunca passa do valor do pedido


def validar_cupom(db: Session, codigo: str, cliente: Cliente, subtotal: Decimal):
    """Confere todas as regras. Devolve (cupom, desconto) ou levanta um erro com a explicação."""
    codigo = (codigo or "").strip().upper()
    cupom = db.execute(select(Cupom).where(Cupom.codigo == codigo)).scalar_one_or_none()

    if cupom is None or not cupom.ativo or (cupom.cliente_id is not None and cupom.cliente_id != cliente.id):
        raise HTTPException(status_code=404, detail="Cupom inválido")
    if cupom.validade is not None and cupom.validade < agora_naive():
        raise HTTPException(status_code=422, detail="Este cupom expirou")
    if cupom.limite_usos is not None and cupom.usos >= cupom.limite_usos:
        raise HTTPException(status_code=422, detail="Este cupom esgotou")
    if subtotal < cupom.minimo:
        raise HTTPException(
            status_code=422,
            detail=f"Pedido mínimo de R$ {formatar_real(cupom.minimo)} para usar este cupom",
        )

    ja_usou = db.execute(
        select(CupomUso.id).where(CupomUso.cupom_id == cupom.id, CupomUso.cliente_id == cliente.id)
    ).first()
    if ja_usou:
        raise HTTPException(status_code=422, detail="Você já usou este cupom")

    return cupom, calcular_desconto(cupom, subtotal)

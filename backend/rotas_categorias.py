# Arquivo: backend/rotas_categorias.py
# Categorias do cardápio (ex.: Tradicionais, Especiais, Bebidas).

from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

import schemas
from database import get_db
from models import Categoria
from redis_cliente import cache_gravar, cache_ler

router = APIRouter(tags=["Categorias"])


@router.get("/categorias", response_model=List[schemas.CategoriaOut])
def listar_categorias(db: Session = Depends(get_db)):
    guardado = cache_ler("categorias")
    if guardado is not None:
        return guardado

    categorias = db.execute(
        select(Categoria)
        .where(Categoria.visivel.is_(True))
        .order_by(Categoria.ordem, Categoria.id)
    ).scalars().all()
    resposta = [schemas.CategoriaOut.model_validate(c).model_dump() for c in categorias]
    cache_gravar("categorias", resposta)
    return resposta

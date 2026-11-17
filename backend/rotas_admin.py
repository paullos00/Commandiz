# Arquivo: backend/rotas_admin.py
# Rotas do ADMINISTRADOR (só quem tem o e-mail em ADMIN_EMAILS acessa).

from datetime import timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

import schemas
from auth import admin_atual
from database import get_db
from models import Categoria, Combo, Cupom, Espeto, Pedido, agora_naive
from redis_cliente import cache_apagar
from servicos import montar_pedido_admin, mudar_status

router = APIRouter(prefix="/admin", tags=["Administração"], dependencies=[Depends(admin_atual)])

STATUS_ATIVOS = ["recebido", "em_preparo", "pronto"]


@router.get("/pedidos", response_model=List[schemas.PedidoAdminOut])
def listar_pedidos_admin(somente_ativos: bool = False, status: Optional[str] = None, db: Session = Depends(get_db)):
    """Pedidos de todos os clientes, do mais novo para o mais antigo (até 100)."""
    consulta = select(Pedido)
    if somente_ativos:
        consulta = consulta.where(Pedido.status.in_(STATUS_ATIVOS))
    if status:
        consulta = consulta.where(Pedido.status == status.strip().lower())
    pedidos = db.execute(consulta.order_by(Pedido.id.desc()).limit(100)).scalars().all()
    return [montar_pedido_admin(p) for p in pedidos]


@router.patch("/pedidos/{pedido_id}/status", response_model=schemas.PedidoAdminOut)
def mudar_status_pedido(pedido_id: int, dados: schemas.StatusIn, db: Session = Depends(get_db)):
    pedido = db.get(Pedido, pedido_id)
    if pedido is None:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")

    mudar_status(db, pedido, dados.status)  # valida, muda e cria a notificação
    db.commit()
    db.refresh(pedido)
    return montar_pedido_admin(pedido)


# ---------- Cardápio ----------

CAMPOS_ESPETO = ("nome", "descricao", "preco", "imagem", "categoria_id", "ativo")
CAMPOS_COMBO = ("nome", "descricao", "preco", "preco_original", "imagem", "ativo")


def _aplicar(objeto, dados: schemas.ProdutoAdminIn, permitidos) -> None:
    """Copia para o objeto só os campos enviados (e permitidos)."""
    for campo, valor in dados.model_dump(exclude_unset=True).items():
        if campo not in permitidos:
            continue
        if campo in ("nome", "preco", "ativo") and valor is None:
            continue  # esses não podem ficar vazios
        if campo == "imagem" and valor == "":
            valor = None
        setattr(objeto, campo, valor)


def _conferir_categoria(db: Session, categoria_id: Optional[int]) -> None:
    if categoria_id is not None and db.get(Categoria, categoria_id) is None:
        raise HTTPException(status_code=422, detail="Categoria não encontrada")


@router.get("/cardapio", response_model=schemas.CardapioAdminOut)
def cardapio_admin(db: Session = Depends(get_db)):
    """Tudo do cardápio, inclusive os itens desativados."""
    return {
        "espetos": db.execute(select(Espeto).order_by(Espeto.id)).scalars().all(),
        "combos": db.execute(select(Combo).order_by(Combo.id)).scalars().all(),
        "categorias": db.execute(select(Categoria).order_by(Categoria.ordem, Categoria.id)).scalars().all(),
    }


@router.post("/espetos", response_model=schemas.EspetoAdminOut, status_code=201)
def criar_espeto(dados: schemas.ProdutoAdminIn, db: Session = Depends(get_db)):
    if not dados.nome or dados.preco is None:
        raise HTTPException(status_code=422, detail="Informe o nome e o preço")
    _conferir_categoria(db, dados.categoria_id)

    espeto = Espeto(ativo=True)
    _aplicar(espeto, dados, CAMPOS_ESPETO)
    db.add(espeto)
    db.commit()
    db.refresh(espeto)
    cache_apagar("espetos")
    return espeto


@router.patch("/espetos/{espeto_id}", response_model=schemas.EspetoAdminOut)
def editar_espeto(espeto_id: int, dados: schemas.ProdutoAdminIn, db: Session = Depends(get_db)):
    espeto = db.get(Espeto, espeto_id)
    if espeto is None:
        raise HTTPException(status_code=404, detail="Espeto não encontrado")
    _conferir_categoria(db, dados.categoria_id)

    _aplicar(espeto, dados, CAMPOS_ESPETO)
    db.commit()
    db.refresh(espeto)
    cache_apagar("espetos")
    return espeto


@router.post("/combos", response_model=schemas.ComboAdminOut, status_code=201)
def criar_combo(dados: schemas.ProdutoAdminIn, db: Session = Depends(get_db)):
    if not dados.nome or dados.preco is None:
        raise HTTPException(status_code=422, detail="Informe o nome e o preço")

    combo = Combo(ativo=True)
    _aplicar(combo, dados, CAMPOS_COMBO)
    db.add(combo)
    db.commit()
    db.refresh(combo)
    cache_apagar("combos")
    return combo


@router.patch("/combos/{combo_id}", response_model=schemas.ComboAdminOut)
def editar_combo(combo_id: int, dados: schemas.ProdutoAdminIn, db: Session = Depends(get_db)):
    combo = db.get(Combo, combo_id)
    if combo is None:
        raise HTTPException(status_code=404, detail="Combo não encontrado")

    _aplicar(combo, dados, CAMPOS_COMBO)
    db.commit()
    db.refresh(combo)
    cache_apagar("combos")
    return combo


# ---------- Categorias ----------

@router.post("/categorias", response_model=schemas.CategoriaOut, status_code=201)
def criar_categoria(dados: schemas.CategoriaAdminIn, db: Session = Depends(get_db)):
    categoria = Categoria(nome=dados.nome, ordem=dados.ordem)
    db.add(categoria)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Já existe uma categoria com este nome")
    db.refresh(categoria)
    cache_apagar("categorias")
    return categoria


@router.delete("/categorias/{categoria_id}", response_model=schemas.MensagemOut)
def excluir_categoria(categoria_id: int, db: Session = Depends(get_db)):
    categoria = db.get(Categoria, categoria_id)
    if categoria is None:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")

    # os espetos dessa categoria ficam sem categoria (não são apagados)
    db.execute(update(Espeto).where(Espeto.categoria_id == categoria_id).values(categoria_id=None))
    db.delete(categoria)
    db.commit()
    cache_apagar("categorias")
    cache_apagar("espetos")
    return {"mensagem": "Categoria excluída"}


# ---------- Cupons ----------

@router.get("/cupons", response_model=List[schemas.CupomAdminOut])
def listar_cupons_admin(db: Session = Depends(get_db)):
    return db.execute(select(Cupom).order_by(Cupom.id.desc()).limit(200)).scalars().all()


@router.post("/cupons", response_model=schemas.CupomAdminOut, status_code=201)
def criar_cupom(dados: schemas.CupomAdminIn, db: Session = Depends(get_db)):
    cupom = Cupom(
        codigo=dados.codigo,
        descricao=(dados.descricao or "").strip(),
        tipo=dados.tipo,
        valor=dados.valor,
        minimo=dados.minimo,
        limite_usos=dados.limite_usos,
        ativo=dados.ativo,
        validade=agora_naive() + timedelta(days=dados.validade_dias) if dados.validade_dias else None,
    )
    db.add(cupom)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Já existe um cupom com este código")
    db.refresh(cupom)
    return cupom


@router.patch("/cupons/{cupom_id}", response_model=schemas.CupomAdminOut)
def editar_cupom(cupom_id: int, dados: schemas.CupomAdminPatch, db: Session = Depends(get_db)):
    cupom = db.get(Cupom, cupom_id)
    if cupom is None:
        raise HTTPException(status_code=404, detail="Cupom não encontrado")

    enviados = dados.model_dump(exclude_unset=True)
    if enviados.get("ativo") is not None:
        cupom.ativo = enviados["ativo"]
    if "descricao" in enviados and enviados["descricao"] is not None:
        cupom.descricao = enviados["descricao"].strip()
    if "limite_usos" in enviados:
        cupom.limite_usos = enviados["limite_usos"]
    if enviados.get("validade_dias"):
        cupom.validade = agora_naive() + timedelta(days=enviados["validade_dias"])

    db.commit()
    db.refresh(cupom)
    return cupom

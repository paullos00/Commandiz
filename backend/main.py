# API da Espetaria (Commandiz) em FastAPI.
# Rodar:  python main.py      |  Documentação interativa (Swagger): http://localhost:5000/docs

from contextlib import asynccontextmanager
from decimal import Decimal
from typing import List

import sentry_sdk
import uvicorn
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import inspect, select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from starlette.exceptions import HTTPException as StarletteHTTPException

import models  # noqa: F401  (registra as tabelas)
import schemas
from cupons_servico import validar_cupom
from auth import (
    cliente_atual,
    cliente_da_rota,
    criar_token,
    gerar_hash,
    verificar_senha,
)
from config import settings
from database import Base, SessionLocal, engine, get_db
from casa import INFORMACOES_DA_CASA
from models import Carrinho, Categoria, Cliente, Combo, Cupom, CupomUso, Espeto, ItemCarrinho, ItemPedido, Pedido
from redis_cliente import cache_gravar, cache_ler, limite_excedido, limpar_limite, status_redis
from rotas_admin import router as rotas_admin
from rotas_avaliacoes import router as rotas_avaliacoes
from rotas_categorias import router as rotas_categorias
from rotas_clube import router as rotas_clube
from rotas_conta import router as rotas_conta
from rotas_notificacoes import router as rotas_notificacoes
from rotas_cupons import router as rotas_cupons
from servicos import formatar_real, montar_pedido, notificar

# ---------- Monitoramento de erros (Sentry) ----------
if settings.SENTRY_DSN:
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        environment="desenvolvimento" if settings.DEBUG_MODE else "producao",
        send_default_pii=False,
        max_request_body_size="never",  # nunca envia o corpo das requisições (tem senhas)
        traces_sample_rate=0.0,
    )


# ---------- Banco: cria as tabelas e os dados iniciais ----------

def _adicionar_coluna_se_faltar(tabela: str, coluna: str, tipo: str) -> None:
    colunas = [c["name"] for c in inspect(engine).get_columns(tabela)]
    if coluna not in colunas:
        with engine.begin() as conexao:
            conexao.execute(text(f"ALTER TABLE {tabela} ADD COLUMN {coluna} {tipo}"))


def garantir_colunas() -> None:
    """Bancos criados antes de uma novidade não têm as colunas novas: adicionamos aqui."""
    _adicionar_coluna_se_faltar("clientes", "senha_hash", "VARCHAR(128)")
    _adicionar_coluna_se_faltar("pedidos", "valor_pago", "NUMERIC(10, 2)")
    _adicionar_coluna_se_faltar("espetos", "categoria_id", "INTEGER")
    booleano = "BOOLEAN DEFAULT TRUE" if engine.dialect.name == "postgresql" else "BOOLEAN DEFAULT 1"
    _adicionar_coluna_se_faltar("espetos", "ativo", booleano)
    _adicionar_coluna_se_faltar("combos", "ativo", booleano)
    _adicionar_coluna_se_faltar("combos", "imagem", "VARCHAR(500)")
    _adicionar_coluna_se_faltar("pedidos", "cupom_codigo", "VARCHAR(30)")
    _adicionar_coluna_se_faltar("pedidos", "desconto", "NUMERIC(10, 2)")
    _adicionar_coluna_se_faltar("pedidos", "troco", "NUMERIC(10, 2)")
    _adicionar_coluna_se_faltar("itens_carrinho", "observacao", "VARCHAR(140)")
    _adicionar_coluna_se_faltar("itens_pedido", "observacao", "VARCHAR(140)")


def preparar_banco() -> None:
    Base.metadata.create_all(bind=engine)
    garantir_colunas()

    with SessionLocal() as db:
        if db.scalar(select(Espeto.id).limit(1)) is None:
            db.add_all([
                Espeto(nome="Espeto de Carne", descricao="Carne bovina temperada", preco=Decimal("9.90")),
                Espeto(nome="Espeto de Frango", descricao="Frango grelhado", preco=Decimal("7.90")),
                Espeto(nome="Espeto de Queijo", descricao="Queijo coalho", preco=Decimal("8.50")),
                Espeto(nome="Espeto de Linguiça", descricao="Linguiça suína", preco=Decimal("7.50")),
            ])

        if db.scalar(select(Combo.id).limit(1)) is None:
            db.add_all([
                Combo(
                    nome="Combo Casal",
                    descricao="4 espetos + 2 bebidas",
                    preco=Decimal("39.90"),
                    preco_original=Decimal("49.90"),
                ),
                Combo(
                    nome="Combo Família",
                    descricao="8 espetos variados",
                    preco=Decimal("59.90"),
                    preco_original=Decimal("69.90"),
                ),
            ])

        # Categorias iniciais (só na primeira vez): os espetos de queijo vão para "Especiais",
        # os demais para "Tradicionais". Depois disso, quem organiza é o administrador.
        if db.scalar(select(Categoria.id).limit(1)) is None:
            db.add_all([
                Categoria(nome="Tradicionais", ordem=1),
                Categoria(nome="Especiais", ordem=2),
                Categoria(nome="Bebidas", ordem=3),
            ])
            db.flush()
            ids = {c.nome: c.id for c in db.execute(select(Categoria)).scalars()}
            for espeto in db.execute(select(Espeto).where(Espeto.categoria_id.is_(None))).scalars():
                espeto.categoria_id = ids["Especiais"] if "queijo" in espeto.nome.lower() else ids["Tradicionais"]

        # Cupons de exemplo (só na primeira vez). O administrador cria os verdadeiros.
        if db.scalar(select(Cupom.id).limit(1)) is None:
            db.add_all([
                Cupom(codigo="BEMVINDO10", descricao="10% de desconto", tipo="percentual",
                      valor=Decimal("10"), minimo=Decimal("20.00")),
                Cupom(codigo="ESPETO5", descricao="R$ 5,00 de desconto", tipo="valor",
                      valor=Decimal("5.00"), minimo=Decimal("25.00")),
            ])

        db.commit()


@asynccontextmanager
async def lifespan(_: FastAPI):
    preparar_banco()
    yield


app = FastAPI(
    title="API da Espetaria (Commandiz)",
    description=(
        "Backend do app Commandiz: cardápio, login, favoritos e carrinho.\n\n"
        "Para testar rotas protegidas aqui no Swagger: faça login em **POST /auth/login**, "
        "copie o `access_token` e cole no botão **Authorize**."
    ),
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- Erros padronizados: sempre {"erro": "mensagem humana"} ----------

@app.exception_handler(StarletteHTTPException)
async def tratar_erro_http(_: Request, exc: StarletteHTTPException):
    mensagem = "Rota não encontrada" if exc.status_code == 404 and exc.detail == "Not Found" else str(exc.detail)
    return JSONResponse(
        status_code=exc.status_code,
        content={"erro": mensagem},
        headers=getattr(exc, "headers", None),
    )


def _mensagem_validacao(erro: dict) -> str:
    loc = tuple(erro.get("loc", ()))
    campo = str(loc[-1]) if loc else "dados"

    if erro["type"] == "value_error":
        return erro["msg"].replace("Value error, ", "", 1)
    if erro["type"] == "json_invalid" or loc == ("body",):
        return "Envie os dados em formato JSON válido"
    if erro["type"] == "missing":
        return f"Informe o campo '{campo}'"
    return f"Valor inválido no campo '{campo}'"


@app.exception_handler(RequestValidationError)
async def tratar_erro_validacao(_: Request, exc: RequestValidationError):
    erros = exc.errors()
    mensagem = _mensagem_validacao(erros[0]) if erros else "Dados inválidos"
    return JSONResponse(status_code=422, content={"erro": mensagem})


@app.exception_handler(Exception)
async def tratar_erro_inesperado(_: Request, exc: Exception):
    sentry_sdk.capture_exception(exc)  # avisa o Sentry (se estiver ligado)
    return JSONResponse(status_code=500, content={"erro": "Erro interno do servidor"})


# ---------- Funções auxiliares ----------

def buscar_ou_404(db: Session, modelo, id_: int, mensagem: str):
    item = db.get(modelo, id_)
    if item is None:
        raise HTTPException(status_code=404, detail=mensagem)
    return item


def obter_carrinho(db: Session, cliente: Cliente) -> Carrinho:
    if cliente.carrinho is None:
        cliente.carrinho = Carrinho()
        db.flush()
    return cliente.carrinho


def buscar_item_do_cliente(db: Session, item_id: int, cliente: Cliente) -> ItemCarrinho:
    """Só devolve o item se ele estiver no carrinho de quem está logado."""
    item = db.get(ItemCarrinho, item_id)
    if item is None or item.carrinho.cliente_id != cliente.id:
        raise HTTPException(status_code=404, detail="Item não encontrado")
    return item


def montar_item(item: ItemCarrinho) -> dict:
    produto = item.espeto if item.espeto_id else item.combo
    subtotal = item.preco_unitario * item.quantidade
    return {
        "id": item.id,
        "espeto_id": item.espeto_id,
        "combo_id": item.combo_id,
        "nome": produto.nome,
        "quantidade": item.quantidade,
        "preco_unitario": float(item.preco_unitario),
        "subtotal": float(subtotal),
        "observacao": item.observacao,
    }


# ---------- Rotas ----------

@app.get("/casa", response_model=schemas.CasaOut, tags=["Início"])
def sobre_a_casa():
    """Informações e horários da espetaria (editáveis em casa.py)."""
    return INFORMACOES_DA_CASA


@app.get("/saude", tags=["Início"])
def saude():
    """Confere se a API e o Redis estão de pé."""
    return {"api": "ok", "redis": status_redis()}


@app.get("/", tags=["Início"])
def inicio():
    return {
        "mensagem": "API da Espetaria funcionando",
        "documentacao": "/docs",
        "rotas": [
            "GET /saude",
            "GET /casa",
            "POST /auth/registrar",
            "POST /auth/login",
            "GET /auth/me (login)",
            "PATCH /auth/me (login)",
            "PUT /auth/senha (login)",
            "GET /espetos",
            "GET /espetos/{id}",
            "GET /combos",
            "GET /clientes/{id}/favoritos (login)",
            "POST /clientes/{id}/favoritos (login)",
            "DELETE /clientes/{id}/favoritos/{espeto_id} (login)",
            "GET /clientes/{id}/carrinho (login)",
            "POST /clientes/{id}/carrinho/itens (login)",
            "PATCH /carrinho/itens/{item_id} (login)",
            "DELETE /carrinho/itens/{item_id} (login)",
            "DELETE /clientes/{id}/carrinho (login)",
            "POST /clientes/{id}/pedidos (login)",
            "GET /clientes/{id}/pedidos (login)",
            "GET /clientes/{id}/pedidos/{pedido_id} (login)",
        ],
    }


# --- Teste do Sentry (só aparece em modo debug com Sentry ligado) ---

if settings.DEBUG_MODE and settings.SENTRY_DSN:

    @app.get("/sentry-teste", tags=["Início"])
    def provocar_erro_de_teste():
        """Gera um erro de propósito para conferir se o Sentry está recebendo."""
        return 1 / 0


# --- Autenticação ---

@app.post("/auth/registrar", response_model=schemas.TokenOut, status_code=201, tags=["Autenticação"])
def registrar(dados: schemas.RegistroIn, db: Session = Depends(get_db)):
    cliente = Cliente(
        nome=dados.nome,
        email=dados.email,
        telefone=dados.telefone,
        senha_hash=gerar_hash(dados.senha),
    )
    db.add(cliente)

    try:
        db.flush()
        cliente.carrinho = Carrinho()
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Este e-mail já está cadastrado")

    db.refresh(cliente)
    return {
        "access_token": criar_token(cliente.id),
        "token_type": "bearer",
        "cliente": schemas.ClienteOut.model_validate(cliente),
    }


@app.post("/auth/login", response_model=schemas.TokenOut, tags=["Autenticação"])
def login(dados: schemas.LoginIn, request: Request, db: Session = Depends(get_db)):
    # Limite de tentativas (Redis): no máximo 5 erros a cada 15 minutos por e-mail + aparelho.
    ip = request.client.host if request.client else "desconhecido"
    chave_limite = f"login:{ip}:{dados.email}"
    espera = limite_excedido(chave_limite, maximo=5, janela_segundos=900)
    if espera:
        minutos = (espera + 59) // 60
        raise HTTPException(
            status_code=429,
            detail=f"Muitas tentativas. Tente de novo em {minutos} minuto(s).",
        )

    cliente = db.execute(select(Cliente).where(Cliente.email == dados.email)).scalar_one_or_none()

    # Mesma mensagem para "e-mail não existe" e "senha errada": não revela quem tem conta.
    if cliente is None or not cliente.senha_hash or not verificar_senha(dados.senha, cliente.senha_hash):
        raise HTTPException(status_code=401, detail="E-mail ou senha incorretos")

    limpar_limite(chave_limite)  # acertou: zera a contagem

    return {
        "access_token": criar_token(cliente.id),
        "token_type": "bearer",
        "cliente": schemas.ClienteOut.model_validate(cliente),
    }


@app.get("/auth/me", response_model=schemas.ClienteOut, tags=["Autenticação"])
def quem_sou_eu(cliente: Cliente = Depends(cliente_atual)):
    return cliente


@app.patch("/auth/me", response_model=schemas.ClienteOut, tags=["Autenticação"])
def atualizar_perfil(
    dados: schemas.PerfilIn,
    cliente: Cliente = Depends(cliente_atual),
    db: Session = Depends(get_db),
):
    """Atualiza nome e telefone. O e-mail não muda (é o login)."""
    cliente.nome = dados.nome
    cliente.telefone = dados.telefone
    db.commit()
    db.refresh(cliente)
    return cliente


@app.put("/auth/senha", response_model=schemas.MensagemOut, tags=["Autenticação"])
def trocar_senha(
    dados: schemas.TrocarSenhaIn,
    cliente: Cliente = Depends(cliente_atual),
    db: Session = Depends(get_db),
):
    if not cliente.senha_hash or not verificar_senha(dados.senha_atual, cliente.senha_hash):
        raise HTTPException(status_code=400, detail="Senha atual incorreta")

    cliente.senha_hash = gerar_hash(dados.senha_nova)
    db.commit()
    return {"mensagem": "Senha alterada com sucesso"}


# --- Espetos (públicos) ---

@app.get("/espetos", response_model=List[schemas.EspetoOut], tags=["Espetos"])
def listar_espetos(db: Session = Depends(get_db)):
    guardado = cache_ler("espetos")
    if guardado is not None:
        return guardado

    espetos = db.execute(select(Espeto).where(Espeto.ativo.is_(True)).order_by(Espeto.id)).scalars().all()
    resposta = [schemas.EspetoOut.model_validate(e).model_dump() for e in espetos]
    cache_gravar("espetos", resposta)
    return resposta


@app.get("/espetos/{espeto_id}", response_model=schemas.EspetoOut, tags=["Espetos"])
def buscar_espeto(espeto_id: int, db: Session = Depends(get_db)):
    return buscar_ou_404(db, Espeto, espeto_id, "Espeto não encontrado")


# --- Combos (públicos) ---

@app.get("/combos", response_model=List[schemas.ComboOut], tags=["Combos"])
def listar_combos(db: Session = Depends(get_db)):
    guardado = cache_ler("combos")
    if guardado is not None:
        return guardado

    combos = db.execute(select(Combo).where(Combo.ativo.is_(True)).order_by(Combo.id)).scalars().all()
    resposta = [schemas.ComboOut.model_validate(c).model_dump() for c in combos]
    cache_gravar("combos", resposta)
    return resposta


# --- Favoritos (precisam de login) ---

@app.get(
    "/clientes/{cliente_id}/favoritos",
    response_model=List[schemas.EspetoOut],
    tags=["Favoritos"],
)
def listar_favoritos(cliente: Cliente = Depends(cliente_da_rota)):
    return cliente.espetos_favoritos


@app.post(
    "/clientes/{cliente_id}/favoritos",
    response_model=schemas.MensagemOut,
    tags=["Favoritos"],
)
def adicionar_favorito(
    dados: schemas.FavoritoIn,
    cliente: Cliente = Depends(cliente_da_rota),
    db: Session = Depends(get_db),
):
    espeto = buscar_ou_404(db, Espeto, dados.espeto_id, "Espeto não encontrado")

    if espeto not in cliente.espetos_favoritos:
        cliente.espetos_favoritos.append(espeto)
        db.commit()

    return {"mensagem": "Espeto adicionado aos favoritos"}


@app.delete(
    "/clientes/{cliente_id}/favoritos/{espeto_id}",
    response_model=schemas.MensagemOut,
    tags=["Favoritos"],
)
def remover_favorito(
    espeto_id: int,
    cliente: Cliente = Depends(cliente_da_rota),
    db: Session = Depends(get_db),
):
    espeto = buscar_ou_404(db, Espeto, espeto_id, "Espeto não encontrado")

    if espeto in cliente.espetos_favoritos:
        cliente.espetos_favoritos.remove(espeto)
        db.commit()

    return {"mensagem": "Favorito removido"}


# --- Carrinho (precisa de login) ---

@app.get(
    "/clientes/{cliente_id}/carrinho",
    response_model=schemas.CarrinhoOut,
    tags=["Carrinho"],
)
def visualizar_carrinho(cliente: Cliente = Depends(cliente_da_rota), db: Session = Depends(get_db)):
    carrinho = obter_carrinho(db, cliente)

    itens = [montar_item(item) for item in carrinho.itens]
    total = sum((Decimal(str(item["subtotal"])) for item in itens), Decimal("0.00"))

    db.commit()

    return {"cliente_id": cliente.id, "itens": itens, "total": float(total)}


@app.post(
    "/clientes/{cliente_id}/carrinho/itens",
    response_model=schemas.ItemAdicionadoOut,
    status_code=201,
    tags=["Carrinho"],
)
def adicionar_item_carrinho(
    dados: schemas.ItemCarrinhoIn,
    cliente: Cliente = Depends(cliente_da_rota),
    db: Session = Depends(get_db),
):
    if dados.espeto_id is not None:
        produto = db.get(Espeto, dados.espeto_id)
    else:
        produto = db.get(Combo, dados.combo_id)

    if produto is None or produto.ativo is False:
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    carrinho = obter_carrinho(db, cliente)

    filtros = [ItemCarrinho.carrinho_id == carrinho.id]
    if dados.espeto_id is not None:
        filtros.append(ItemCarrinho.espeto_id == dados.espeto_id)
    else:
        filtros.append(ItemCarrinho.combo_id == dados.combo_id)

    item = db.execute(select(ItemCarrinho).where(*filtros)).scalar_one_or_none()

    if item:
        item.quantidade += dados.quantidade
        if dados.observacao is not None:
            item.observacao = dados.observacao
    else:
        item = ItemCarrinho(
            carrinho=carrinho,
            espeto_id=dados.espeto_id,
            combo_id=dados.combo_id,
            quantidade=dados.quantidade,
            preco_unitario=produto.preco,
            observacao=dados.observacao,
        )
        db.add(item)

    db.commit()

    return {"mensagem": "Item adicionado ao carrinho", "item_id": item.id}


@app.patch(
    "/carrinho/itens/{item_id}",
    response_model=schemas.MensagemOut,
    tags=["Carrinho"],
)
def atualizar_quantidade(
    item_id: int,
    dados: schemas.QuantidadeIn,
    cliente: Cliente = Depends(cliente_atual),
    db: Session = Depends(get_db),
):
    item = buscar_item_do_cliente(db, item_id, cliente)
    item.quantidade = dados.quantidade
    db.commit()
    return {"mensagem": "Quantidade atualizada"}


@app.delete(
    "/carrinho/itens/{item_id}",
    response_model=schemas.MensagemOut,
    tags=["Carrinho"],
)
def remover_item_carrinho(
    item_id: int,
    cliente: Cliente = Depends(cliente_atual),
    db: Session = Depends(get_db),
):
    item = buscar_item_do_cliente(db, item_id, cliente)
    db.delete(item)
    db.commit()
    return {"mensagem": "Item removido do carrinho"}


@app.delete(
    "/clientes/{cliente_id}/carrinho",
    response_model=schemas.MensagemOut,
    tags=["Carrinho"],
)
def limpar_carrinho(cliente: Cliente = Depends(cliente_da_rota), db: Session = Depends(get_db)):
    if cliente.carrinho:
        cliente.carrinho.itens.clear()
        db.commit()

    return {"mensagem": "Carrinho limpo"}


# --- Pedidos (precisam de login) ---

@app.post(
    "/clientes/{cliente_id}/pedidos",
    response_model=schemas.PedidoOut,
    status_code=201,
    tags=["Pedidos"],
)
def fechar_pedido(
    dados: schemas.PedidoIn,
    cliente: Cliente = Depends(cliente_da_rota),
    db: Session = Depends(get_db),
):
    """Transforma o carrinho em um pedido (pagamento simulado) e esvazia o carrinho."""
    carrinho = obter_carrinho(db, cliente)

    if not carrinho.itens:
        raise HTTPException(status_code=409, detail="Seu carrinho está vazio")

    subtotal = sum((item.preco_unitario * item.quantidade for item in carrinho.itens), Decimal("0.00"))

    # Cupom de desconto (o servidor refaz toda a conta, não confia no celular)
    cupom_aplicado = None
    desconto = Decimal("0.00")
    if dados.cupom:
        cupom_aplicado, desconto = validar_cupom(db, dados.cupom, cliente, subtotal)
    total = subtotal - desconto

    # Pagamento em dinheiro: o TROCO é calculado aqui, no servidor (não confiamos no celular).
    valor_pago = None
    troco = None
    if dados.forma_pagamento == "dinheiro":
        if dados.precisa_troco:
            if dados.valor_pago < total:
                raise HTTPException(
                    status_code=422,
                    detail=(
                        f"O valor informado (R$ {formatar_real(dados.valor_pago)}) é menor "
                        f"que o total do pedido (R$ {formatar_real(total)})"
                    ),
                )
            valor_pago = dados.valor_pago
            troco = valor_pago - total
        else:
            valor_pago = total
            troco = Decimal("0.00")

    pedido = Pedido(
        cliente_id=cliente.id,
        forma_pagamento=dados.forma_pagamento,
        status="recebido",
        total=total,
        valor_pago=valor_pago,
        troco=troco,
        cupom_codigo=cupom_aplicado.codigo if cupom_aplicado else None,
        desconto=desconto if cupom_aplicado else None,
    )

    for item in carrinho.itens:
        produto = item.espeto if item.espeto_id else item.combo
        pedido.itens.append(
            ItemPedido(
                espeto_id=item.espeto_id,
                combo_id=item.combo_id,
                nome=produto.nome,
                quantidade=item.quantidade,
                preco_unitario=item.preco_unitario,
                observacao=item.observacao,
            )
        )

    db.add(pedido)
    db.flush()  # gera o número do pedido

    if cupom_aplicado:
        cupom_aplicado.usos += 1
        db.add(CupomUso(cupom_id=cupom_aplicado.id, cliente_id=cliente.id, pedido_id=pedido.id))

    notificar(db, cliente.id, "Pedido recebido ✅", f"Recebemos o seu pedido #{pedido.id}.")

    carrinho.itens.clear()
    db.commit()
    db.refresh(pedido)

    return montar_pedido(pedido)


@app.get(
    "/clientes/{cliente_id}/pedidos",
    response_model=List[schemas.PedidoOut],
    tags=["Pedidos"],
)
def listar_pedidos(cliente: Cliente = Depends(cliente_da_rota), db: Session = Depends(get_db)):
    pedidos = db.execute(
        select(Pedido).where(Pedido.cliente_id == cliente.id).order_by(Pedido.id.desc())
    ).scalars().all()
    return [montar_pedido(p) for p in pedidos]


@app.get(
    "/clientes/{cliente_id}/pedidos/{pedido_id}",
    response_model=schemas.PedidoOut,
    tags=["Pedidos"],
)
def buscar_pedido(
    pedido_id: int,
    cliente: Cliente = Depends(cliente_da_rota),
    db: Session = Depends(get_db),
):
    pedido = db.get(Pedido, pedido_id)
    if pedido is None or pedido.cliente_id != cliente.id:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    return montar_pedido(pedido)


# ---------- Rotas em arquivos separados ----------
app.include_router(rotas_conta)
app.include_router(rotas_clube)
app.include_router(rotas_notificacoes)
app.include_router(rotas_admin)
app.include_router(rotas_cupons)
app.include_router(rotas_categorias)
app.include_router(rotas_avaliacoes)


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST_DO_SERVIDOR,
        port=settings.PORTA_DO_SERVIDOR,
        reload=settings.DEBUG_MODE,
    )
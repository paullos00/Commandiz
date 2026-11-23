# Arquivo: backend/servicos.py
# Funções compartilhadas entre as rotas (formatação e montagem das respostas).

from decimal import Decimal

from fastapi import HTTPException

from config import settings
from models import Notificacao
from pix import gerar_pix_copia_e_cola


def formatar_real(valor: Decimal) -> str:
    return f"{valor:.2f}".replace(".", ",")


def montar_avaliacao(avaliacao) -> dict:
    return {"nota": avaliacao.nota, "comentario": avaliacao.comentario, "criado_em": avaliacao.criado_em}


def _pix_do_pedido(pedido):
    """Código 'Pix Copia e Cola' do pedido (None se não for Pix ou se a chave não estiver configurada)."""
    if pedido.forma_pagamento != "pix" or not settings.PIX_CHAVE:
        return None
    return gerar_pix_copia_e_cola(
        settings.PIX_CHAVE,
        settings.PIX_NOME_RECEBEDOR,
        settings.PIX_CIDADE,
        pedido.total,
        f"CMD{pedido.id}",
    )


def montar_pedido(pedido) -> dict:
    return {
        "id": pedido.id,
        "status": pedido.status,
        "forma_pagamento": pedido.forma_pagamento,
        "total": float(pedido.total),
        "valor_pago": float(pedido.valor_pago) if pedido.valor_pago is not None else None,
        "troco": float(pedido.troco) if pedido.troco is not None else None,
        "cupom_codigo": pedido.cupom_codigo,
        "desconto": float(pedido.desconto) if pedido.desconto is not None else None,
        "criado_em": pedido.criado_em,
        "itens": [
            {
                "nome": item.nome,
                "quantidade": item.quantidade,
                "preco_unitario": float(item.preco_unitario),
                "subtotal": float(item.preco_unitario * item.quantidade),
                "observacao": item.observacao,
            }
            for item in pedido.itens
        ],
        "avaliacao": montar_avaliacao(pedido.avaliacao) if pedido.avaliacao else None,
        "pix_copia_cola": _pix_do_pedido(pedido),
    }


# ---------- Status do pedido e notificações ----------

# De cada status, para quais outros o pedido pode ir.
PROXIMOS_STATUS = {
    "recebido": ["em_preparo", "cancelado"],
    "em_preparo": ["pronto", "cancelado"],
    "pronto": ["entregue", "cancelado"],
    "entregue": [],
    "cancelado": [],
}

MENSAGENS_STATUS = {
    "em_preparo": ("Pedido em preparo 🔥", "Seu pedido #{id} começou a ser preparado."),
    "pronto": ("Pedido pronto ✅", "Seu pedido #{id} está pronto!"),
    "entregue": ("Pedido entregue 🎉", "Seu pedido #{id} foi entregue. Bom apetite! Que tal avaliar?"),
    "cancelado": ("Pedido cancelado", "Seu pedido #{id} foi cancelado."),
}


def notificar(db, cliente_id: int, titulo: str, mensagem: str) -> None:
    db.add(Notificacao(cliente_id=cliente_id, titulo=titulo, mensagem=mensagem))


def mudar_status(db, pedido, novo: str) -> None:
    """Muda o status respeitando as regras e avisa o cliente. Quem chama faz o commit."""
    if novo not in PROXIMOS_STATUS:
        raise HTTPException(status_code=422, detail="Status inválido")
    if novo not in PROXIMOS_STATUS.get(pedido.status, []):
        raise HTTPException(status_code=409, detail=f"Não é possível mudar de '{pedido.status}' para '{novo}'")

    pedido.status = novo
    titulo, mensagem = MENSAGENS_STATUS[novo]
    notificar(db, pedido.cliente_id, titulo, mensagem.format(id=pedido.id))

    if novo == "entregue":
        from clube import creditar_pontos  # import aqui dentro evita um "círculo" entre arquivos

        creditar_pontos(db, pedido)


def montar_pedido_admin(pedido) -> dict:
    return {
        **montar_pedido(pedido),
        "cliente_nome": pedido.cliente.nome,
        "cliente_telefone": pedido.cliente.telefone,
        "proximos": PROXIMOS_STATUS.get(pedido.status, []),
    }

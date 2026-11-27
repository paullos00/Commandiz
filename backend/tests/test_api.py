# Arquivo: backend/tests/test_api.py
# Testes automáticos da API. Rodar (na pasta backend):  python -m pytest -v

import re

import pytest

from tests.conftest import criar_cliente


def adicionar_item(client, cliente, espeto_id=1, quantidade=1, observacao=None):
    corpo = {"espeto_id": espeto_id, "quantidade": quantidade}
    if observacao:
        corpo["observacao"] = observacao
    r = client.post(f"/clientes/{cliente['id']}/carrinho/itens", json=corpo, headers=cliente["headers"])
    assert r.status_code == 201, r.text
    return r.json()


def fechar_pedido(client, cliente, **corpo):
    corpo.setdefault("forma_pagamento", "pix")
    return client.post(f"/clientes/{cliente['id']}/pedidos", json=corpo, headers=cliente["headers"])


# ---------- básico ----------

def test_saude_e_cardapio(client):
    assert client.get("/saude").json() == {"api": "ok", "redis": "desligado"}
    espetos = client.get("/espetos").json()
    assert len(espetos) >= 4
    assert {"id", "nome", "preco", "categoria_id"} <= set(espetos[0])
    assert len(client.get("/combos").json()) >= 2
    assert len(client.get("/categorias").json()) >= 1
    assert "horarios" in client.get("/casa").json()


# ---------- conta e login ----------

def test_registro_login_e_me(client):
    c = criar_cliente(client)
    login = client.post("/auth/login", json={"email": c["email"], "senha": c["senha"]})
    assert login.status_code == 200
    assert login.json()["cliente"]["email"] == c["email"]

    me = client.get("/auth/me", headers=c["headers"])
    assert me.status_code == 200 and me.json()["id"] == c["id"]
    assert me.json()["admin"] is False


def test_atualiza_foto_do_perfil(client, cliente):
    foto = "data:image/jpeg;base64,/9j/4AAQ"
    resposta = client.patch(
        "/auth/me",
        json={"nome": "Cliente Atualizado", "telefone": "11999999999", "foto": foto},
        headers=cliente["headers"],
    )

    assert resposta.status_code == 200
    assert resposta.json()["foto"] == foto


def test_senha_errada_e_email_repetido(client, cliente):
    r = client.post("/auth/login", json={"email": cliente["email"], "senha": "errada!"})
    assert r.status_code == 401
    assert r.json() == {"erro": "E-mail ou senha incorretos"}

    r = client.post(
        "/auth/registrar",
        json={"nome": "Outro", "email": cliente["email"], "telefone": "11999999999", "senha": "123456"},
    )
    assert r.status_code == 409


def test_email_invalido_e_senha_curta(client):
    base = {"nome": "X", "telefone": "11999999999"}
    assert client.post("/auth/registrar", json={**base, "email": "abc", "senha": "123456"}).status_code == 422
    assert client.post("/auth/registrar", json={**base, "email": "ok@teste.com", "senha": "123"}).status_code == 422


# ---------- segurança ----------

def test_rotas_protegidas(client, cliente):
    sem_login = client.get(f"/clientes/{cliente['id']}/carrinho")
    assert sem_login.status_code == 401

    outro = criar_cliente(client)
    r = client.get(f"/clientes/{cliente['id']}/carrinho", headers=outro["headers"])
    assert r.status_code == 403


def test_item_de_outro_cliente_nao_e_acessivel(client):
    a, b = criar_cliente(client), criar_cliente(client)
    item_id = adicionar_item(client, a)["item_id"]
    r = client.delete(f"/carrinho/itens/{item_id}", headers=b["headers"])
    assert r.status_code == 404


# ---------- carrinho e pedido ----------

def test_carrinho_com_observacao(client, cliente):
    adicionar_item(client, cliente, espeto_id=1, quantidade=2, observacao="sem cebola")
    carrinho = client.get(f"/clientes/{cliente['id']}/carrinho", headers=cliente["headers"]).json()
    assert carrinho["total"] == pytest.approx(19.8)
    assert carrinho["itens"][0]["observacao"] == "sem cebola"


def test_carrinho_aceita_espetos_e_combos_do_cardapio(client, cliente):
    itens = [
        {"espeto_id": 2},
        {"espeto_id": 3},
        {"combo_id": 1},
    ]
    for item in itens:
        resposta = client.post(
            f"/clientes/{cliente['id']}/carrinho/itens",
            json=item,
            headers=cliente["headers"],
        )
        assert resposta.status_code == 201, resposta.text

    carrinho = client.get(f"/clientes/{cliente['id']}/carrinho", headers=cliente["headers"]).json()
    assert {item["nome"] for item in carrinho["itens"]} == {
        "Espeto de Frango",
        "Espeto de Queijo",
        "Combo Casal",
    }


def test_pedido_dinheiro_com_troco(client, cliente):
    adicionar_item(client, cliente, espeto_id=1, quantidade=2)  # R$ 19,80

    pouco = fechar_pedido(client, cliente, forma_pagamento="dinheiro", precisa_troco=True, valor_pago=10)
    assert pouco.status_code == 422

    sem_resposta = fechar_pedido(client, cliente, forma_pagamento="dinheiro")
    assert sem_resposta.status_code == 422  # falta dizer se precisa de troco

    ok = fechar_pedido(client, cliente, forma_pagamento="dinheiro", precisa_troco=True, valor_pago=20)
    assert ok.status_code == 201, ok.text
    pedido = ok.json()
    assert pedido["total"] == pytest.approx(19.8)
    assert pedido["troco"] == pytest.approx(0.2)
    assert pedido["status"] == "recebido"

    carrinho = client.get(f"/clientes/{cliente['id']}/carrinho", headers=cliente["headers"]).json()
    assert carrinho["itens"] == []


def test_pedido_com_carrinho_vazio(client, cliente):
    assert fechar_pedido(client, cliente).status_code == 409


# ---------- cupons ----------

def test_cupom_percentual_e_uso_unico(client, cliente):
    adicionar_item(client, cliente, espeto_id=1, quantidade=3)  # R$ 29,70

    v = client.post(f"/clientes/{cliente['id']}/cupons/validar", json={"codigo": "bemvindo10"}, headers=cliente["headers"])
    assert v.status_code == 200, v.text
    assert v.json()["desconto"] == pytest.approx(2.97)
    assert v.json()["total"] == pytest.approx(26.73)

    pedido = fechar_pedido(client, cliente, cupom="BEMVINDO10").json()
    assert pedido["total"] == pytest.approx(26.73)
    assert pedido["desconto"] == pytest.approx(2.97)

    adicionar_item(client, cliente, espeto_id=1, quantidade=3)
    de_novo = client.post(f"/clientes/{cliente['id']}/cupons/validar", json={"codigo": "BEMVINDO10"}, headers=cliente["headers"])
    assert de_novo.status_code == 422


def test_cupom_invalido_e_valor_minimo(client, cliente):
    adicionar_item(client, cliente, espeto_id=1, quantidade=1)  # R$ 9,90 (abaixo do mínimo)
    url = f"/clientes/{cliente['id']}/cupons/validar"
    assert client.post(url, json={"codigo": "NAOEXISTE"}, headers=cliente["headers"]).status_code == 404
    assert client.post(url, json={"codigo": "BEMVINDO10"}, headers=cliente["headers"]).status_code == 422


# ---------- avaliações ----------

def test_avaliacao_do_pedido(client, cliente):
    adicionar_item(client, cliente)
    pedido = fechar_pedido(client, cliente).json()
    url = f"/clientes/{cliente['id']}/pedidos/{pedido['id']}/avaliacao"

    assert client.post(url, json={"nota": 6}, headers=cliente["headers"]).status_code == 422
    ok = client.post(url, json={"nota": 5, "comentario": "Ótimo!"}, headers=cliente["headers"])
    assert ok.status_code == 201
    assert client.post(url, json={"nota": 4}, headers=cliente["headers"]).status_code == 409

    resumo = client.get("/avaliacoes").json()
    assert resumo["total"] >= 1


# ---------- perfil e e-mail ----------

def test_alterar_email(client, cliente):
    outro = criar_cliente(client)
    url = "/auth/email"

    errada = client.put(url, json={"email_novo": "novo@teste.com", "senha": "senha-errada"}, headers=cliente["headers"])
    assert errada.status_code == 400

    repetido = client.put(url, json={"email_novo": outro["email"], "senha": cliente["senha"]}, headers=cliente["headers"])
    assert repetido.status_code == 409

    novo = f"novo.{cliente['email']}"
    ok = client.put(url, json={"email_novo": novo, "senha": cliente["senha"]}, headers=cliente["headers"])
    assert ok.status_code == 200 and ok.json()["email"] == novo
    assert client.post("/auth/login", json={"email": novo, "senha": cliente["senha"]}).status_code == 200


# ---------- recuperar senha ----------

def test_recuperar_e_redefinir_senha(client, cliente, monkeypatch):
    import rotas_conta

    enviados = []
    monkeypatch.setattr(rotas_conta, "enviar_email", lambda destino, assunto, texto: enviados.append((destino, texto)))

    r = client.post("/auth/recuperar", json={"email": cliente["email"]})
    assert r.status_code == 200
    assert len(enviados) == 1
    codigo = re.search(r"\b(\d{6})\b", enviados[0][1]).group(1)

    # e-mail que não existe: mesma resposta, nada enviado
    assert client.post("/auth/recuperar", json={"email": "ninguem@teste.com"}).status_code == 200
    assert len(enviados) == 1

    errado = "000000" if codigo != "000000" else "111111"
    assert client.post("/auth/redefinir", json={"email": cliente["email"], "codigo": errado, "senha_nova": "novaSenha1"}).status_code == 400

    ok = client.post("/auth/redefinir", json={"email": cliente["email"], "codigo": codigo, "senha_nova": "novaSenha1"})
    assert ok.status_code == 200, ok.text
    assert client.post("/auth/login", json={"email": cliente["email"], "senha": "novaSenha1"}).status_code == 200
    assert client.post("/auth/login", json={"email": cliente["email"], "senha": cliente["senha"]}).status_code == 401

    # o código só vale uma vez
    de_novo = client.post("/auth/redefinir", json={"email": cliente["email"], "codigo": codigo, "senha_nova": "outraSenha2"})
    assert de_novo.status_code == 400


# ---------- administrador, status, notificações e clube ----------

def test_admin_protegido(client, cliente):
    assert client.get("/admin/pedidos", headers=cliente["headers"]).status_code == 403
    assert client.get("/admin/pedidos").status_code == 401


def test_status_notificacoes_e_pontos(client, cliente, admin):
    adicionar_item(client, cliente, espeto_id=1, quantidade=2)  # R$ 19,80 -> 19 pontos
    pedido = fechar_pedido(client, cliente).json()
    url = f"/admin/pedidos/{pedido['id']}/status"

    # não pode pular etapas
    assert client.patch(url, json={"status": "entregue"}, headers=admin["headers"]).status_code == 409

    for status in ["em_preparo", "pronto", "entregue"]:
        r = client.patch(url, json={"status": status}, headers=admin["headers"])
        assert r.status_code == 200, r.text
        assert r.json()["status"] == status

    notificacoes = client.get(f"/clientes/{cliente['id']}/notificacoes", headers=cliente["headers"]).json()
    assert notificacoes["nao_lidas"] >= 4  # recebido, em preparo, pronto, entregue (+ pontos)

    marcar = client.post(f"/clientes/{cliente['id']}/notificacoes/lidas", headers=cliente["headers"])
    assert marcar.status_code == 200

    clube = client.get(f"/clientes/{cliente['id']}/clube", headers=cliente["headers"]).json()
    assert clube["pontos"] == 19
    assert clube["nivel"] == "Bronze"


def test_resgatar_recompensa_do_clube(client, cliente):
    r = client.post(f"/clientes/{cliente['id']}/clube/resgatar", json={"recompensa_id": "desc5"}, headers=cliente["headers"])
    assert r.status_code == 409  # sem pontos


def test_admin_cria_e_desativa_espeto(client, admin):
    r = client.post("/admin/espetos", json={"nome": "Espeto de Coração", "preco": 12.5}, headers=admin["headers"])
    assert r.status_code == 201, r.text
    novo = r.json()
    assert any(e["id"] == novo["id"] for e in client.get("/espetos").json())

    off = client.patch(f"/admin/espetos/{novo['id']}", json={"ativo": False}, headers=admin["headers"])
    assert off.status_code == 200
    assert not any(e["id"] == novo["id"] for e in client.get("/espetos").json())


def test_admin_exclui_espeto_e_remove_carrinho_e_favorito(client, admin, cliente):
    criado = client.post(
        "/admin/espetos",
        json={"nome": "Espeto para excluir", "preco": 10},
        headers=admin["headers"],
    )
    assert criado.status_code == 201, criado.text
    espeto_id = criado.json()["id"]

    adicionar_item(client, cliente, espeto_id=espeto_id)
    favorito = client.post(
        f"/clientes/{cliente['id']}/favoritos",
        json={"espeto_id": espeto_id},
        headers=cliente["headers"],
    )
    assert favorito.status_code == 200

    excluido = client.delete(f"/admin/espetos/{espeto_id}", headers=admin["headers"])
    assert excluido.status_code == 200
    assert not any(item["id"] == espeto_id for item in client.get("/espetos").json())
    assert client.get(f"/clientes/{cliente['id']}/carrinho", headers=cliente["headers"]).json()["itens"] == []
    assert client.get(f"/clientes/{cliente['id']}/favoritos", headers=cliente["headers"]).json() == []


def test_admin_exclui_combo_no_carrinho(client, admin, cliente):
    criado = client.post(
        "/admin/combos",
        json={"nome": "Combo para excluir", "preco": 20},
        headers=admin["headers"],
    )
    assert criado.status_code == 201, criado.text
    combo_id = criado.json()["id"]

    adicionado = client.post(
        f"/clientes/{cliente['id']}/carrinho/itens",
        json={"combo_id": combo_id, "quantidade": 1},
        headers=cliente["headers"],
    )
    assert adicionado.status_code == 201, adicionado.text

    excluido = client.delete(f"/admin/combos/{combo_id}", headers=admin["headers"])
    assert excluido.status_code == 200
    assert client.get(f"/clientes/{cliente['id']}/carrinho", headers=cliente["headers"]).json()["itens"] == []


def test_admin_cria_e_exclui_categoria(client, admin):
    criada = client.post(
        "/admin/categorias",
        json={"nome": "Categoria temporária"},
        headers=admin["headers"],
    )
    assert criada.status_code == 201, criada.text
    categoria_id = criada.json()["id"]
    assert any(categoria["id"] == categoria_id for categoria in client.get("/categorias").json())

    excluida = client.delete(f"/admin/categorias/{categoria_id}", headers=admin["headers"])
    assert excluida.status_code == 200
    assert all(categoria["id"] != categoria_id for categoria in client.get("/categorias").json())


def test_admin_define_visibilidade_da_categoria(client, admin):
    criada = client.post(
        "/admin/categorias",
        json={"nome": "Categoria oculta", "visivel": False},
        headers=admin["headers"],
    )
    assert criada.status_code == 201, criada.text
    categoria_id = criada.json()["id"]
    assert criada.json()["visivel"] is False

    categorias_publicas = client.get("/categorias").json()
    assert all(categoria["id"] != categoria_id for categoria in categorias_publicas)

    categorias_admin = client.get("/admin/cardapio", headers=admin["headers"]).json()["categorias"]
    assert any(categoria["id"] == categoria_id and categoria["visivel"] is False for categoria in categorias_admin)


def test_admin_cadastra_bebida_e_cliente_adiciona_ao_carrinho(client, admin, cliente):
    categorias = client.get("/categorias").json()
    categoria_bebidas = next((c for c in categorias if c["nome"].casefold() == "bebidas"), None)
    assert categoria_bebidas is not None

    dados = {
        "nome": "Refrigerante Lata",
        "descricao": "Lata 350 ml",
        "preco": 6.5,
        "categoria_id": categoria_bebidas["id"],
    }
    sem_permissao = client.post("/admin/espetos", json=dados, headers=cliente["headers"])
    assert sem_permissao.status_code == 403

    criado = client.post("/admin/espetos", json=dados, headers=admin["headers"])
    assert criado.status_code == 201, criado.text
    bebida = criado.json()
    assert bebida["id"] in {item["id"] for item in client.get("/espetos").json()}

    adicionada = client.post(
        f"/clientes/{cliente['id']}/carrinho/itens",
        json={"espeto_id": bebida["id"], "quantidade": 2},
        headers=cliente["headers"],
    )
    assert adicionada.status_code == 201, adicionada.text
    carrinho = client.get(f"/clientes/{cliente['id']}/carrinho", headers=cliente["headers"]).json()
    assert any(item["nome"] == "Refrigerante Lata" and item["subtotal"] == pytest.approx(13.0) for item in carrinho["itens"])


def test_admin_cria_cupom(client, admin):
    corpo = {"codigo": "TESTE20", "tipo": "percentual", "valor": 20, "descricao": "20%"}
    assert client.post("/admin/cupons", json=corpo, headers=admin["headers"]).status_code == 201
    assert client.post("/admin/cupons", json=corpo, headers=admin["headers"]).status_code == 409
    invalido = {"codigo": "X", "tipo": "percentual", "valor": 150}
    assert client.post("/admin/cupons", json=invalido, headers=admin["headers"]).status_code == 422


# ---------- Pix ----------

def test_pedido_pix_gera_codigo_copia_e_cola(client, cliente):
    import pix

    adicionar_item(client, cliente, espeto_id=1, quantidade=2)  # R$ 19,80
    r = fechar_pedido(client, cliente, forma_pagamento="pix")
    assert r.status_code == 201, r.text
    codigo = r.json()["pix_copia_cola"]

    assert codigo.startswith("000201")
    assert "br.gov.bcb.pix" in codigo and "loja@teste.com" in codigo
    assert "540519.80" in codigo  # campo 54 (valor) com 5 caracteres
    assert pix.crc16(codigo[:-4]) == codigo[-4:]  # o código de verificação confere

    # o código também aparece na lista de pedidos
    lista = client.get(f"/clientes/{cliente['id']}/pedidos", headers=cliente["headers"]).json()
    assert lista[0]["pix_copia_cola"] == codigo


def test_pedido_pix_sem_chave_nao_fecha_pedido(client, cliente, monkeypatch):
    import main

    adicionar_item(client, cliente)
    monkeypatch.setattr(main.settings, "PIX_CHAVE", "")

    resposta = fechar_pedido(client, cliente, forma_pagamento="pix")

    assert resposta.status_code == 503
    carrinho = client.get(f"/clientes/{cliente['id']}/carrinho", headers=cliente["headers"]).json()
    assert len(carrinho["itens"]) == 1


def test_pedido_cartao_nao_tem_codigo_pix(client, cliente):
    adicionar_item(client, cliente)
    pedido = fechar_pedido(client, cliente, forma_pagamento="cartao").json()
    assert pedido["pix_copia_cola"] is None

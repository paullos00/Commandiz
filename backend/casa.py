# Arquivo: backend/casa.py
# Informações da espetaria mostradas na tela "Sobre a Casa" do app.
# >>> EDITE AQUI com os dados reais (os de baixo são só de exemplo). <<<
# Depois de editar, salve: o servidor reinicia sozinho no modo debug.
#
# Horários: "abre" e "fecha" no formato "HH:MM". Use None nos dois para "fechado".
# Se fechar depois da meia-noite (ex.: abre 18:00 e fecha 01:00), o app entende.

INFORMACOES_DA_CASA = {
    "nome": "Commandiz Espetaria",
    "descricao": "Espetos na brasa preparados na hora, com o tempero da casa.",
    "endereco": "Rua Exemplo, 123 - Centro",
    "telefone": "(11) 90000-0000",
    "horarios": [
        {"dia": "Segunda", "abre": None, "fecha": None},
        {"dia": "Terça", "abre": "18:00", "fecha": "23:00"},
        {"dia": "Quarta", "abre": "18:00", "fecha": "23:00"},
        {"dia": "Quinta", "abre": "18:00", "fecha": "23:00"},
        {"dia": "Sexta", "abre": "18:00", "fecha": "00:00"},
        {"dia": "Sábado", "abre": "12:00", "fecha": "00:00"},
        {"dia": "Domingo", "abre": "12:00", "fecha": "22:00"},
    ],
}

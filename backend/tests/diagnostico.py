# Arquivo: backend/diagnostico.py
# Descobre por que o backend não liga ou não é alcançado pelo celular.
# Uso (na pasta backend):   python diagnostico.py
# Ele NÃO mostra senhas nem chaves: só os NOMES das variáveis do .env.

import importlib
import os
import socket
import sys
import traceback
import urllib.request
from pathlib import Path

PASTA = Path(__file__).resolve().parent
os.chdir(PASTA)
sys.path.insert(0, str(PASTA))

problemas = []


def titulo(texto):
    print(f"\n=== {texto}")


def ok(texto):
    print(f"  ✅ {texto}")


def ruim(texto, dica=""):
    print(f"  ❌ {texto}")
    if dica:
        print(f"     → {dica}")
    problemas.append(texto)


# 1) Python
titulo("1) Python")
print(f"  Versão: {sys.version.split()[0]}  ({sys.executable})")

# 2) Pacotes
titulo("2) Pacotes instalados")
for nome in ["fastapi", "uvicorn", "sqlalchemy", "pydantic_settings", "jwt", "bcrypt", "redis", "sentry_sdk"]:
    try:
        importlib.import_module(nome)
        ok(nome)
    except Exception as erro:
        ruim(f"{nome} não instalado ({erro.__class__.__name__})", "rode:  python -m pip install -r requirements.txt")

# 3) Arquivo .env
titulo("3) Arquivo .env (da pasta backend)")
env = PASTA / ".env"
if not env.exists():
    ruim("O arquivo .env NÃO existe nesta pasta", "copie .env.example para .env e preencha SECRET_KEY")
else:
    bruto = env.read_bytes()
    if bruto.startswith((b"\xff\xfe", b"\xfe\xff")):
        ruim(".env salvo em UTF-16 (acontece ao criar com 'echo' no PowerShell)",
             "abra no VS Code, apague tudo, cole de novo e salve em UTF-8 (canto inferior direito do VS Code)")
    else:
        try:
            texto = bruto.decode("utf-8-sig")
            nomes = []
            for linha in texto.splitlines():
                linha = linha.strip()
                if linha and not linha.startswith("#") and "=" in linha:
                    chave, _, valor = linha.partition("=")
                    nomes.append((chave.strip(), bool(valor.strip())))
            ok(f".env encontrado ({len(nomes)} variáveis)")
            for chave, preenchida in nomes:
                print(f"     {chave}: {'preenchida' if preenchida else 'VAZIA'}")
            definidas = {c for c, _ in nomes}
            if "SECRET_KEY" not in definidas or not dict(nomes).get("SECRET_KEY"):
                ruim("SECRET_KEY ausente ou vazia no .env", 'gere uma:  python -c "import secrets; print(secrets.token_hex(32))"')
            for linha in texto.splitlines():
                if linha.strip().startswith("HOST_DO_SERVIDOR") and "127.0.0.1" in linha:
                    ruim("HOST_DO_SERVIDOR=127.0.0.1 (só o próprio PC consegue acessar)", "troque por 0.0.0.0 ou apague a linha")
        except UnicodeDecodeError:
            ruim(".env com codificação inválida", "recrie o arquivo no VS Code (UTF-8)")

# 4) Configuração e importação do servidor
titulo("4) O servidor consegue carregar?")
try:
    importlib.import_module("config")
    ok("configurações (.env) válidas")
    importlib.import_module("main")
    ok("main.py importou sem erros")
except ModuleNotFoundError as erro:
    ruim(f"Falta um arquivo ou pacote: {erro}", "aplique a etapa/ajuste que cria esse arquivo, ou instale o pacote")
except Exception:
    ruim("O servidor NÃO consegue carregar. Erro completo abaixo:")
    traceback.print_exc()

# 5) Porta 5000
titulo("5) Porta 5000")
porta = 5000
try:
    teste = socket.socket()
    teste.bind(("0.0.0.0", porta))
    teste.close()
    ok(f"porta {porta} livre (o backend ainda NÃO está rodando)")
    rodando = False
except OSError:
    rodando = True
    ok(f"porta {porta} em uso (algo está rodando nela)")
if rodando:
    try:
        resposta = urllib.request.urlopen(f"http://127.0.0.1:{porta}/saude", timeout=5).read().decode()
        ok(f"o backend RESPONDE neste PC: {resposta}")
    except Exception as erro:
        ruim(f"a porta está ocupada, mas NÃO é o backend ({erro})", "feche o programa que usa a porta 5000, ou o terminal antigo")

# 6) IP do computador
titulo("6) IP do computador na rede")
try:
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    s.connect(("10.255.255.255", 1))
    ip = s.getsockname()[0]
    s.close()
    print(f"  IP local provável: {ip}")
    if ip.startswith(("192.168.", "10.", "172.")):
        ok("é um IP de rede local")
        print(f"  No frontend/.env use:  EXPO_PUBLIC_API_URL=http://{ip}:5000")
    else:
        ruim("o IP não parece de rede local", "desligue VPN e confira se o PC está no Wi-Fi")
except Exception as erro:
    ruim(f"não consegui descobrir o IP ({erro})")

titulo("Resumo")
if problemas:
    print(f"  {len(problemas)} problema(s) encontrado(s). Resolva na ordem acima e rode de novo.")
else:
    print("  Tudo certo neste lado. Se o app ainda não conecta: confira o IP no .env do app, o Wi-Fi do celular (mesma rede)")
    print("  e o Firewall do Windows (porta 5000). Teste no navegador do celular:  http://IP-DO-PC:5000/saude")

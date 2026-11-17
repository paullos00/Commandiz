# Arquivo: backend/teste_email.py
# Testa o envio de e-mail com as configurações SMTP do .env, sem precisar do app.
# Uso (na pasta backend):   python teste_email.py seu@email.com

import smtplib
import sys

from config import settings
from email_envio import _enviar


def main() -> None:
    if len(sys.argv) < 2:
        print("Uso: python teste_email.py seu@email.com")
        sys.exit(1)
    destino = sys.argv[1]

    if not settings.SMTP_HOST:
        print("❌ SMTP_HOST está vazio no .env. Preencha SMTP_HOST, SMTP_PORTA, SMTP_USUARIO e SMTP_SENHA.")
        sys.exit(1)

    print(f"Enviando por {settings.SMTP_HOST}:{settings.SMTP_PORTA} como {settings.SMTP_USUARIO or '(sem usuário)'} ...")
    try:
        _enviar(destino, "Teste de e-mail do Commandiz", "Se você recebeu isto, o envio de e-mail está funcionando! 🎉")
    except smtplib.SMTPAuthenticationError as erro:
        print(f"❌ Usuário ou senha recusados: {erro}")
        print("   Gmail: use uma 'senha de app' (não a senha normal), sem espaços, com a verificação em duas etapas ligada.")
        sys.exit(1)
    except (smtplib.SMTPException, OSError) as erro:
        print(f"❌ Falhou: {erro!r}")
        print("   Confira SMTP_HOST, SMTP_PORTA (587 ou 465), a internet, e se o antivírus/firewall não bloqueia a porta.")
        sys.exit(1)

    print(f"✅ Enviado para {destino}. Confira a caixa de entrada (e o spam).")


if __name__ == "__main__":
    main()

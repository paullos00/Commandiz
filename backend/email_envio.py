# Arquivo: backend/email_envio.py
# Envio de e-mails (ex.: código de recuperação de senha) por SMTP.
#
# Sem SMTP_HOST no .env, nada é enviado: em modo debug o e-mail aparece no TERMINAL do
# backend (ótimo para testar). Com SMTP configurado (ex.: Gmail com "senha de app"),
# o e-mail é enviado de verdade. Se o envio falhar, o MOTIVO aparece no terminal do backend.
# Para testar as configurações sem usar o app:  python teste_email.py seu@email.com

import logging
import smtplib
import ssl
from email.message import EmailMessage

from config import settings

log = logging.getLogger("commandiz.email")


def _enviar(destino: str, assunto: str, texto: str) -> None:
    """Envia de verdade. Se algo der errado, o erro sobe (quem chama decide o que fazer)."""
    mensagem = EmailMessage()
    mensagem["From"] = settings.SMTP_REMETENTE or settings.SMTP_USUARIO
    mensagem["To"] = destino
    mensagem["Subject"] = assunto
    mensagem.set_content(texto)

    contexto = ssl.create_default_context()
    if settings.SMTP_PORTA == 465:
        with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORTA, timeout=15, context=contexto) as servidor:
            if settings.SMTP_USUARIO:
                servidor.login(settings.SMTP_USUARIO, settings.SMTP_SENHA)
            servidor.send_message(mensagem)
    else:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORTA, timeout=15) as servidor:
            servidor.starttls(context=contexto)
            if settings.SMTP_USUARIO:
                servidor.login(settings.SMTP_USUARIO, settings.SMTP_SENHA)
            servidor.send_message(mensagem)


def enviar_email(destino: str, assunto: str, texto: str) -> None:
    if not settings.SMTP_HOST:
        if settings.DEBUG_MODE:
            print(
                f"\n========== E-MAIL DE TESTE (SMTP não configurado: nada foi enviado) ==========\n"
                f"Para: {destino}\nAssunto: {assunto}\n\n{texto}\n"
                f"==============================================================================\n"
            )
        else:
            print(f"[E-MAIL] SMTP não configurado: o e-mail para {destino} NÃO foi enviado.")
            log.warning("SMTP não configurado: e-mail para %s NÃO foi enviado.", destino)
        return

    try:
        _enviar(destino, assunto, texto)
        print(f"[E-MAIL] Enviado para {destino}.")
    except Exception as erro:  # não derruba a API se o e-mail falhar
        print(
            f"\n[E-MAIL] FALHA ao enviar para {destino}: {erro!r}\n"
            f"         Confira as variáveis SMTP_* do .env e rode:  python teste_email.py {destino}\n"
        )
        log.exception("Falha ao enviar e-mail para %s", destino)

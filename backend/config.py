# Lê as configurações do arquivo .env e VALIDA os tipos ao ligar o servidor
# (camada "Ponte de Ambiente" do documento: pydantic-settings).

from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent
(BASE_DIR / "instance").mkdir(exist_ok=True)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Se alguém escrever um texto onde deveria ser número, o servidor nem liga
    # e avisa o erro. Esse é o "superpoder" do pydantic-settings.
    DEBUG_MODE: bool = True
    HOST_DO_SERVIDOR: str = "0.0.0.0"
    PORTA_DO_SERVIDOR: int = 5000
    # Chave secreta que "assina" os tokens de login (JWT). OBRIGATÓRIA no .env.
    SECRET_KEY: str
    TOKEN_EXPIRA_MINUTOS: int = 10080  # 7 dias
    SENTRY_DSN: str = ""  # vazio = Sentry desligado
    REDIS_URL: str = ""  # vazio = Redis desligado
    # Pix (QR Code de pagamento). Necessário para aceitar pedidos em Pix.
    # PIX_CHAVE: CPF/CNPJ (só números), e-mail, celular no formato +5511999999999 ou chave aleatória.
    PIX_CHAVE: str = ""
    PIX_NOME_RECEBEDOR: str = "Commandiz Espetaria"  # até 25 letras (sem acento)
    PIX_CIDADE: str = "BRASIL"  # até 15 letras (sem acento)
    # E-mail (usado na recuperação de senha). Sem SMTP_HOST, o código de recuperação
    # aparece no TERMINAL do backend (só com DEBUG_MODE=True), útil para testar.
    SMTP_HOST: str = ""
    SMTP_PORTA: int = 587
    SMTP_USUARIO: str = ""
    SMTP_SENHA: str = ""
    SMTP_REMETENTE: str = ""
    DATABASE_URL: str = f"sqlite:///{(BASE_DIR / 'instance' / 'espetaria.db').as_posix()}"
    # E-mails dos ADMINISTRADORES, separados por vírgula (ex.: dono@email.com,gerente@email.com)
    ADMIN_EMAILS: str = ""
    # Quem pode chamar a API a partir de um NAVEGADOR (o app de celular não é afetado). "*" = qualquer um.
    CORS_ORIGINS: str = "*"

    @property
    def admin_emails(self) -> set:
        return {e.strip().lower() for e in self.ADMIN_EMAILS.split(",") if e.strip()}

    @property
    def cors_origins(self) -> list:
        itens = [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]
        return itens or ["*"]

    @field_validator("DATABASE_URL")
    @classmethod
    def ajustar_url_do_banco(cls, v: str) -> str:
        # Vazio (ex.: "DATABASE_URL=" no .env) = usa o SQLite local
        if not v.strip():
            return f"sqlite:///{(BASE_DIR / 'instance' / 'espetaria.db').as_posix()}"
        # Hospedagens (Render, Heroku...) entregam "postgres://..."; o SQLAlchemy precisa do driver psycopg.
        if v.startswith("postgres://"):
            return "postgresql+psycopg://" + v[len("postgres://"):]
        if v.startswith("postgresql://"):
            return "postgresql+psycopg://" + v[len("postgresql://"):]
        return v


settings = Settings()
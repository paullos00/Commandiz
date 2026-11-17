from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from config import settings

argumentos = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(settings.DATABASE_URL, connect_args=argumentos, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine)

# O SQLite, por padrão, IGNORA as chaves estrangeiras (e o "apagar em cascata").
# Esta linha liga a conferência, como nos outros bancos de dados.
if settings.DATABASE_URL.startswith("sqlite"):

    @event.listens_for(engine, "connect")
    def _ativar_chaves_estrangeiras(conexao, _registro):
        cursor = conexao.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


class Base(DeclarativeBase):
    pass


def get_db():
    """Abre uma conversa com o banco para cada requisição e fecha no final."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

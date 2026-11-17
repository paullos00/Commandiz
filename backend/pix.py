# Arquivo: backend/pix.py
# Gera o código "Pix Copia e Cola" (e, com ele, o QR Code) no padrão BR Code do Banco Central.
#
# É um Pix ESTÁTICO: o dinheiro cai direto na chave Pix da espetaria, mas o sistema NÃO
# consegue saber sozinho que o cliente pagou. Quem confere o recebimento (no app do banco)
# é a espetaria. Para confirmação automática seria preciso um provedor (ex.: Mercado Pago).

import re
import unicodedata
from decimal import Decimal


def _campo(identificador: str, valor: str) -> str:
    return f"{identificador}{len(valor):02d}{valor}"


def _limpar(texto: str, tamanho: int) -> str:
    """Tira acentos e símbolos (o padrão aceita só caracteres simples) e corta no tamanho máximo."""
    sem_acento = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode("ascii")
    limpo = re.sub(r"[^A-Za-z0-9 ]", "", sem_acento).strip().upper()
    return limpo[:tamanho] or "NA"


def crc16(texto: str) -> str:
    """CRC-16/CCITT-FALSE, exigido no final do código."""
    crc = 0xFFFF
    for byte in texto.encode("ascii"):
        crc ^= byte << 8
        for _ in range(8):
            crc = ((crc << 1) ^ 0x1021) if (crc & 0x8000) else (crc << 1)
            crc &= 0xFFFF
    return f"{crc:04X}"


def gerar_pix_copia_e_cola(chave: str, nome: str, cidade: str, valor: Decimal, txid: str) -> str:
    chave = chave.strip()
    identificador = re.sub(r"[^A-Za-z0-9]", "", txid)[:25] or "***"
    conta = _campo("00", "br.gov.bcb.pix") + _campo("01", chave)

    corpo = (
        _campo("00", "01")
        + _campo("01", "11")
        + _campo("26", conta)
        + _campo("52", "0000")
        + _campo("53", "986")
        + _campo("54", f"{valor:.2f}")
        + _campo("58", "BR")
        + _campo("59", _limpar(nome, 25))
        + _campo("60", _limpar(cidade, 15))
        + _campo("62", _campo("05", identificador))
        + "6304"
    )
    return corpo + crc16(corpo)

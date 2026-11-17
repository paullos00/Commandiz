# Arquivo: backend/tests/test_pix.py
# Testes do gerador de Pix (não usam a API, só o cálculo).

from decimal import Decimal

import pix


def test_crc16_padrao():
    assert pix.crc16("123456789") == "29B1"  # valor de referência do CRC-16/CCITT-FALSE


def test_crc16_exemplo_do_manual_do_banco_central():
    base = (
        "00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266554400005204000053039865802BR5913"
        "Fulano de Tal6008BRASILIA62070503***6304"
    )
    assert pix.crc16(base) == "1D3D"


def test_codigo_gerado_e_valido():
    codigo = pix.gerar_pix_copia_e_cola("loja@exemplo.com", "Espetaria São João", "Sumaré", Decimal("26.73"), "CMD-12")
    assert "ESPETARIA SAO JOAO" in codigo and "SUMARE" in codigo  # sem acentos e em maiúsculas
    assert "540526.73" in codigo
    assert "0505CMD12" in codigo  # txid só com letras e números
    assert pix.crc16(codigo[:-4]) == codigo[-4:]

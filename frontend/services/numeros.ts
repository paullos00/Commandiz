// Arquivo: frontend/services/numeros.ts
// Lê números digitados pela pessoa ("9,90", "R$ 10", "7.5").

export function lerNumero(texto: string): number | null {
  const limpo = texto.replace(/[^0-9,.]/g, "").replace(",", ".");
  if (!limpo) return null;
  const numero = Number(limpo);
  return Number.isFinite(numero) ? Math.round(numero * 100) / 100 : null;
}

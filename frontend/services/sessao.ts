// Guarda os dados da sessão no COFRE do celular (Expo SecureStore):
// Keychain no iOS e Keystore no Android.

import * as SecureStore from "expo-secure-store";

// Atenção: o SecureStore só aceita letras, números, ".", "-" e "_" nos nomes.
const CHAVE_CLIENTE = "commandiz_cliente_id";
const CHAVE_TOKEN = "commandiz_token";

export async function salvarClienteId(id: number): Promise<void> {
  await SecureStore.setItemAsync(CHAVE_CLIENTE, String(id));
}

export async function lerClienteId(): Promise<number | null> {
  const valor = await SecureStore.getItemAsync(CHAVE_CLIENTE);
  const numero = valor ? Number(valor) : NaN;
  return Number.isInteger(numero) && numero > 0 ? numero : null;
}

// O token (JWT) será usado quando fizermos o login.
export async function salvarToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(CHAVE_TOKEN, token);
}

export async function lerToken(): Promise<string | null> {
  return SecureStore.getItemAsync(CHAVE_TOKEN);
}

export async function limparSessao(): Promise<void> {
  await SecureStore.deleteItemAsync(CHAVE_CLIENTE);
  await SecureStore.deleteItemAsync(CHAVE_TOKEN);
}
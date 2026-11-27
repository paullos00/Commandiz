// Configurações do app por ambiente (camada "Ponte de Ambiente" do documento).
// O endereço da API vem do arquivo .env (variável EXPO_PUBLIC_API_URL).

import Constants from "expo-constants";

const enderecoConfigurado = (process.env.EXPO_PUBLIC_API_URL ?? "").trim().replace(/\/+$/, "");

export const API_URL: string =
  enderecoConfigurado.includes("SEU-SERVICO") || enderecoConfigurado.includes("SEU-IP")
    ? ""
    : enderecoConfigurado;

// __DEV__ é true no Expo Go / desenvolvimento e false no app publicado.
export const EM_PRODUCAO: boolean = !__DEV__;

export const VERSAO_APP: string = Constants.expoConfig?.version ?? "1.0.0";

// Endereço do Sentry (vazio = desligado). Vem do arquivo .env.
export const SENTRY_DSN: string = process.env.EXPO_PUBLIC_SENTRY_DSN ?? "";
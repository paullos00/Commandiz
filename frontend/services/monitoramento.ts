// Relatório de erros (Sentry): quando algo quebra no app, a equipe é avisada.
// Se EXPO_PUBLIC_SENTRY_DSN estiver vazio no .env, tudo aqui fica desligado.

import * as Sentry from "@sentry/react-native";

import { EM_PRODUCAO, SENTRY_DSN, VERSAO_APP } from "../constants/config";

let iniciado = false;

export function iniciarMonitoramento() {
  if (iniciado || !SENTRY_DSN) return;

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: EM_PRODUCAO ? "producao" : "desenvolvimento",
    release: `commandiz@${VERSAO_APP}`,
    sendDefaultPii: false, // não envia dados pessoais
    tracesSampleRate: 0,
  });
  iniciado = true;
}

export function monitoramentoAtivo(): boolean {
  return iniciado;
}

// Identifica quem estava usando o app só pelo número (nunca nome, e-mail ou senha).
export function definirUsuario(clienteId: number | null) {
  if (!iniciado) return;
  Sentry.setUser(clienteId ? { id: String(clienteId) } : null);
}

export function relatarErro(erro: unknown, contexto?: Record<string, unknown>) {
  if (!iniciado) return;
  Sentry.captureException(erro, { extra: contexto });
}
// O "caderninho de memória" do app (TanStack Query): guarda as respostas do
// servidor para não pedir a mesma coisa toda hora.

import { QueryClient } from "@tanstack/react-query";

import type { ApiError } from "./api";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // por 30 segundos a resposta é considerada "fresca"
      // Só tenta de novo quando o problema foi de rede (servidor não alcançado).
      retry: (tentativas, erro) => (erro as ApiError).status === 0 && tentativas < 2,
    },
  },
});
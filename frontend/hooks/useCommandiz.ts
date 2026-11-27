// Os "ajudantes" que as telas usam para buscar e alterar dados (TanStack Query).
// Depois de cada alteração, o carrinho, os favoritos e os pedidos são atualizados sozinhos.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";

import { api, type NovoItem, type NovoPedido } from "../services/api";

function avisarErro(erro: Error) {
  Alert.alert("Ops", erro.message);
}

// ---------- Consultas ----------

export function useEspetos() {
  return useQuery({ queryKey: ["espetos"], queryFn: () => api.listarEspetos(), staleTime: 5 * 60_000 });
}

export function useCombos() {
  return useQuery({ queryKey: ["combos"], queryFn: () => api.listarCombos(), staleTime: 5 * 60_000 });
}

export function useCarrinho(clienteId: number) {
  return useQuery({ queryKey: ["carrinho", clienteId], queryFn: () => api.verCarrinho(clienteId) });
}

export function useFavoritos(clienteId: number) {
  return useQuery({ queryKey: ["favoritos", clienteId], queryFn: () => api.listarFavoritos(clienteId) });
}

export function usePedidos(clienteId: number) {
  // refetchInterval: confere sozinho a cada 15 segundos (para ver o status mudar)
  return useQuery({
    queryKey: ["pedidos", clienteId],
    queryFn: () => api.listarPedidos(clienteId),
    refetchInterval: 15_000,
  });
}

// ---------- Alterações do carrinho ----------

export function useAdicionarAoCarrinho(clienteId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (item: NovoItem) => api.adicionarAoCarrinho(clienteId, item),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["carrinho", clienteId] }),
    onError: avisarErro,
  });
}

export function useMudarQuantidade(clienteId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, quantidade }: { itemId: number; quantidade: number }) =>
      api.mudarQuantidade(itemId, quantidade),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["carrinho", clienteId] }),
    onError: avisarErro,
  });
}

export function useRemoverItem(clienteId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: number) => api.removerItem(itemId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["carrinho", clienteId] }),
    onError: avisarErro,
  });
}

export function useLimparCarrinho(clienteId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.limparCarrinho(clienteId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["carrinho", clienteId] }),
    onError: avisarErro,
  });
}

// ---------- Favoritos ----------

// "favorito" = true se o espeto JÁ é favorito (então o toque remove).
export function useAlternarFavorito(clienteId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ espetoId, favorito }: { espetoId: number; favorito: boolean }) =>
      favorito ? api.desfavoritar(clienteId, espetoId) : api.favoritar(clienteId, espetoId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["favoritos", clienteId] }),
    onError: avisarErro,
  });
}

// ---------- Pedidos ----------

export function useFecharPedido(clienteId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dados: NovoPedido) => api.fecharPedido(clienteId, dados),
    onSuccess: () => {
      // O carrinho foi esvaziado e o pedido novo entra no histórico.
      qc.invalidateQueries({ queryKey: ["carrinho", clienteId] });
      qc.invalidateQueries({ queryKey: ["pedidos", clienteId] });
      qc.invalidateQueries({ queryKey: ["cupons", clienteId] });
    },
    onError: avisarErro,
  });
}

// ---------- Sobre a Casa ----------

export function useCasa() {
  return useQuery({ queryKey: ["casa"], queryFn: () => api.infoCasa(), staleTime: 60 * 60_000 });
}

// ---------- Avaliações ----------

export function useResumoAvaliacoes() {
  return useQuery({ queryKey: ["avaliacoes"], queryFn: () => api.resumoAvaliacoes(), staleTime: 5 * 60_000 });
}

export function useAvaliarPedido(clienteId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ pedidoId, nota, comentario }: { pedidoId: number; nota: number; comentario?: string }) =>
      api.avaliarPedido(clienteId, pedidoId, { nota, comentario }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pedidos", clienteId] });
      qc.invalidateQueries({ queryKey: ["avaliacoes"] });
    },
    onError: avisarErro,
  });
}

// ---------- Categorias ----------

export function useCategorias() {
  return useQuery({ queryKey: ["categorias"], queryFn: () => api.listarCategorias(), staleTime: 5 * 60_000 });
}

// ---------- Cupons ----------

export function useCuponsDisponiveis(clienteId: number) {
  return useQuery({ queryKey: ["cupons", clienteId], queryFn: () => api.cuponsDisponiveis(clienteId) });
}

// ---------- Notificações ----------

export function useNotificacoes(clienteId: number) {
  return useQuery({
    queryKey: ["notificacoes", clienteId],
    queryFn: () => api.listarNotificacoes(clienteId),
    refetchInterval: 15_000,
  });
}

export function useMarcarNotificacoesLidas(clienteId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.marcarNotificacoesLidas(clienteId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notificacoes", clienteId] }),
  });
}

// ---------- Commandiz Club ----------

export function useClube(clienteId: number) {
  return useQuery({ queryKey: ["clube", clienteId], queryFn: () => api.verClube(clienteId) });
}

export function useResgatar(clienteId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (recompensaId: string) => api.resgatarRecompensa(clienteId, recompensaId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clube", clienteId] });
      qc.invalidateQueries({ queryKey: ["cupons", clienteId] });
    },
    onError: avisarErro,
  });
}

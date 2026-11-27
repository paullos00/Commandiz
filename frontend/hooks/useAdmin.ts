// Arquivo: frontend/hooks/useAdmin.ts
// Ajudantes (TanStack Query) das telas de administrador.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";

import { api, type CupomAdminIn, type ProdutoAdminIn } from "../services/api";

function avisarErro(erro: Error) {
  Alert.alert("Ops", erro.message);
}

export function useAdminPedidos(somenteAtivos: boolean) {
  return useQuery({
    queryKey: ["admin", "pedidos", somenteAtivos],
    queryFn: () => api.adminPedidos(somenteAtivos),
    refetchInterval: 10_000,
  });
}

export function useAdminMudarStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ pedidoId, status }: { pedidoId: number; status: string }) => api.adminMudarStatus(pedidoId, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "pedidos"] }),
    onError: avisarErro,
  });
}

export function useAdminCardapio() {
  return useQuery({ queryKey: ["admin", "cardapio"], queryFn: () => api.adminCardapio() });
}

function useAtualizarCardapio() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["admin", "cardapio"] });
    qc.invalidateQueries({ queryKey: ["espetos"] });
    qc.invalidateQueries({ queryKey: ["combos"] });
    qc.invalidateQueries({ queryKey: ["categorias"] });
  };
}

// Cria (sem id) ou edita (com id) um espeto/combo.
export function useAdminSalvarProduto() {
  const atualizar = useAtualizarCardapio();
  return useMutation({
    mutationFn: ({ tipo, id, dados }: { tipo: "espeto" | "combo"; id?: number; dados: ProdutoAdminIn }) =>
      id === undefined ? api.adminCriarProduto(tipo, dados) : api.adminAtualizarProduto(tipo, id, dados),
    onSuccess: atualizar,
    onError: avisarErro,
  });
}

export function useAdminExcluirProduto() {
  const atualizar = useAtualizarCardapio();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tipo, id }: { tipo: "espeto" | "combo"; id: number }) => api.adminExcluirProduto(tipo, id),
    onSuccess: () => {
      atualizar();
      qc.invalidateQueries({ queryKey: ["carrinho"] });
      qc.invalidateQueries({ queryKey: ["favoritos"] });
    },
    onError: avisarErro,
  });
}

export function useAdminCriarCategoria() {
  const atualizar = useAtualizarCardapio();
  return useMutation({
    mutationFn: ({ nome, visivel }: { nome: string; visivel: boolean }) => api.adminCriarCategoria(nome, visivel),
    onSuccess: atualizar,
    onError: avisarErro,
  });
}

export function useAdminExcluirCategoria() {
  const atualizar = useAtualizarCardapio();
  return useMutation({
    mutationFn: (id: number) => api.adminExcluirCategoria(id),
    onSuccess: atualizar,
    onError: avisarErro,
  });
}

export function useAdminCupons() {
  return useQuery({ queryKey: ["admin", "cupons"], queryFn: () => api.adminCupons() });
}

export function useAdminCriarCupom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dados: CupomAdminIn) => api.adminCriarCupom(dados),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "cupons"] }),
    onError: avisarErro,
  });
}

export function useAdminAtualizarCupom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ativo }: { id: number; ativo: boolean }) => api.adminAtualizarCupom(id, { ativo }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "cupons"] }),
    onError: avisarErro,
  });
}

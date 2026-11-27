// Aba "Pedidos": o histórico de pedidos do cliente (puxe para baixo para atualizar).

import { useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { usePedidos } from "../hooks/useCommandiz";
import AvaliacaoPedido from "./AvaliacaoPedido";
import { formatarPreco, type Pedido } from "../services/api";

const NOMES_STATUS: Record<string, string> = {
  recebido: "Recebido",
  em_preparo: "Em preparo 🔥",
  pronto: "Pronto ✅",
  entregue: "Entregue 🎉",
  cancelado: "Cancelado",
};

function formatarStatus(status: string): string {
  return NOMES_STATUS[status] ?? status;
}

function formatarDataCurta(iso: string): string {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return "";
  const dois = (n: number) => String(n).padStart(2, "0");
  return `${dois(data.getDate())}/${dois(data.getMonth() + 1)}/${data.getFullYear()}`;
}

function formatarHora(iso: string): string {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return "";
  const dois = (n: number) => String(n).padStart(2, "0");
  return `${dois(data.getHours())}:${dois(data.getMinutes())}`;
}

function corStatus(status: string): string {
  if (status === "entregue") return "#20aa69";
  if (status === "cancelado") return "#b00020";
  return "#d84315";
}

function statusNoIndice(status: string): number {
  if (status === "recebido") return 0;
  if (status === "em_preparo") return 2;
  if (status === "pronto") return 3;
  if (status === "entregue") return 4;
  return -1;
}

export default function Pedidos({
  clienteId,
  aoMostrarPix,
}: {
  clienteId: number;
  aoMostrarPix?: (pedido: Pedido) => void;
}) {
  const pedidos = usePedidos(clienteId);
  const [pedidoSelecionado, setPedidoSelecionado] = useState<Pedido | null>(null);

  if (pedidos.isPending) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" />
        <Text>Carregando pedidos...</Text>
      </View>
    );
  }

  if (pedidos.error) {
    return (
      <View style={styles.centro}>
        <Text style={styles.titulo}>Ops, deu erro 😕</Text>
        <Text style={styles.erro}>{pedidos.error.message}</Text>
        <Pressable style={styles.botao} onPress={() => pedidos.refetch()}>
          <Text style={styles.textoBotao}>Tentar de novo</Text>
        </Pressable>
      </View>
    );
  }

  const lista = pedidos.data ?? [];

  if (lista.length === 0) {
    return (
      <View style={styles.centro}>
        <Text style={styles.vazio}>Você ainda não fez nenhum pedido 🍢{"\n"}Adicione itens ao carrinho e finalize.</Text>
      </View>
    );
  }

  if (pedidoSelecionado) {
    const pedido = lista.find((item) => item.id === pedidoSelecionado.id) ?? pedidoSelecionado;
    const indiceAtual = statusNoIndice(pedido.status);
    const etapas = [
      { titulo: "Pedido recebido", descricao: "Seu pedido foi registrado" },
      { titulo: "Pagamento confirmado", descricao: "Pagamento aprovado" },
      { titulo: "Preparando seu pedido", descricao: "Em preparação na cozinha" },
      { titulo: "Pronto para retirar", descricao: "Seu pedido está pronto" },
      { titulo: "Pedido concluído", descricao: "Pedido entregue" },
    ];

    return (
      <ScrollView
        contentContainerStyle={styles.detalhesLista}
        refreshControl={<RefreshControl refreshing={pedidos.isRefetching} onRefresh={() => pedidos.refetch()} />}
      >
        <Pressable
          style={styles.voltar}
          onPress={() => setPedidoSelecionado(null)}
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={18} color="#642600" />
          <Text style={styles.textoVoltar}>Acompanhar pedido</Text>
        </Pressable>

        <View style={styles.cardAcompanhamento}>
          <View style={styles.linha}>
            <Text style={styles.nomeAcompanhamento}>Pedido #{pedido.id}</Text>
            <Text style={[styles.statusDetalhe, { color: corStatus(pedido.status) }]}>
              {formatarStatus(pedido.status)}
            </Text>
          </View>
          <Text style={styles.detalheData}>Pedido realizado às {formatarHora(pedido.criado_em)}</Text>
        </View>

        {pedido.status === "cancelado" ? (
          <View style={styles.cardAndamento}>
            <Text style={[styles.etapaTitulo, { color: "#b00020" }]}>Pedido cancelado</Text>
            <Text style={styles.etapaDescricao}>Este pedido não será preparado.</Text>
          </View>
        ) : (
          <View style={styles.cardAndamento}>
            <Text style={styles.rotuloAndamento}>Status do pedido</Text>
            {etapas.map((etapa, indice) => {
              const concluida = indice <= indiceAtual;
              const atual = indice === indiceAtual;
              return (
                <View key={etapa.titulo} style={styles.etapaLinha}>
                  <View style={[styles.etapaMarcador, concluida ? styles.etapaMarcadorAtivo : null]}>
                    {concluida ? <Ionicons name="checkmark" size={13} color="#fff" /> : null}
                  </View>
                  <View style={styles.etapaTexto}>
                    <Text style={[styles.etapaTitulo, atual && styles.etapaAtual]}>{etapa.titulo}</Text>
                    {concluida ? <Text style={styles.etapaDescricao}>{etapa.descricao}</Text> : null}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.cardResumo}>
          <Text style={styles.resumoTitulo}>Resumo do pedido</Text>
          {pedido.itens.map((item, indice) => (
            <View key={indice} style={styles.resumoLinha}>
              <Text style={styles.resumoItem}>{item.quantidade}× {item.nome}</Text>
              <Text style={styles.resumoValor}>{formatarPreco(item.subtotal)}</Text>
            </View>
          ))}
          {pedido.cupom_codigo && pedido.desconto ? (
            <View style={styles.resumoLinha}>
              <Text style={styles.resumoItem}>Cupom {pedido.cupom_codigo}</Text>
              <Text style={styles.resumoValor}>− {formatarPreco(pedido.desconto)}</Text>
            </View>
          ) : null}
          <View style={[styles.resumoLinha, styles.totalDetalhe]}>
            <Text style={styles.totalTexto}>Total</Text>
            <Text style={styles.totalTextoVermelho}>{formatarPreco(pedido.total)}</Text>
          </View>
        </View>

        {pedido.forma_pagamento === "pix" && pedido.pix_copia_cola && pedido.status === "recebido" && aoMostrarPix ? (
          <Pressable style={styles.botaoDetalhe} onPress={() => aoMostrarPix(pedido)}>
            <Text style={styles.textoBotao}>Ver detalhes do pedido</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.botaoDetalhe} onPress={() => setPedidoSelecionado(null)}>
            <Text style={styles.textoBotao}>Ver detalhes do pedido</Text>
          </Pressable>
        )}

        <AvaliacaoPedido pedido={pedido} clienteId={clienteId} />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.lista}
      refreshControl={<RefreshControl refreshing={pedidos.isRefetching} onRefresh={() => pedidos.refetch()} />}
    >
      <Text style={styles.tituloLista}>Meus pedidos</Text>
      {lista.map((pedido) => (
        <View key={pedido.id} style={styles.card}>
          <View style={styles.linha}>
            <Text style={styles.nome}>Pedido #{pedido.id}</Text>
            {pedido.status === "entregue" ? (
              <View style={styles.statusConcluido}>
                <View style={styles.pontoStatus} />
                <Text style={styles.statusConcluidoTexto}>Concluído</Text>
              </View>
            ) : (
              <Text style={[styles.status, { color: corStatus(pedido.status) }]}>{formatarStatus(pedido.status)}</Text>
            )}
          </View>

          <Text style={styles.dataLista}>{formatarDataCurta(pedido.criado_em)}</Text>

          {pedido.itens.slice(0, 3).map((item, indice) => (
            <Text key={indice} style={styles.itemLista}>
              {item.quantidade}x {item.nome}
            </Text>
          ))}

          {pedido.itens.length > 3 ? (
            <Text style={styles.itemLista}>+ {pedido.itens.length - 3} itens</Text>
          ) : null}

          {pedido.status === "em_preparo" ? (
            <Pressable style={styles.botaoAcompanhar} onPress={() => setPedidoSelecionado(pedido)}>
              <Text style={styles.textoAcompanhar}>Acompanhar pedido</Text>
            </Pressable>
          ) : (
            <View style={styles.rodapeCard}>
              <Text style={styles.precoLista}>{formatarPreco(pedido.total)}</Text>
              <Pressable onPress={() => setPedidoSelecionado(pedido)} accessibilityRole="button">
                <Text style={pedido.status === "entregue" ? styles.linkDetalheConcluido : styles.linkDetalhe}>
                  Ver detalhes
                </Text>
              </Pressable>
            </View>
          )}

          {pedido.status === "entregue" ? (
            <AvaliacaoPedido pedido={pedido} clienteId={clienteId} />
          ) : null}
        </View>
      ))}
    </ScrollView>
  );
}

const COR = "#d84315";

const styles = StyleSheet.create({
  lista: { padding: 16, paddingTop: 10, gap: 12, paddingBottom: 30 },
  tituloLista: { color: "#642600", fontSize: 18, fontWeight: "800", marginBottom: 2 },
  centro: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 8 },
  titulo: { fontSize: 22, fontWeight: "bold" },
  erro: { color: "#b00020", textAlign: "center" },
  vazio: { textAlign: "center", fontSize: 16 },
  card: { padding: 12, borderRadius: 12, borderWidth: 1, borderColor: "#ead9ca", backgroundColor: "#fff", gap: 5 },
  linha: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  nome: { color: "#642600", fontSize: 16, fontWeight: "800" },
  status: { color: COR, fontWeight: "bold" },
  statusConcluido: { flexDirection: "row", alignItems: "center", gap: 5 },
  pontoStatus: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#20aa69" },
  statusConcluidoTexto: { color: "#20aa69", fontWeight: "800", fontSize: 11 },
  dataLista: { color: "#8a8179", fontSize: 11 },
  itemLista: { color: "#642600", fontSize: 12 },
  rodapeCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  precoLista: { color: COR, fontSize: 15, fontWeight: "900" },
  linkDetalhe: { color: COR, fontSize: 12, fontWeight: "800" },
  linkDetalheConcluido: { color: "#642600", fontSize: 12, fontWeight: "800" },
  botaoAcompanhar: {
    backgroundColor: "#f0ddd0",
    minHeight: 42,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5,
  },
  textoAcompanhar: { color: "#642600", fontWeight: "800", fontSize: 12 },
  detalhe: { color: "#666" },
  item: { flexShrink: 1 },
  linkPix: { color: "#d84315", fontWeight: "bold", marginTop: 6 },
  obs: { color: "#888", fontStyle: "italic", fontSize: 13 },
  totalLinha: { marginTop: 4, paddingTop: 6, borderTopWidth: 1, borderTopColor: "#eee" },
  preco: { fontWeight: "bold" },
  botao: { backgroundColor: COR, padding: 14, borderRadius: 10, alignItems: "center", marginTop: 8 },
  textoBotao: { color: "#fff", fontWeight: "bold" },

  detalhesLista: { padding: 16, paddingTop: 8, gap: 10, paddingBottom: 30 },
  voltar: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 2 },
  textoVoltar: { color: "#642600", fontSize: 15, fontWeight: "800" },
  cardAcompanhamento: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ead9ca",
    borderRadius: 12,
    padding: 12,
  },
  nomeAcompanhamento: { color: "#642600", fontSize: 15, fontWeight: "800" },
  statusDetalhe: { fontSize: 8, fontWeight: "900", textTransform: "uppercase" },
  detalheData: { color: "#642600", fontSize: 11, marginTop: 8 },
  cardAndamento: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ead9ca",
    borderRadius: 12,
    padding: 12,
  },
  rotuloAndamento: { color: "#642600", fontSize: 12, fontWeight: "800", marginBottom: 10 },
  etapaLinha: { flexDirection: "row", minHeight: 48, gap: 9 },
  etapaMarcador: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#c8c0b7",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  etapaMarcadorAtivo: { borderColor: "#642600", backgroundColor: "#642600" },
  etapaTexto: { flex: 1, paddingBottom: 7 },
  etapaTitulo: { color: "#642600", fontSize: 12, fontWeight: "700" },
  etapaAtual: { color: COR },
  etapaDescricao: { color: "#8a8179", fontSize: 9, marginTop: 2 },
  cardResumo: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ead9ca",
    borderRadius: 12,
    padding: 12,
  },
  resumoTitulo: { color: "#642600", fontSize: 12, fontWeight: "800", marginBottom: 7 },
  resumoLinha: { flexDirection: "row", justifyContent: "space-between", gap: 10, marginTop: 4 },
  resumoItem: { color: "#642600", fontSize: 11 },
  resumoValor: { color: "#642600", fontSize: 11 },
  totalDetalhe: { borderTopWidth: 1, borderTopColor: "#ead9ca", paddingTop: 8, marginTop: 8 },
  totalTexto: { color: "#642600", fontSize: 12, fontWeight: "900" },
  totalTextoVermelho: { color: COR, fontSize: 13, fontWeight: "900" },
  botaoDetalhe: {
    backgroundColor: COR,
    minHeight: 46,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});
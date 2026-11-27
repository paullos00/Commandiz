// Arquivo: frontend/components/AdminPedidos.tsx
// Administrador: pedidos de todos os clientes, com botões para mudar o status.

import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";

import { useAdminMudarStatus, useAdminPedidos } from "../hooks/useAdmin";
import { formatarPreco, type PedidoAdmin } from "../services/api";

const NOMES_STATUS: Record<string, string> = {
  recebido: "Recebido",
  em_preparo: "Em preparo 🔥",
  pronto: "Pronto ✅",
  entregue: "Entregue 🎉",
  cancelado: "Cancelado",
};

const BOTOES: Record<string, string> = {
  em_preparo: "Iniciar preparo",
  pronto: "Marcar pronto",
  entregue: "Marcar entregue",
  cancelado: "Cancelar pedido",
};

const FORMAS: Record<string, string> = { pix: "Pix", cartao: "Cartão", dinheiro: "Dinheiro" };

function formatarData(iso: string): string {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return "";
  const dois = (n: number) => String(n).padStart(2, "0");
  return `${dois(data.getDate())}/${dois(data.getMonth() + 1)} ${dois(data.getHours())}:${dois(data.getMinutes())}`;
}

export default function AdminPedidos() {
  const [somenteAtivos, setSomenteAtivos] = useState(true);
  const pedidos = useAdminPedidos(somenteAtivos);
  const mudar = useAdminMudarStatus();

  function mudarStatus(pedido: PedidoAdmin, status: string) {
    if (status === "cancelado") {
      Alert.alert("Cancelar pedido", `Cancelar o pedido #${pedido.id}? O cliente será avisado.`, [
        { text: "Voltar", style: "cancel" },
        { text: "Cancelar pedido", style: "destructive", onPress: () => mudar.mutate({ pedidoId: pedido.id, status }) },
      ]);
      return;
    }
    mudar.mutate({ pedidoId: pedido.id, status });
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.filtros}>
        <Pressable style={[styles.chip, somenteAtivos && styles.chipAtivo]} onPress={() => setSomenteAtivos(true)}>
          <Text style={[styles.textoChip, somenteAtivos && styles.textoChipAtivo]}>Em andamento</Text>
        </Pressable>
        <Pressable style={[styles.chip, !somenteAtivos && styles.chipAtivo]} onPress={() => setSomenteAtivos(false)}>
          <Text style={[styles.textoChip, !somenteAtivos && styles.textoChipAtivo]}>Todos</Text>
        </Pressable>
      </View>

      {pedidos.isPending ? (
        <View style={styles.centro}>
          <ActivityIndicator size="large" />
        </View>
      ) : pedidos.error ? (
        <View style={styles.centro}>
          <Text style={styles.erro}>{pedidos.error.message}</Text>
          <Pressable style={styles.botao} onPress={() => pedidos.refetch()}>
            <Text style={styles.textoBotao}>Tentar de novo</Text>
          </Pressable>
        </View>
      ) : (pedidos.data ?? []).length === 0 ? (
        <View style={styles.centro}>
          <Text style={styles.vazio}>Nenhum pedido por aqui ✅</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.lista}
          refreshControl={<RefreshControl refreshing={pedidos.isRefetching} onRefresh={() => pedidos.refetch()} />}
        >
          {(pedidos.data ?? []).map((p) => (
            <View key={p.id} style={styles.card}>
              <View style={styles.linha}>
                <Text style={styles.nome}>Pedido #{p.id}</Text>
                <Text style={styles.status}>{NOMES_STATUS[p.status] ?? p.status}</Text>
              </View>
              <Text style={styles.detalhe}>
                {p.cliente_nome} • {p.cliente_telefone}
              </Text>
              <Text style={styles.detalhe}>
                {formatarData(p.criado_em)} • {FORMAS[p.forma_pagamento] ?? p.forma_pagamento}
                {p.forma_pagamento === "dinheiro" && p.troco ? ` • troco ${formatarPreco(p.troco)}` : ""}
              </Text>

              {p.itens.map((item, i) => (
                <View key={i}>
                  <Text>
                    {item.quantidade}× {item.nome}
                  </Text>
                  {item.observacao ? <Text style={styles.obs}>Obs.: {item.observacao}</Text> : null}
                </View>
              ))}

              {p.cupom_codigo && p.desconto ? (
                <Text style={styles.detalhe}>
                  Cupom {p.cupom_codigo}: − {formatarPreco(p.desconto)}
                </Text>
              ) : null}
              <Text style={styles.total}>Total {formatarPreco(p.total)}</Text>

              {p.proximos.length > 0 ? (
                <View style={styles.botoes}>
                  {p.proximos.map((status) => (
                    <Pressable
                      key={status}
                      style={[status === "cancelado" ? styles.botaoPerigo : styles.botaoPequeno, mudar.isPending && styles.desativado]}
                      disabled={mudar.isPending}
                      onPress={() => mudarStatus(p, status)}
                    >
                      <Text style={status === "cancelado" ? styles.textoPerigo : styles.textoBotao}>
                        {BOTOES[status] ?? status}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const COR = "#d84315";

const styles = StyleSheet.create({
  filtros: { flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingBottom: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1, borderColor: COR },
  chipAtivo: { backgroundColor: COR },
  textoChip: { color: COR, fontWeight: "600" },
  textoChipAtivo: { color: "#fff" },
  lista: { padding: 16, paddingTop: 4, gap: 12, paddingBottom: 40 },
  centro: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 8 },
  vazio: { fontSize: 16 },
  erro: { color: "#b00020", textAlign: "center" },
  card: { padding: 12, borderRadius: 12, borderWidth: 1, borderColor: "#ddd", gap: 4 },
  linha: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  nome: { fontSize: 18, fontWeight: "bold" },
  status: { color: COR, fontWeight: "bold" },
  detalhe: { color: "#888" },
  obs: { color: "#888", fontStyle: "italic", fontSize: 13 },
  total: { fontWeight: "bold", marginTop: 4 },
  botoes: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  botaoPequeno: { backgroundColor: COR, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 },
  botaoPerigo: { borderWidth: 1, borderColor: "#b00020", paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 },
  textoPerigo: { color: "#b00020", fontWeight: "bold" },
  desativado: { opacity: 0.5 },
  botao: { backgroundColor: COR, padding: 14, borderRadius: 10, alignItems: "center" },
  textoBotao: { color: "#fff", fontWeight: "bold" },
});

// Aba "Pedidos": o histórico de pedidos do cliente (puxe para baixo para atualizar).

import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";

import { usePedidos } from "../hooks/useCommandiz";
import AvaliacaoPedido from "./AvaliacaoPedido";
import { formatarPreco, type FormaPagamento, type Pedido } from "../services/api";

const NOMES_PAGAMENTO: Record<FormaPagamento, string> = {
  pix: "Pix",
  cartao: "Cartão",
  dinheiro: "Dinheiro",
};

function formatarData(iso: string): string {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return "";
  const dois = (n: number) => String(n).padStart(2, "0");
  return `${dois(data.getDate())}/${dois(data.getMonth() + 1)}/${data.getFullYear()} às ${dois(
    data.getHours(),
  )}:${dois(data.getMinutes())}`;
}

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

export default function Pedidos({
  clienteId,
  aoMostrarPix,
}: {
  clienteId: number;
  aoMostrarPix?: (pedido: Pedido) => void;
}) {
  const pedidos = usePedidos(clienteId);

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

  return (
    <ScrollView
      contentContainerStyle={styles.lista}
      refreshControl={<RefreshControl refreshing={pedidos.isRefetching} onRefresh={() => pedidos.refetch()} />}
    >
      {lista.map((pedido) => (
        <View key={pedido.id} style={styles.card}>
          <View style={styles.linha}>
            <Text style={styles.nome}>Pedido #{pedido.id}</Text>
            <Text style={styles.status}>{formatarStatus(pedido.status)}</Text>
          </View>

          <Text style={styles.detalhe}>
            {formatarData(pedido.criado_em)} • {NOMES_PAGAMENTO[pedido.forma_pagamento] ?? pedido.forma_pagamento}
          </Text>

          {pedido.forma_pagamento === "dinheiro" && pedido.valor_pago != null ? (
            <Text style={styles.detalhe}>
              {pedido.troco && pedido.troco > 0
                ? `Pago com ${formatarPreco(pedido.valor_pago)} • Troco: ${formatarPreco(pedido.troco)}`
                : "Sem troco (valor exato)"}
            </Text>
          ) : null}

          {pedido.cupom_codigo && pedido.desconto ? (
            <Text style={styles.detalhe}>
              Cupom {pedido.cupom_codigo}: − {formatarPreco(pedido.desconto)}
            </Text>
          ) : null}

          {pedido.itens.map((item, indice) => (
            <View key={indice}>
              <View style={styles.linha}>
                <Text style={styles.item}>
                  {item.quantidade}× {item.nome}
                </Text>
                <Text>{formatarPreco(item.subtotal)}</Text>
              </View>
              {item.observacao ? <Text style={styles.obs}>Obs.: {item.observacao}</Text> : null}
            </View>
          ))}

          <View style={[styles.linha, styles.totalLinha]}>
            <Text style={styles.preco}>Total</Text>
            <Text style={styles.preco}>{formatarPreco(pedido.total)}</Text>
          </View>

          {pedido.forma_pagamento === "pix" && pedido.pix_copia_cola && pedido.status === "recebido" && aoMostrarPix ? (
            <Pressable onPress={() => aoMostrarPix(pedido)}>
              <Text style={styles.linkPix}>📲 Ver QR Code do Pix</Text>
            </Pressable>
          ) : null}

          <AvaliacaoPedido pedido={pedido} clienteId={clienteId} />
        </View>
      ))}
    </ScrollView>
  );
}

const COR = "#d84315";

const styles = StyleSheet.create({
  lista: { padding: 16, paddingTop: 0, gap: 12 },
  centro: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 8 },
  titulo: { fontSize: 22, fontWeight: "bold" },
  erro: { color: "#b00020", textAlign: "center" },
  vazio: { textAlign: "center", fontSize: 16 },
  card: { padding: 12, borderRadius: 12, borderWidth: 1, borderColor: "#ddd", gap: 6 },
  linha: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  nome: { fontSize: 18, fontWeight: "600" },
  status: { color: COR, fontWeight: "bold" },
  detalhe: { color: "#666" },
  item: { flexShrink: 1 },
  linkPix: { color: "#d84315", fontWeight: "bold", marginTop: 6 },
  obs: { color: "#888", fontStyle: "italic", fontSize: 13 },
  totalLinha: { marginTop: 4, paddingTop: 6, borderTopWidth: 1, borderTopColor: "#eee" },
  preco: { fontWeight: "bold" },
  botao: { backgroundColor: COR, padding: 14, borderRadius: 10, alignItems: "center", marginTop: 8 },
  textoBotao: { color: "#fff", fontWeight: "bold" },
});
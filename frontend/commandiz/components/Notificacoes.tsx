// Arquivo: frontend/commandiz/components/Notificacoes.tsx
// Central de notificações (atualiza sozinha a cada 15 segundos).

import { useEffect } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";

import { useMarcarNotificacoesLidas, useNotificacoes } from "../hooks/useCommandiz";

function formatarData(iso: string): string {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return "";
  const dois = (n: number) => String(n).padStart(2, "0");
  return `${dois(data.getDate())}/${dois(data.getMonth() + 1)} às ${dois(data.getHours())}:${dois(data.getMinutes())}`;
}

export default function Notificacoes({ clienteId }: { clienteId: number }) {
  const notificacoes = useNotificacoes(clienteId);
  const marcarLidas = useMarcarNotificacoesLidas(clienteId);
  const naoLidas = notificacoes.data?.nao_lidas ?? 0;

  // Depois de 2 segundos com a tela aberta, marca tudo como lido.
  useEffect(() => {
    if (naoLidas === 0) return;
    const espera = setTimeout(() => marcarLidas.mutate(), 2000);
    return () => clearTimeout(espera);
  }, [naoLidas]);

  if (notificacoes.isPending) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" />
        <Text>Carregando notificações...</Text>
      </View>
    );
  }

  if (notificacoes.error) {
    return (
      <View style={styles.centro}>
        <Text style={styles.titulo}>Ops, deu erro 😕</Text>
        <Text style={styles.erro}>{notificacoes.error.message}</Text>
        <Pressable style={styles.botao} onPress={() => notificacoes.refetch()}>
          <Text style={styles.textoBotao}>Tentar de novo</Text>
        </Pressable>
      </View>
    );
  }

  const itens = notificacoes.data?.itens ?? [];

  if (itens.length === 0) {
    return (
      <View style={styles.centro}>
        <Text style={styles.vazio}>Nenhuma notificação por enquanto 🔔</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.lista}
      refreshControl={<RefreshControl refreshing={notificacoes.isRefetching} onRefresh={() => notificacoes.refetch()} />}
    >
      {itens.map((n) => (
        <View key={n.id} style={[styles.card, !n.lida && styles.cardNovo]}>
          <View style={styles.linha}>
            <Text style={styles.nome}>{n.titulo}</Text>
            {!n.lida ? <Text style={styles.novo}>NOVO</Text> : null}
          </View>
          <Text>{n.mensagem}</Text>
          <Text style={styles.data}>{formatarData(n.criado_em)}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const COR = "#d84315";

const styles = StyleSheet.create({
  lista: { padding: 16, paddingTop: 12, gap: 10 },
  centro: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 8 },
  titulo: { fontSize: 22, fontWeight: "bold" },
  erro: { color: "#b00020", textAlign: "center" },
  vazio: { textAlign: "center", fontSize: 16 },
  card: { padding: 12, borderRadius: 12, borderWidth: 1, borderColor: "#ddd", gap: 4 },
  cardNovo: { borderColor: COR, backgroundColor: "#d8431512" },
  linha: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  nome: { fontSize: 17, fontWeight: "600", flexShrink: 1 },
  novo: { color: COR, fontWeight: "bold", fontSize: 12 },
  data: { color: "#888", fontSize: 12 },
  botao: { backgroundColor: COR, padding: 14, borderRadius: 10, alignItems: "center", marginTop: 8 },
  textoBotao: { color: "#fff", fontWeight: "bold" },
});

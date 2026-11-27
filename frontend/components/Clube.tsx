// Arquivo: frontend/components/Clube.tsx
// Commandiz Club: nível, pontos, recompensas para resgatar e extrato.

import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useClube, useResgatar } from "../hooks/useCommandiz";

const EMOJI_NIVEL: Record<string, string> = { Bronze: "🥉", Prata: "🥈", Ouro: "🥇", Diamante: "💎" };

function formatarData(iso: string): string {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return "";
  const dois = (n: number) => String(n).padStart(2, "0");
  return `${dois(data.getDate())}/${dois(data.getMonth() + 1)}`;
}

export default function Clube({ clienteId, aoVoltar }: { clienteId: number; aoVoltar: () => void }) {
  const clube = useClube(clienteId);
  const resgatar = useResgatar(clienteId);

  if (clube.isPending) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" />
        <Text>Carregando seu clube...</Text>
      </View>
    );
  }

  if (clube.error || !clube.data) {
    return (
      <View style={styles.centro}>
        <Text style={styles.titulo}>Ops, deu erro 😕</Text>
        <Text style={styles.erro}>{clube.error?.message ?? "Não foi possível carregar."}</Text>
        <Pressable style={styles.botao} onPress={() => clube.refetch()}>
          <Text style={styles.textoBotao}>Tentar de novo</Text>
        </Pressable>
        <Pressable onPress={aoVoltar}>
          <Text style={styles.voltar}>← Voltar</Text>
        </Pressable>
      </View>
    );
  }

  const dados = clube.data;

  function confirmarResgate(id: string, titulo: string, custo: number) {
    Alert.alert("Resgatar recompensa", `Trocar ${custo} pontos por: ${titulo}?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Resgatar",
        onPress: async () => {
          try {
            const r = await resgatar.mutateAsync(id);
            Alert.alert("Resgatado! 🎉", `Seu cupom: ${r.codigo}\n\nEle já aparece no carrinho, na área de cupons.`);
          } catch {
            // O aviso de erro já aparece sozinho (veja useResgatar).
          }
        },
      },
    ]);
  }

  return (
    <ScrollView contentContainerStyle={styles.lista}>
      <Pressable onPress={aoVoltar} hitSlop={10}>
        <Text style={styles.voltar}>← Voltar ao cardápio</Text>
      </Pressable>

      <View style={styles.cartao}>
        <Text style={styles.nivel}>
          {EMOJI_NIVEL[dados.nivel] ?? "👑"} {dados.nivel}
        </Text>
        <Text style={styles.pontos}>{dados.pontos} pontos</Text>

        <View style={styles.barraFundo}>
          <View style={[styles.barra, { width: `${Math.round(dados.progresso * 100)}%` }]} />
        </View>
        <Text style={styles.legenda}>
          {dados.proximo_nivel
            ? `Faltam ${dados.faltam} pontos para o nível ${dados.proximo_nivel}`
            : "Você chegou ao nível máximo! 🎉"}
        </Text>
      </View>

      <Text style={styles.titulo}>Recompensas</Text>
      {dados.recompensas.map((r) => {
        const podeResgatar = dados.pontos >= r.custo;
        return (
          <View key={r.id} style={styles.card}>
            <View style={styles.linha}>
              <View style={{ flexShrink: 1 }}>
                <Text style={styles.nome}>{r.titulo}</Text>
                <Text style={styles.legenda}>{r.custo} pontos</Text>
              </View>
              <Pressable
                style={[styles.botaoPequeno, !podeResgatar && styles.botaoDesativado]}
                disabled={!podeResgatar || resgatar.isPending}
                onPress={() => confirmarResgate(r.id, r.titulo, r.custo)}
              >
                <Text style={styles.textoBotao}>Resgatar</Text>
              </Pressable>
            </View>
          </View>
        );
      })}

      <Text style={styles.titulo}>Extrato</Text>
      {dados.historico.length === 0 ? (
        <Text style={styles.legenda}>Você ainda não tem pontos. A cada R$ 1,00 em pedidos entregues você ganha 1 ponto.</Text>
      ) : (
        <View style={styles.card}>
          {dados.historico.map((m, i) => (
            <View key={i} style={styles.linha}>
              <Text style={{ flexShrink: 1 }}>
                {formatarData(m.criado_em)} • {m.motivo}
              </Text>
              <Text style={m.pontos >= 0 ? styles.ganho : styles.gasto}>
                {m.pontos > 0 ? "+" : ""}
                {m.pontos}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const COR = "#d84315";

const styles = StyleSheet.create({
  lista: { padding: 16, paddingTop: 12, gap: 10, paddingBottom: 40 },
  centro: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 8 },
  voltar: { color: COR, fontWeight: "600", fontSize: 16 },
  titulo: { fontSize: 22, fontWeight: "bold", marginTop: 8 },
  erro: { color: "#b00020", textAlign: "center" },
  cartao: { backgroundColor: "#d8431518", borderRadius: 16, padding: 16, gap: 8 },
  nivel: { fontSize: 26, fontWeight: "bold" },
  pontos: { fontSize: 20, fontWeight: "600", color: COR },
  barraFundo: { height: 10, borderRadius: 5, backgroundColor: "#8884", overflow: "hidden" },
  barra: { height: 10, backgroundColor: COR },
  legenda: { color: "#888" },
  card: { padding: 12, borderRadius: 12, borderWidth: 1, borderColor: "#ddd", gap: 6 },
  linha: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  nome: { fontSize: 17, fontWeight: "600" },
  ganho: { color: "#2e7d32", fontWeight: "bold" },
  gasto: { color: "#b00020", fontWeight: "bold" },
  botao: { backgroundColor: COR, padding: 14, borderRadius: 10, alignItems: "center", marginTop: 8 },
  botaoPequeno: { backgroundColor: COR, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  botaoDesativado: { opacity: 0.4 },
  textoBotao: { color: "#fff", fontWeight: "bold" },
});

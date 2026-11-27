// Arquivo: frontend/components/AvaliacaoPedido.tsx
// No card de cada pedido: mostra a avaliação feita, ou o botão para avaliar (estrelas + comentário).

import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { useAvaliarPedido } from "../hooks/useCommandiz";
import type { Pedido } from "../services/api";

type Props = {
  pedido: Pedido;
  clienteId: number;
};

export default function AvaliacaoPedido({ pedido, clienteId }: Props) {
  const [aberto, setAberto] = useState(false);
  const [nota, setNota] = useState(0);
  const [comentario, setComentario] = useState("");
  const avaliar = useAvaliarPedido(clienteId);

  if (pedido.avaliacao) {
    return (
      <View style={styles.caixa}>
        <Text style={styles.titulo}>Sua avaliação: {"⭐".repeat(pedido.avaliacao.nota)}</Text>
        {pedido.avaliacao.comentario ? <Text style={styles.comentario}>“{pedido.avaliacao.comentario}”</Text> : null}
      </View>
    );
  }

  if (pedido.status === "cancelado") return null;

  if (!aberto) {
    return (
      <Pressable onPress={() => setAberto(true)}>
        <Text style={styles.link}>⭐ Avaliar este pedido</Text>
      </Pressable>
    );
  }

  async function enviar() {
    if (nota < 1) {
      Alert.alert("Avaliação", "Toque nas estrelas para escolher uma nota.");
      return;
    }
    try {
      await avaliar.mutateAsync({ pedidoId: pedido.id, nota, comentario: comentario.trim() || undefined });
      Alert.alert("Obrigado! 💛", "Sua avaliação foi enviada.");
    } catch {
      // O aviso de erro já aparece sozinho (veja useAvaliarPedido).
    }
  }

  return (
    <View style={styles.caixa}>
      <Text style={styles.titulo}>Como foi o seu pedido?</Text>

      <View style={styles.estrelas}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable key={n} onPress={() => setNota(n)} hitSlop={6}>
            <Text style={styles.estrela}>{n <= nota ? "⭐" : "☆"}</Text>
          </Pressable>
        ))}
      </View>

      <TextInput
        style={styles.campo}
        value={comentario}
        onChangeText={setComentario}
        placeholder="Conte como foi (opcional)"
        multiline
        maxLength={500}
        textAlignVertical="top"
      />

      <Pressable
        style={[styles.botao, avaliar.isPending && styles.botaoDesativado]}
        onPress={enviar}
        disabled={avaliar.isPending}
      >
        {avaliar.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.textoBotao}>Enviar avaliação</Text>}
      </Pressable>

      <Pressable onPress={() => setAberto(false)} disabled={avaliar.isPending}>
        <Text style={styles.link}>Cancelar</Text>
      </Pressable>
    </View>
  );
}

const COR = "#d84315";

const styles = StyleSheet.create({
  caixa: { gap: 8, paddingTop: 8 },
  titulo: { fontWeight: "bold" },
  comentario: { fontStyle: "italic", color: "#888" },
  estrelas: { flexDirection: "row", gap: 10 },
  estrela: { fontSize: 30 },
  campo: { borderWidth: 1, borderColor: "#ccc", borderRadius: 10, padding: 10, minHeight: 70, fontSize: 15 },
  botao: { backgroundColor: COR, padding: 12, borderRadius: 10, alignItems: "center" },
  botaoDesativado: { opacity: 0.6 },
  textoBotao: { color: "#fff", fontWeight: "bold" },
  link: { color: COR, fontWeight: "600", textAlign: "center" },
});

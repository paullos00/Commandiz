// Arquivo: frontend/components/DetalheProduto.tsx
// Tela de detalhes de um espeto ou combo: foto, descrição, quantidade e observação
// ("sem cebola", "bem passado"...). Daqui o cliente adiciona ao carrinho.

import { useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { useAdicionarAoCarrinho, useAlternarFavorito, useFavoritos } from "../hooks/useCommandiz";
import { formatarPreco } from "../services/api";

export type ProdutoDetalhe = {
  tipo: "espeto" | "combo";
  id: number;
  nome: string;
  descricao: string | null;
  preco: number;
  precoOriginal?: number | null;
  imagem?: string | null;
};

type Props = {
  produto: ProdutoDetalhe;
  clienteId: number;
  aoVoltar: () => void;
};

const MAXIMO_POR_ITEM = 20;
const MAXIMO_OBSERVACAO = 140;

export default function DetalheProduto({ produto, clienteId, aoVoltar }: Props) {
  const [quantidade, setQuantidade] = useState(1);
  const [observacao, setObservacao] = useState("");

  const favoritos = useFavoritos(clienteId);
  const alternarFavorito = useAlternarFavorito(clienteId);
  const adicionar = useAdicionarAoCarrinho(clienteId);

  const ehEspeto = produto.tipo === "espeto";
  const favorito = ehEspeto && (favoritos.data ?? []).some((f) => f.id === produto.id);
  const total = Math.round(produto.preco * quantidade * 100) / 100;

  async function adicionarAoCarrinho() {
    try {
      await adicionar.mutateAsync({
        ...(ehEspeto ? { espeto_id: produto.id } : { combo_id: produto.id }),
        quantidade,
        observacao: observacao.trim() || undefined,
      });
      Alert.alert("Adicionado! 🛒", `${quantidade}× ${produto.nome} no carrinho.`);
      aoVoltar();
    } catch {
      // O aviso de erro já aparece sozinho (veja useAdicionarAoCarrinho).
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.lista} keyboardShouldPersistTaps="handled">
      <Pressable onPress={aoVoltar} hitSlop={10}>
        <Text style={styles.voltar}>← Voltar ao cardápio</Text>
      </Pressable>

      {produto.imagem ? (
        <Image source={{ uri: produto.imagem }} style={styles.imagem} resizeMode="cover" />
      ) : (
        <View style={[styles.imagem, styles.semImagem]}>
          <Text style={styles.emoji}>{ehEspeto ? "🍢" : "🎁"}</Text>
        </View>
      )}

      <View style={styles.linha}>
        <Text style={styles.nome}>{produto.nome}</Text>
        {ehEspeto ? (
          <Pressable
            hitSlop={10}
            onPress={() => alternarFavorito.mutate({ espetoId: produto.id, favorito })}
            disabled={alternarFavorito.isPending}
          >
            <Text style={styles.coracao}>{favorito ? "❤️" : "🤍"}</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.linha}>
        <Text style={styles.preco}>{formatarPreco(produto.preco)}</Text>
        {produto.precoOriginal ? (
          <Text style={styles.precoAntigo}>{formatarPreco(produto.precoOriginal)}</Text>
        ) : null}
      </View>

      {produto.descricao ? <Text style={styles.descricao}>{produto.descricao}</Text> : null}

      <Text style={styles.rotulo}>Quantidade</Text>
      <View style={styles.quantidade}>
        <Pressable
          style={styles.botaoQuantidade}
          disabled={quantidade <= 1}
          onPress={() => setQuantidade((q) => q - 1)}
        >
          <Text style={styles.textoQuantidade}>−</Text>
        </Pressable>
        <Text style={styles.numeroQuantidade}>{quantidade}</Text>
        <Pressable
          style={styles.botaoQuantidade}
          disabled={quantidade >= MAXIMO_POR_ITEM}
          onPress={() => setQuantidade((q) => q + 1)}
        >
          <Text style={styles.textoQuantidade}>+</Text>
        </Pressable>
      </View>

      <Text style={styles.rotulo}>Observação (opcional)</Text>
      <TextInput
        style={[styles.campo, styles.campoLongo]}
        value={observacao}
        onChangeText={setObservacao}
        placeholder="Ex.: sem cebola, bem passado..."
        multiline
        maxLength={MAXIMO_OBSERVACAO}
        textAlignVertical="top"
      />
      <Text style={styles.contador}>
        {observacao.length}/{MAXIMO_OBSERVACAO}
      </Text>

      <Pressable
        style={[styles.botao, adicionar.isPending && styles.botaoDesativado]}
        onPress={adicionarAoCarrinho}
        disabled={adicionar.isPending}
      >
        {adicionar.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.textoBotao}>Adicionar ao carrinho • {formatarPreco(total)}</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const COR = "#d84315";

const styles = StyleSheet.create({
  lista: { padding: 16, paddingTop: 12, gap: 10, paddingBottom: 40 },
  voltar: { color: COR, fontWeight: "600", fontSize: 16 },
  imagem: { width: "100%", height: 200, borderRadius: 16 },
  semImagem: { backgroundColor: "#d8431518", alignItems: "center", justifyContent: "center" },
  emoji: { fontSize: 72 },
  linha: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  nome: { fontSize: 24, fontWeight: "bold", flexShrink: 1 },
  coracao: { fontSize: 28 },
  preco: { fontSize: 20, fontWeight: "bold", color: COR },
  precoAntigo: { textDecorationLine: "line-through", color: "#888" },
  descricao: { fontSize: 16, lineHeight: 22 },
  rotulo: { fontWeight: "600", marginTop: 8 },
  quantidade: { flexDirection: "row", alignItems: "center", gap: 16 },
  botaoQuantidade: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COR,
    alignItems: "center",
    justifyContent: "center",
  },
  textoQuantidade: { color: COR, fontSize: 24, fontWeight: "bold" },
  numeroQuantidade: { fontSize: 22, fontWeight: "600", minWidth: 32, textAlign: "center" },
  campo: { borderWidth: 1, borderColor: "#ccc", borderRadius: 10, padding: 12, fontSize: 16 },
  campoLongo: { minHeight: 80 },
  contador: { alignSelf: "flex-end", color: "#888", fontSize: 12 },
  botao: { backgroundColor: COR, padding: 16, borderRadius: 12, alignItems: "center", marginTop: 8 },
  botaoDesativado: { opacity: 0.6 },
  textoBotao: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});

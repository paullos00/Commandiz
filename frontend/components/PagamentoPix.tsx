// Arquivo: frontend/components/PagamentoPix.tsx
// Tela "Pague com Pix": QR Code + botão para copiar o código "Pix Copia e Cola".

import * as Clipboard from "expo-clipboard";
import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

import { formatarPreco, type Pedido } from "../services/api";

type Props = {
  pedido: Pedido;
  aoConcluir: () => void;
};

export default function PagamentoPix({ pedido, aoConcluir }: Props) {
  const [copiado, setCopiado] = useState(false);
  const codigo = pedido.pix_copia_cola ?? "";

  async function copiar() {
    try {
      await Clipboard.setStringAsync(codigo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 3000);
    } catch {
      Alert.alert("Ops", "Não foi possível copiar. Selecione e copie o código manualmente.");
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.lista}>
      <Text style={styles.titulo}>Pague com Pix 💸</Text>
      <Text style={styles.subtitulo}>
        Pedido #{pedido.id} • {formatarPreco(pedido.total)}
      </Text>

      {codigo ? (
        <View style={styles.qrCaixa}>
          <QRCode value={codigo} size={240} backgroundColor="#ffffff" color="#000000" />
        </View>
      ) : (
        <View style={styles.erroCaixa}>
          <Text style={styles.erroTitulo}>QR Code indisponível</Text>
          <Text style={styles.aviso}>Não recebemos o código Pix deste pedido. Consulte seus pedidos ou fale com a espetaria.</Text>
        </View>
      )}

      {codigo ? (
        <Text style={styles.passos}>
          Abra o app do seu banco, escolha Pix e leia o QR Code. Você também pode usar o código Pix Copia e Cola.
        </Text>
      ) : null}

      {codigo ? (
        <Pressable style={styles.botao} onPress={copiar}>
          <Text style={styles.textoBotao}>{copiado ? "✓ Código copiado!" : "Copiar código Pix"}</Text>
        </Pressable>
      ) : null}

      <Text style={styles.aviso}>
        Assim que o pagamento for conferido pela espetaria, o seu pedido segue para o preparo. Você pode rever este
        QR Code na aba Pedidos.
      </Text>

      <Pressable style={styles.botaoVazado} onPress={aoConcluir}>
        <Text style={styles.textoVazado}>Já paguei / ver meus pedidos</Text>
      </Pressable>
    </ScrollView>
  );
}

const COR = "#e63b08";
const MARROM = "#642600";

const styles = StyleSheet.create({
  lista: { padding: 16, paddingTop: 12, gap: 12, alignItems: "center", paddingBottom: 40 },
  titulo: { fontSize: 23, fontWeight: "bold", color: MARROM, alignSelf: "stretch" },
  subtitulo: { fontSize: 15, color: MARROM, alignSelf: "stretch" },
  qrCaixa: { backgroundColor: "#fff", padding: 18, borderRadius: 16, borderWidth: 1, borderColor: "#efd9c5" },
  erroCaixa: { width: "100%", gap: 6, padding: 14, borderRadius: 14, backgroundColor: "#fff", borderWidth: 1, borderColor: "#efd9c5" },
  erroTitulo: { fontWeight: "bold", color: MARROM },
  passos: { fontSize: 14, lineHeight: 21, alignSelf: "stretch", color: "#6d625a" },
  negrito: { fontWeight: "bold" },
  botao: { backgroundColor: COR, padding: 14, borderRadius: 999, alignItems: "center", alignSelf: "stretch" },
  textoBotao: { color: "#fff", fontWeight: "bold", fontSize: 15 },
  aviso: { color: "#776d65", fontSize: 13, alignSelf: "stretch", lineHeight: 19 },
  botaoVazado: { borderWidth: 1, borderColor: "#efd9c5", padding: 14, borderRadius: 999, alignItems: "center", alignSelf: "stretch", backgroundColor: "#fff" },
  textoVazado: { color: MARROM, fontWeight: "bold" },
});

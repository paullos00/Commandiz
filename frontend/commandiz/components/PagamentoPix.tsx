// Arquivo: frontend/commandiz/components/PagamentoPix.tsx
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

      <View style={styles.qrCaixa}>
        <QRCode value={codigo} size={240} backgroundColor="#ffffff" color="#000000" />
      </View>

      <Text style={styles.passos}>
        1. Abra o app do seu banco{"\n"}2. Escolha <Text style={styles.negrito}>Pix → Ler QR Code</Text> e aponte para o código acima{"\n"}
        ou use <Text style={styles.negrito}>Pix Copia e Cola</Text> com o botão abaixo
      </Text>

      <Pressable style={styles.botao} onPress={copiar}>
        <Text style={styles.textoBotao}>{copiado ? "✓ Código copiado!" : "Copiar código Pix"}</Text>
      </Pressable>

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

const COR = "#d84315";

const styles = StyleSheet.create({
  lista: { padding: 16, paddingTop: 12, gap: 12, alignItems: "center", paddingBottom: 40 },
  titulo: { fontSize: 24, fontWeight: "bold" },
  subtitulo: { fontSize: 16, color: "#888" },
  qrCaixa: { backgroundColor: "#fff", padding: 16, borderRadius: 16 },
  passos: { fontSize: 15, lineHeight: 22, alignSelf: "stretch" },
  negrito: { fontWeight: "bold" },
  botao: { backgroundColor: COR, padding: 14, borderRadius: 10, alignItems: "center", alignSelf: "stretch" },
  textoBotao: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  aviso: { color: "#888", fontSize: 13, alignSelf: "stretch" },
  botaoVazado: { borderWidth: 1, borderColor: COR, padding: 14, borderRadius: 10, alignItems: "center", alignSelf: "stretch" },
  textoVazado: { color: COR, fontWeight: "bold" },
});

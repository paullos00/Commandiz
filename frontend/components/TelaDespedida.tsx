import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {
  nome: string;
  aoEntrarNovamente: () => void;
};

export default function TelaDespedida({ nome, aoEntrarNovamente }: Props) {
  const primeiroNome = nome.trim().split(/\s+/)[0] || "cliente";

  return (
    <SafeAreaView style={styles.tela} edges={["top", "bottom"]}>
      <View style={styles.topo}>
        <Image
          source={require("../assets/images/logo-espeto-brutus.png")}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="Espeto Brutus"
        />
      </View>

      <View style={styles.conteudo}>
        <Text style={styles.titulo}>Até logo, {primeiroNome}!</Text>

        <View style={styles.cartao}>
          <Text style={styles.mensagem}>
            Você saiu da sua conta. Volte quando quiser aproveitar a nossa companhia.
          </Text>

          <Pressable
            style={({ pressed }) => [styles.botao, pressed && styles.botaoPressionado]}
            onPress={aoEntrarNovamente}
            accessibilityRole="button"
          >
            <Text style={styles.textoBotao}>Entrar novamente</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const MARROM = "#642600";

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: "#fffaf5" },
  topo: {
    height: 74,
    backgroundColor: MARROM,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: { width: 54, height: 54 },
  conteudo: { flex: 1, paddingHorizontal: 24, paddingTop: 28 },
  titulo: { color: MARROM, fontSize: 23, fontWeight: "800", marginBottom: 18 },
  cartao: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#f0ddd0",
    borderRadius: 18,
    padding: 18,
  },
  mensagem: { color: "#777067", fontSize: 15, lineHeight: 22, marginBottom: 18 },
  botao: {
    height: 48,
    borderRadius: 24,
    backgroundColor: "#d84315",
    alignItems: "center",
    justifyContent: "center",
  },
  botaoPressionado: { opacity: 0.85 },
  textoBotao: { color: "#fff", fontSize: 15, fontWeight: "800" },
});

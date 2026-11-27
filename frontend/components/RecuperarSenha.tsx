// Arquivo: frontend/components/RecuperarSenha.tsx
// "Esqueci minha senha": 1) pede o e-mail e recebe um código  2) digita o código e a nova senha.

import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from "react-native";

import { api } from "../services/api";

type Props = {
  emailInicial?: string;
  aoVoltar: () => void;
};

export default function RecuperarSenha({ emailInicial = "", aoVoltar }: Props) {
  const [etapa, setEtapa] = useState<"pedir" | "codigo">("pedir");
  const [email, setEmail] = useState(emailInicial);
  const [codigo, setCodigo] = useState("");
  const [senhaNova, setSenhaNova] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  async function pedirCodigo() {
    setErro(null);
    setAviso(null);
    if (!email.includes("@") || !email.includes(".")) return setErro("Digite um e-mail válido.");

    setEnviando(true);
    try {
      const resposta = await api.recuperarSenha(email.trim());
      setAviso(resposta.mensagem);
      setEtapa("codigo");
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  async function redefinir() {
    setErro(null);
    if (!/^\d{6}$/.test(codigo.trim())) return setErro("O código tem 6 números.");
    if (senhaNova.length < 6) return setErro("A nova senha precisa ter pelo menos 6 caracteres.");

    setEnviando(true);
    try {
      await api.redefinirSenha({ email: email.trim(), codigo: codigo.trim(), senha_nova: senhaNova });
      Alert.alert("Pronto!", "Sua senha foi alterada. Entre com a nova senha.");
      aoVoltar();
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.tela} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.titulo}>Recuperar senha 🔑</Text>

        {etapa === "pedir" ? (
          <>
            <Text style={styles.subtitulo}>Digite o e-mail da sua conta e enviaremos um código de 6 números.</Text>

            <Text style={styles.rotulo}>E-mail</Text>
            <TextInput
              style={styles.campo}
              value={email}
              onChangeText={setEmail}
              placeholder="voce@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </>
        ) : (
          <>
            {aviso ? <Text style={styles.aviso}>{aviso}</Text> : null}

            <Text style={styles.rotulo}>Código de 6 números</Text>
            <TextInput
              style={styles.campo}
              value={codigo}
              onChangeText={(t) => setCodigo(t.replace(/\D/g, ""))}
              placeholder="123456"
              keyboardType="number-pad"
              maxLength={6}
            />

            <Text style={styles.rotulo}>Nova senha</Text>
            <TextInput
              style={styles.campo}
              value={senhaNova}
              onChangeText={setSenhaNova}
              placeholder="Mínimo de 6 caracteres"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </>
        )}

        {erro ? <Text style={styles.erro}>{erro}</Text> : null}

        <Pressable
          style={[styles.botao, enviando && styles.botaoDesativado]}
          onPress={etapa === "pedir" ? pedirCodigo : redefinir}
          disabled={enviando}
        >
          {enviando ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.textoBotao}>{etapa === "pedir" ? "Enviar código" : "Redefinir senha"}</Text>
          )}
        </Pressable>

        {etapa === "codigo" ? (
          <Pressable onPress={pedirCodigo} disabled={enviando}>
            <Text style={styles.link}>Não recebi. Enviar um novo código</Text>
          </Pressable>
        ) : null}

        <Pressable onPress={aoVoltar} disabled={enviando}>
          <Text style={styles.link}>← Voltar ao login</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const COR = "#d84315";

const styles = StyleSheet.create({
  tela: { flex: 1 },
  container: { padding: 24, paddingTop: 72, gap: 8 },
  titulo: { fontSize: 28, fontWeight: "bold" },
  subtitulo: { fontSize: 16, marginBottom: 16 },
  aviso: { fontSize: 15, marginBottom: 8, color: "#2e7d32" },
  rotulo: { fontWeight: "600", marginTop: 8 },
  campo: { borderWidth: 1, borderColor: "#ccc", borderRadius: 10, padding: 12, fontSize: 16 },
  erro: { color: "#b00020", marginTop: 8 },
  botao: { backgroundColor: COR, padding: 14, borderRadius: 10, alignItems: "center", marginTop: 16 },
  botaoDesativado: { opacity: 0.6 },
  textoBotao: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  link: { color: COR, fontWeight: "600", textAlign: "center", marginTop: 16 },
});

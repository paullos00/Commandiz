// Tela de ENTRAR (e-mail e senha) e de CRIAR CONTA (nome, e-mail, telefone e senha).

import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from "react-native";

import { api, type Cliente } from "../services/api";
import { salvarToken } from "../services/sessao";
import RecuperarSenha from "./RecuperarSenha";

type Props = {
  onAutenticado: (cliente: Cliente) => void;
};

export default function AutenticacaoForm({ onAutenticado }: Props) {
  const [criandoConta, setCriandoConta] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [recuperando, setRecuperando] = useState(false);

  function alternarModo() {
    setCriandoConta((atual) => !atual);
    setErro(null);
  }

  async function enviar() {
    setErro(null);

    if (!email.includes("@") || !email.includes(".")) return setErro("Digite um e-mail válido.");
    if (senha.length < 6) return setErro("A senha precisa ter pelo menos 6 caracteres.");
    if (criandoConta) {
      if (!nome.trim()) return setErro("Digite seu nome.");
      if (telefone.replace(/\D/g, "").length < 10) return setErro("Digite o telefone com DDD.");
    }

    setEnviando(true);
    try {
      const resposta = criandoConta
        ? await api.registrar({
            nome: nome.trim(),
            email: email.trim(),
            telefone: telefone.trim(),
            senha,
          })
        : await api.login(email.trim(), senha);

      await salvarToken(resposta.access_token);
      onAutenticado(resposta.cliente);
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  if (recuperando) {
    return <RecuperarSenha emailInicial={email} aoVoltar={() => setRecuperando(false)} />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.tela}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Image
          source={require("../assets/images/logo-espeto-brutus.png")}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="Logo da Espeto Brutus"
        />
        <Text style={styles.titulo}>{criandoConta ? "Criar conta" : "Bem-vindo de volta!"}</Text>
        <Text style={styles.subtitulo}>
          {criandoConta ? "Preencha seus dados para fazer pedidos." : "Entre para fazer seus pedidos."}
        </Text>

        {criandoConta ? (
          <>
            <Text style={styles.rotulo}>Nome</Text>
            <TextInput
              style={styles.campo}
              value={nome}
              onChangeText={setNome}
              placeholder="Seu nome"
              autoCapitalize="words"
            />
          </>
        ) : null}

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

        {criandoConta ? (
          <>
            <Text style={styles.rotulo}>Telefone</Text>
            <TextInput
              style={styles.campo}
              value={telefone}
              onChangeText={setTelefone}
              placeholder="(11) 91234-5678"
              keyboardType="phone-pad"
            />
          </>
        ) : null}

        <Text style={styles.rotulo}>Senha</Text>
        <TextInput
          style={styles.campo}
          value={senha}
          onChangeText={setSenha}
          placeholder="Mínimo de 6 caracteres"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />

        {erro ? <Text style={styles.erro}>{erro}</Text> : null}

        <Pressable
          style={[styles.botao, enviando && styles.botaoDesativado]}
          onPress={enviar}
          disabled={enviando}
        >
          {enviando ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.textoBotao}>{criandoConta ? "Criar conta" : "Entrar"}</Text>
          )}
        </Pressable>

        <Pressable onPress={alternarModo} disabled={enviando}>
          <Text style={styles.link}>
            {criandoConta ? "Já tenho conta. Entrar" : "Não tenho conta. Criar agora"}
          </Text>
        </Pressable>

        {!criandoConta ? (
          <Pressable onPress={() => setRecuperando(true)} disabled={enviando}>
            <Text style={styles.link}>Esqueci minha senha</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: "#fffaf5" },
  container: { padding: 24, paddingTop: 40, gap: 8 },
  logo: { alignSelf: "center", width: 140, height: 118, marginBottom: 8 },
  titulo: { fontSize: 28, fontWeight: "bold" },
  subtitulo: { fontSize: 16, marginBottom: 16 },
  rotulo: { fontWeight: "600", marginTop: 8 },
  campo: { borderWidth: 1, borderColor: "#ccc", borderRadius: 10, padding: 12, fontSize: 16 },
  erro: { color: "#b00020", marginTop: 8 },
  botao: {
    backgroundColor: "#d84315",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 16,
  },
  botaoDesativado: { opacity: 0.6 },
  textoBotao: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  link: { color: "#d84315", fontWeight: "600", textAlign: "center", marginTop: 16 },
});
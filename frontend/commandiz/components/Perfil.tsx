// Aba "Meu perfil": editar nome e telefone, trocar a senha. (O e-mail é o login e não muda.)

import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { api, type Cliente } from "../services/api";

type Props = {
  cliente: Cliente;
  onAtualizado: (cliente: Cliente) => void;
};

export default function Perfil({ cliente, onAtualizado }: Props) {
  const [nome, setNome] = useState(cliente.nome);
  const [telefone, setTelefone] = useState(cliente.telefone);
  const [salvando, setSalvando] = useState(false);
  const [erroPerfil, setErroPerfil] = useState<string | null>(null);

  const [senhaAtual, setSenhaAtual] = useState("");
  const [senhaNova, setSenhaNova] = useState("");
  const [trocando, setTrocando] = useState(false);
  const [erroSenha, setErroSenha] = useState<string | null>(null);

  const [emailNovo, setEmailNovo] = useState("");
  const [senhaEmail, setSenhaEmail] = useState("");
  const [trocandoEmail, setTrocandoEmail] = useState(false);
  const [erroEmail, setErroEmail] = useState<string | null>(null);

  async function salvarPerfil() {
    setErroPerfil(null);
    if (!nome.trim()) return setErroPerfil("Digite seu nome.");
    if (telefone.replace(/\D/g, "").length < 10) return setErroPerfil("Digite o telefone com DDD.");

    setSalvando(true);
    try {
      const atualizado = await api.atualizarPerfil({ nome: nome.trim(), telefone: telefone.trim() });
      onAtualizado(atualizado);
      Alert.alert("Pronto!", "Seu perfil foi atualizado.");
    } catch (e) {
      setErroPerfil((e as Error).message);
    } finally {
      setSalvando(false);
    }
  }

  async function trocarSenha() {
    setErroSenha(null);
    if (!senhaAtual) return setErroSenha("Digite a senha atual.");
    if (senhaNova.length < 6) return setErroSenha("A nova senha precisa ter pelo menos 6 caracteres.");
    if (senhaNova === senhaAtual) return setErroSenha("A nova senha precisa ser diferente da atual.");

    setTrocando(true);
    try {
      await api.trocarSenha({ senha_atual: senhaAtual, senha_nova: senhaNova });
      setSenhaAtual("");
      setSenhaNova("");
      Alert.alert("Pronto!", "Sua senha foi alterada.");
    } catch (e) {
      setErroSenha((e as Error).message);
    } finally {
      setTrocando(false);
    }
  }

  async function alterarEmail() {
    setErroEmail(null);
    if (!emailNovo.includes("@") || !emailNovo.includes(".")) return setErroEmail("Digite um e-mail válido.");
    if (!senhaEmail) return setErroEmail("Digite sua senha para confirmar.");

    setTrocandoEmail(true);
    try {
      const atualizado = await api.alterarEmail({ email_novo: emailNovo.trim(), senha: senhaEmail });
      onAtualizado(atualizado);
      setEmailNovo("");
      setSenhaEmail("");
      Alert.alert("Pronto!", "Seu e-mail foi alterado. Use o novo e-mail para entrar.");
    } catch (e) {
      setErroEmail((e as Error).message);
    } finally {
      setTrocandoEmail(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.lista} keyboardShouldPersistTaps="handled">
      <Text style={styles.titulo}>Meus dados</Text>

      <Text style={styles.rotulo}>E-mail (seu login)</Text>
      <Text style={styles.email}>{cliente.email}</Text>

      <Text style={styles.rotulo}>Nome</Text>
      <TextInput style={styles.campo} value={nome} onChangeText={setNome} autoCapitalize="words" />

      <Text style={styles.rotulo}>Telefone</Text>
      <TextInput
        style={styles.campo}
        value={telefone}
        onChangeText={setTelefone}
        keyboardType="phone-pad"
        placeholder="(11) 91234-5678"
      />

      {erroPerfil ? <Text style={styles.erro}>{erroPerfil}</Text> : null}

      <Pressable
        style={[styles.botao, salvando && styles.botaoDesativado]}
        onPress={salvarPerfil}
        disabled={salvando}
      >
        {salvando ? <ActivityIndicator color="#fff" /> : <Text style={styles.textoBotao}>Salvar alterações</Text>}
      </Pressable>

      <View style={styles.separador} />

      <Text style={styles.titulo}>Alterar e-mail</Text>

      <Text style={styles.rotulo}>Novo e-mail</Text>
      <TextInput
        style={styles.campo}
        value={emailNovo}
        onChangeText={setEmailNovo}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="novo@email.com"
      />

      <Text style={styles.rotulo}>Sua senha (para confirmar)</Text>
      <TextInput
        style={styles.campo}
        value={senhaEmail}
        onChangeText={setSenhaEmail}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
      />

      {erroEmail ? <Text style={styles.erro}>{erroEmail}</Text> : null}

      <Pressable
        style={[styles.botaoVazado, trocandoEmail && styles.botaoDesativado]}
        onPress={alterarEmail}
        disabled={trocandoEmail}
      >
        {trocandoEmail ? <ActivityIndicator color={COR} /> : <Text style={styles.textoBotaoVazado}>Alterar e-mail</Text>}
      </Pressable>

      <View style={styles.separador} />

      <Text style={styles.titulo}>Trocar senha</Text>

      <Text style={styles.rotulo}>Senha atual</Text>
      <TextInput
        style={styles.campo}
        value={senhaAtual}
        onChangeText={setSenhaAtual}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
      />

      <Text style={styles.rotulo}>Nova senha</Text>
      <TextInput
        style={styles.campo}
        value={senhaNova}
        onChangeText={setSenhaNova}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="Mínimo de 6 caracteres"
      />

      {erroSenha ? <Text style={styles.erro}>{erroSenha}</Text> : null}

      <Pressable
        style={[styles.botaoVazado, trocando && styles.botaoDesativado]}
        onPress={trocarSenha}
        disabled={trocando}
      >
        {trocando ? <ActivityIndicator color={COR} /> : <Text style={styles.textoBotaoVazado}>Trocar senha</Text>}
      </Pressable>
    </ScrollView>
  );
}

const COR = "#d84315";

const styles = StyleSheet.create({
  lista: { padding: 16, paddingTop: 0, gap: 8, paddingBottom: 40 },
  titulo: { fontSize: 22, fontWeight: "bold", marginTop: 4 },
  rotulo: { fontWeight: "600", marginTop: 8 },
  email: { color: "#888", fontSize: 16 },
  campo: { borderWidth: 1, borderColor: "#ccc", borderRadius: 10, padding: 12, fontSize: 16 },
  erro: { color: "#b00020" },
  botao: { backgroundColor: COR, padding: 14, borderRadius: 10, alignItems: "center", marginTop: 12 },
  botaoDesativado: { opacity: 0.6 },
  textoBotao: { color: "#fff", fontWeight: "bold" },
  botaoVazado: {
    borderWidth: 1,
    borderColor: COR,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 12,
  },
  textoBotaoVazado: { color: COR, fontWeight: "bold" },
  separador: { height: 1, backgroundColor: "#8884", marginVertical: 16 },
});

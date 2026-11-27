// Aba "Meu perfil": editar nome e telefone, trocar a senha. (O e-mail é o login e não muda.)

import { useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

import { api, type Cliente } from "../services/api";

type Props = {
  cliente: Cliente;
  onAtualizado: (cliente: Cliente) => void;
  onMeusPedidos: () => void;
  onClube: () => void;
  onCupons: () => void;
  onNotificacoes: () => void;
  onFormasPagamento: () => void;
  onEstabelecimento: () => void;
  onPainelAdmin: () => void;
  onSair: () => void;
};

export default function Perfil({
  cliente,
  onAtualizado,
  onMeusPedidos,
  onClube,
  onCupons,
  onNotificacoes,
  onFormasPagamento,
  onEstabelecimento,
  onPainelAdmin,
  onSair,
}: Props) {
  const [tela, setTela] = useState<"menu" | "dados">("menu");
  const [nome, setNome] = useState(cliente.nome);
  const [telefone, setTelefone] = useState(cliente.telefone);
  const [foto, setFoto] = useState<string | null>(cliente.foto ?? null);
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

  async function escolherFoto(): Promise<string | null> {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert("Permissão necessária", "Autorize o acesso às fotos para selecionar sua foto de perfil.");
      return null;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.45,
      base64: true,
    });

    if (resultado.canceled || !resultado.assets[0]) return null;
    const selecionada = resultado.assets[0];
    return selecionada.base64 ? `data:image/jpeg;base64,${selecionada.base64}` : selecionada.uri;
  }

  async function alterarFotoDoMenu() {
    const novaFoto = await escolherFoto();
    if (!novaFoto) return;

    setFoto(novaFoto);
    try {
      const atualizado = await api.atualizarPerfil({
        nome: cliente.nome,
        telefone: cliente.telefone,
        foto: novaFoto,
      });
      onAtualizado(atualizado);
      Alert.alert("Pronto!", "Sua foto foi atualizada.");
    } catch (e) {
      setErroPerfil((e as Error).message);
      Alert.alert("Não foi possível atualizar", (e as Error).message);
    }
  }

  async function salvarPerfil() {
    setErroPerfil(null);
    if (!nome.trim()) return setErroPerfil("Digite seu nome.");
    if (telefone.replace(/\D/g, "").length < 10) return setErroPerfil("Digite o telefone com DDD.");

    setSalvando(true);
    try {
      const atualizado = await api.atualizarPerfil({ nome: nome.trim(), telefone: telefone.trim(), foto });
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

  if (tela === "menu") {
    const opcoes: { titulo: string; aoTocar: () => void; sair?: boolean }[] = [
      { titulo: "Dados pessoais", aoTocar: () => setTela("dados") },
      { titulo: "Meus pedidos", aoTocar: onMeusPedidos },
      { titulo: "Commandiz Club", aoTocar: onClube },
      { titulo: "Cupons", aoTocar: onCupons },
      { titulo: "Notificações", aoTocar: onNotificacoes },
      { titulo: "Formas de pagamento", aoTocar: onFormasPagamento },
      { titulo: "Informações do estabelecimento", aoTocar: onEstabelecimento },
      { titulo: "Sair", aoTocar: onSair, sair: true },
    ];

    return (
      <ScrollView contentContainerStyle={styles.menu} showsVerticalScrollIndicator={false}>
        <Text style={styles.tituloMenu}>Perfil</Text>

        <View style={styles.identidade}>
          <Pressable
            style={styles.avatarBotao}
            onPress={alterarFotoDoMenu}
            accessibilityRole="button"
            accessibilityLabel="Adicionar ou alterar foto do perfil"
          >
            {cliente.foto ? (
              <Image source={{ uri: cliente.foto }} style={styles.avatar} resizeMode="cover" />
            ) : (
              <View style={[styles.avatar, styles.avatarVazio]}>
                <Ionicons name="person" size={25} color={MARROM} />
              </View>
            )}
            <View style={styles.cameraAvatar}>
              <Ionicons name="camera" size={12} color="#fff" />
            </View>
          </Pressable>
          <Pressable onPress={alterarFotoDoMenu}>
            <Text style={styles.alterarFoto}>{cliente.foto ? "Alterar foto" : "Adicionar foto"}</Text>
          </Pressable>
          <Text style={styles.nomeCliente}>{cliente.nome}</Text>
          <Text style={styles.emailCliente}>{cliente.email}</Text>
        </View>

        <View style={styles.opcoes}>
          {opcoes.map((opcao, indice) => (
            <Pressable
              key={opcao.titulo}
              style={[
                styles.opcao,
                indice < opcoes.length - 1 && styles.opcaoComBorda,
              ]}
              onPress={opcao.aoTocar}
              accessibilityRole="button"
            >
              <Text style={[styles.textoOpcao, opcao.sair && styles.textoSair]}>{opcao.titulo}</Text>
              {!opcao.sair ? <Ionicons name="chevron-forward" size={14} color={MARROM} /> : null}
            </Pressable>
          ))}
        </View>

        {cliente.admin ? (
          <View style={styles.secaoAdmin}>
            <Text style={styles.tituloSecaoAdmin}>Área do administrador</Text>
            <Pressable
              style={styles.botaoAdmin}
              onPress={onPainelAdmin}
              accessibilityRole="button"
              accessibilityLabel="Abrir painel do administrador"
            >
              <View style={styles.iconeAdmin}>
                <Ionicons name="construct" size={19} color="#fff" />
              </View>
              <View style={styles.textosAdmin}>
                <Text style={styles.textoAdmin}>Painel administrativo</Text>
                <Text style={styles.subtextoAdmin}>Pedidos, cardápio e cupons</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#fff" />
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.lista} keyboardShouldPersistTaps="handled">
      <Pressable style={styles.voltar} onPress={() => setTela("menu")} accessibilityRole="button">
        <Ionicons name="chevron-back" size={16} color={MARROM} />
        <Text style={styles.textoVoltar}>Voltar ao perfil</Text>
      </Pressable>
      <Text style={styles.titulo}>Dados pessoais</Text>

      <View style={styles.areaFoto}>
        {foto ? (
          <Image source={{ uri: foto }} style={styles.fotoPerfil} resizeMode="cover" />
        ) : (
          <View style={[styles.fotoPerfil, styles.fotoVazia]}>
            <Ionicons name="person" size={38} color={MARROM} />
          </View>
        )}
        <Pressable
          style={styles.botaoFoto}
          onPress={async () => {
            const novaFoto = await escolherFoto();
            if (novaFoto) setFoto(novaFoto);
          }}
          accessibilityRole="button"
        >
          <Ionicons name="camera-outline" size={18} color="#fff" />
          <Text style={styles.textoBotaoFoto}>{foto ? "Alterar foto" : "Adicionar foto"}</Text>
        </Pressable>
      </View>

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
const MARROM = "#642600";

const styles = StyleSheet.create({
  menu: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 20 },
  tituloMenu: { color: MARROM, fontSize: 16, fontWeight: "700" },
  identidade: { alignItems: "center", paddingTop: 8, paddingBottom: 12, gap: 3 },
  avatarBotao: { position: "relative", marginBottom: 2 },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: "#f0e2d5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  avatarVazio: { marginBottom: 0 },
  cameraAvatar: {
    position: "absolute",
    right: -2,
    bottom: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: MARROM,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  alterarFoto: { color: COR, fontSize: 11, fontWeight: "700", marginBottom: 2 },
  areaFoto: { alignItems: "center", gap: 8, marginVertical: 12 },
  fotoPerfil: { width: 92, height: 92, borderRadius: 46, borderWidth: 2, borderColor: "#f0e2d5" },
  fotoVazia: { backgroundColor: "#fffaf5", alignItems: "center", justifyContent: "center" },
  botaoFoto: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: MARROM,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  textoBotaoFoto: { color: "#fff", fontWeight: "700", fontSize: 12 },
  nomeCliente: { color: MARROM, fontSize: 13, fontWeight: "700" },
  emailCliente: { color: "#8a8179", fontSize: 10 },
  opcoes: {
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#f0e2d5",
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  secaoAdmin: { marginTop: 14, gap: 7 },
  tituloSecaoAdmin: { color: MARROM, fontSize: 12, fontWeight: "800", textTransform: "uppercase" },
  botaoAdmin: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: MARROM,
  },
  iconeAdmin: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COR,
  },
  textosAdmin: { flex: 1 },
  textoAdmin: { color: "#fff", fontSize: 13, fontWeight: "800" },
  subtextoAdmin: { color: "#f2dac7", fontSize: 10, marginTop: 2 },
  opcao: { minHeight: 28, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  opcaoComBorda: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#e8d5c4" },
  textoOpcao: { color: "#70442d", fontSize: 10 },
  textoSair: { color: COR },
  lista: { padding: 16, paddingTop: 0, gap: 8, paddingBottom: 40 },
  titulo: { fontSize: 22, fontWeight: "bold", marginTop: 4 },
  voltar: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", marginBottom: 4 },
  textoVoltar: { color: MARROM, fontSize: 13, fontWeight: "600" },
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

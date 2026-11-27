// Se não há login, mostra a tela de entrar/criar conta. Se há, mostra a área logada.

import { QueryClientProvider } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import AreaLogada from "../../components/AreaLogada";
import AutenticacaoForm from "../../components/AutenticacaoForm";
import TelaDespedida from "../../components/TelaDespedida";
import { api, definirAoExpirarSessao, type ApiError, type Cliente } from "../../services/api";
import { definirUsuario, iniciarMonitoramento } from "../../services/monitoramento";
import { queryClient } from "../../services/queryClient";
import { lerToken, limparSessao } from "../../services/sessao";

iniciarMonitoramento();

export default function Tela() {
  return (
    <QueryClientProvider client={queryClient}>
      <Conteudo />
    </QueryClientProvider>
  );
}

function Conteudo() {
  // undefined = ainda verificando | null = sem login | Cliente = logado
  const [cliente, setCliente] = useState<Cliente | null | undefined>(undefined);
  const [nomeDespedida, setNomeDespedida] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  // Se o token vencer no meio do uso, o interceptador avisa e voltamos para o login.
  useEffect(() => {
    definirAoExpirarSessao(() => {
      queryClient.clear();
      setCliente(null);
    });
    return () => definirAoExpirarSessao(null);
  }, []);

  // Ao abrir o app: existe um login válido guardado neste celular?
  const iniciar = useCallback(async () => {
    setErro(null);
    try {
      const token = await lerToken();
      if (!token) {
        setCliente(null);
        return;
      }
      setCliente(await api.eu());
    } catch (e) {
      if ((e as ApiError).status === 401) {
        await limparSessao();
        setCliente(null);
      } else {
        setErro((e as Error).message);
      }
    }
  }, []);

  useEffect(() => {
    iniciar();
  }, [iniciar]);

  // Diz ao Sentry quem está usando o app (só o número do cliente).
  useEffect(() => {
    definirUsuario(cliente ? cliente.id : null);
  }, [cliente]);

  async function sair() {
    setNomeDespedida(cliente?.nome ?? null);
    await limparSessao();
    queryClient.clear(); // esquece carrinho e favoritos de quem saiu
    setCliente(null);
  }

  if (erro) {
    return (
      <View style={styles.centro}>
        <Text style={styles.titulo}>Ops, deu erro 😕</Text>
        <Text style={styles.erro}>{erro}</Text>
        <Pressable
          style={styles.botao}
          onPress={() => {
            setCliente(undefined);
            iniciar();
          }}
        >
          <Text style={styles.textoBotao}>Tentar de novo</Text>
        </Pressable>
      </View>
    );
  }

  if (cliente === undefined) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (cliente === null) {
    if (nomeDespedida) {
      return (
        <TelaDespedida
          nome={nomeDespedida}
          aoEntrarNovamente={() => setNomeDespedida(null)}
        />
      );
    }

    return (
      <AutenticacaoForm
        onAutenticado={(c) => {
          queryClient.clear();
          setNomeDespedida(null);
          setCliente(c);
        }}
      />
    );
  }

  return <AreaLogada cliente={cliente} onSair={sair} onAtualizado={setCliente} />;
}

const styles = StyleSheet.create({
  centro: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 8 },
  titulo: { fontSize: 24, fontWeight: "bold" },
  erro: { color: "#b00020", textAlign: "center" },
  botao: { backgroundColor: "#d84315", padding: 14, borderRadius: 10, alignItems: "center", marginTop: 8 },
  textoBotao: { color: "#fff", fontWeight: "bold" },
});
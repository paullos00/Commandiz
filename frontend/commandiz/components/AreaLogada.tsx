// A parte do app que só aparece depois do login: abas de Cardápio, Favoritos e Carrinho.

import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import {
  useAdicionarAoCarrinho,
  useAlternarFavorito,
  useCarrinho,
  useCategorias,
  useCombos,
  useCuponsDisponiveis,
  useEspetos,
  useFavoritos,
  useLimparCarrinho,
  useMudarQuantidade,
  useNotificacoes,
  useRemoverItem,
} from "../hooks/useCommandiz";
import { api, formatarPreco, type Cliente, type Pedido, type ValidacaoCupom } from "../services/api";
import FinalizarPedido from "./FinalizarPedido";
import AdminPainel from "./AdminPainel";
import Clube from "./Clube";
import DetalheProduto, { type ProdutoDetalhe } from "./DetalheProduto";
import Notificacoes from "./Notificacoes";
import PagamentoPix from "./PagamentoPix";
import Pedidos from "./Pedidos";
import Perfil from "./Perfil";
import SobreACasa from "./SobreACasa";

type Aba = "cardapio" | "favoritos" | "carrinho" | "pedidos" | "perfil" | "casa" | "notificacoes" | "clube" | "admin";

type Props = {
  cliente: Cliente;
  onSair: () => void;
  onAtualizado: (cliente: Cliente) => void;
};

export default function AreaLogada({ cliente, onSair, onAtualizado }: Props) {
  const [aba, setAba] = useState<Aba>("cardapio");
  const [detalhe, setDetalhe] = useState<ProdutoDetalhe | null>(null);
  const [pagamentoPix, setPagamentoPix] = useState<Pedido | null>(null);
  const carrinho = useCarrinho(cliente.id);
  const notificacoes = useNotificacoes(cliente.id);
  const naoLidas = notificacoes.data?.nao_lidas ?? 0;

  const totalItens = (carrinho.data?.itens ?? []).reduce((soma, item) => soma + item.quantidade, 0);

  return (
    <View style={styles.tela}>
      <View style={styles.topo}>
        <Pressable
          onPress={() => {
            setDetalhe(null);
            setAba("perfil");
          }}
          style={styles.saudacao}
        >
          <Text style={styles.ola} numberOfLines={1}>
            Olá, {cliente.nome}! 👋
          </Text>
          <Text style={styles.verPerfil}>Meu perfil</Text>
        </Pressable>
        <View style={styles.acoesTopo}>
          <Pressable
            onPress={() => {
              setDetalhe(null);
              setAba("notificacoes");
            }}
            hitSlop={8}
          >
            <Text style={styles.sino}>
              🔔
              {naoLidas > 0 ? <Text style={styles.contadorSino}> {naoLidas > 9 ? "9+" : naoLidas}</Text> : null}
            </Text>
          </Pressable>
          {cliente.admin ? (
            <Pressable
              onPress={() => {
                setDetalhe(null);
                setAba("admin");
              }}
            >
              <Text style={styles.admin}>🛠 Admin</Text>
            </Pressable>
          ) : null}
          <Pressable onPress={onSair}>
            <Text style={styles.sair}>Sair</Text>
          </Pressable>
        </View>
      </View>

      {detalhe ? (
        <DetalheProduto produto={detalhe} clienteId={cliente.id} aoVoltar={() => setDetalhe(null)} />
      ) : pagamentoPix ? (
        <PagamentoPix
          pedido={pagamentoPix}
          aoConcluir={() => {
            setPagamentoPix(null);
            setAba("pedidos");
          }}
        />
      ) : (
        <>
          <View style={styles.abas}>
            <BotaoAba titulo="Cardápio" ativo={aba === "cardapio"} aoTocar={() => setAba("cardapio")} />
            <BotaoAba titulo="Favoritos" ativo={aba === "favoritos"} aoTocar={() => setAba("favoritos")} />
            <BotaoAba
              titulo="Carrinho"
              contador={totalItens}
              ativo={aba === "carrinho"}
              aoTocar={() => setAba("carrinho")}
            />
            <BotaoAba titulo="Pedidos" ativo={aba === "pedidos"} aoTocar={() => setAba("pedidos")} />
          </View>

          {aba === "cardapio" && (
            <Cardapio
              clienteId={cliente.id}
              aoAbrirProduto={setDetalhe}
              aoAbrirCasa={() => setAba("casa")}
              aoAbrirClube={() => setAba("clube")}
            />
          )}
          {aba === "favoritos" && <Favoritos clienteId={cliente.id} />}
          {aba === "carrinho" && (
            <PainelCarrinho clienteId={cliente.id} aoFinalizar={() => setAba("pedidos")} aoPix={setPagamentoPix} />
          )}
          {aba === "pedidos" && <Pedidos clienteId={cliente.id} aoMostrarPix={setPagamentoPix} />}
          {aba === "perfil" && <Perfil cliente={cliente} onAtualizado={onAtualizado} />}
          {aba === "casa" && <SobreACasa aoVoltar={() => setAba("cardapio")} />}
          {aba === "notificacoes" && <Notificacoes clienteId={cliente.id} />}
          {aba === "clube" && <Clube clienteId={cliente.id} aoVoltar={() => setAba("cardapio")} />}
          {aba === "admin" && cliente.admin ? <AdminPainel /> : null}
        </>
      )}
    </View>
  );
}

// ---------- Peças pequenas ----------

function BotaoAba({
  titulo,
  ativo,
  aoTocar,
  contador = 0,
}: {
  titulo: string;
  ativo: boolean;
  aoTocar: () => void;
  contador?: number;
}) {
  return (
    <Pressable style={[styles.aba, ativo && styles.abaAtiva]} onPress={aoTocar}>
      <View style={styles.conteudoAba}>
        <Text style={[styles.textoAba, ativo && styles.textoAbaAtiva]} numberOfLines={1}>
          {titulo}
        </Text>
        {contador > 0 ? (
          <View style={[styles.selo, ativo && styles.seloAtivo]}>
            <Text style={[styles.textoSelo, ativo && styles.textoSeloAtivo]}>{contador}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

function Carregando({ texto }: { texto: string }) {
  return (
    <View style={styles.centro}>
      <ActivityIndicator size="large" />
      <Text>{texto}</Text>
    </View>
  );
}

function Erro({ mensagem, aoTentarDeNovo }: { mensagem: string; aoTentarDeNovo: () => void }) {
  return (
    <View style={styles.centro}>
      <Text style={styles.titulo}>Ops, deu erro 😕</Text>
      <Text style={styles.erro}>{mensagem}</Text>
      <Pressable style={styles.botao} onPress={aoTentarDeNovo}>
        <Text style={styles.textoBotao}>Tentar de novo</Text>
      </Pressable>
    </View>
  );
}

function Chip({ titulo, ativo, aoTocar }: { titulo: string; ativo: boolean; aoTocar: () => void }) {
  return (
    <Pressable style={[styles.chip, ativo && styles.chipAtivo]} onPress={aoTocar}>
      <Text style={[styles.textoChip, ativo && styles.textoChipAtivo]}>{titulo}</Text>
    </Pressable>
  );
}

// ---------- Aba: Cardápio ----------

function Cardapio({
  clienteId,
  aoAbrirProduto,
  aoAbrirCasa,
  aoAbrirClube,
}: {
  clienteId: number;
  aoAbrirProduto: (produto: ProdutoDetalhe) => void;
  aoAbrirCasa: () => void;
  aoAbrirClube: () => void;
}) {
  const espetos = useEspetos();
  const combos = useCombos();
  const favoritos = useFavoritos(clienteId);
  const adicionar = useAdicionarAoCarrinho(clienteId);
  const alternarFavorito = useAlternarFavorito(clienteId);
  const categorias = useCategorias();
  const [categoriaSel, setCategoriaSel] = useState<number | null>(null);

  if (espetos.isPending || combos.isPending) return <Carregando texto="Carregando cardápio..." />;

  const erro = espetos.error ?? combos.error;
  if (erro) {
    return (
      <Erro
        mensagem={erro.message}
        aoTentarDeNovo={() => {
          espetos.refetch();
          combos.refetch();
        }}
      />
    );
  }

  const idsFavoritos = new Set((favoritos.data ?? []).map((f) => f.id));
  const listaEspetos = (espetos.data ?? []).filter((e) => categoriaSel === null || e.categoria_id === categoriaSel);
  // só mostramos as categorias que têm pelo menos um espeto
  const categoriasComItens = (categorias.data ?? []).filter((cat) =>
    (espetos.data ?? []).some((e) => e.categoria_id === cat.id),
  );

  return (
    <ScrollView contentContainerStyle={styles.lista}>
      <Pressable style={styles.linkCasa} onPress={aoAbrirCasa}>
        <Text style={styles.textoLinkCasa}>ℹ️  Sobre a casa • horários e contato</Text>
      </Pressable>
      <Pressable style={styles.linkCasa} onPress={aoAbrirClube}>
        <Text style={styles.textoLinkCasa}>👑  Commandiz Club • pontos e recompensas</Text>
      </Pressable>

      {categoriasComItens.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chips}
          contentContainerStyle={styles.chipsConteudo}
        >
          <Chip titulo="Todos" ativo={categoriaSel === null} aoTocar={() => setCategoriaSel(null)} />
          {categoriasComItens.map((cat) => (
            <Chip
              key={cat.id}
              titulo={cat.nome}
              ativo={categoriaSel === cat.id}
              aoTocar={() => setCategoriaSel(cat.id)}
            />
          ))}
        </ScrollView>
      ) : null}

      <Text style={styles.titulo}>Espetos</Text>
      {listaEspetos.map((e) => {
        const favorito = idsFavoritos.has(e.id);
        return (
          <Pressable
            key={e.id}
            style={styles.card}
            onPress={() =>
              aoAbrirProduto({
                tipo: "espeto",
                id: e.id,
                nome: e.nome,
                descricao: e.descricao,
                preco: e.preco,
                imagem: e.imagem,
              })
            }
          >
            {e.imagem ? <Image source={{ uri: e.imagem }} style={styles.miniatura} resizeMode="cover" /> : null}
            <View style={styles.linha}>
              <Text style={styles.nome}>{e.nome}</Text>
              <Pressable
                hitSlop={10}
                onPress={() => alternarFavorito.mutate({ espetoId: e.id, favorito })}
                disabled={alternarFavorito.isPending}
              >
                <Text style={styles.coracao}>{favorito ? "❤️" : "🤍"}</Text>
              </Pressable>
            </View>
            {e.descricao ? <Text>{e.descricao}</Text> : null}
            <View style={styles.linha}>
              <Text style={styles.preco}>{formatarPreco(e.preco)}</Text>
              <Pressable
                style={styles.botaoPequeno}
                onPress={() => adicionar.mutate({ espeto_id: e.id })}
                disabled={adicionar.isPending}
              >
                <Text style={styles.textoBotao}>Adicionar</Text>
              </Pressable>
            </View>
          </Pressable>
        );
      })}

      {categoriaSel === null ? <Text style={styles.titulo}>Combos</Text> : null}
      {(categoriaSel === null ? (combos.data ?? []) : []).map((c) => (
        <Pressable
          key={c.id}
          style={styles.card}
          onPress={() =>
            aoAbrirProduto({
              tipo: "combo",
              id: c.id,
              nome: c.nome,
              descricao: c.descricao,
              preco: c.preco,
              precoOriginal: c.preco_original,
              imagem: c.imagem,
            })
          }
        >
          {c.imagem ? <Image source={{ uri: c.imagem }} style={styles.miniatura} resizeMode="cover" /> : null}
          <Text style={styles.nome}>{c.nome}</Text>
          {c.descricao ? <Text>{c.descricao}</Text> : null}
          <View style={styles.linha}>
            <Text style={styles.preco}>
              {formatarPreco(c.preco)}
              {c.preco_original ? `  (de ${formatarPreco(c.preco_original)})` : ""}
            </Text>
            <Pressable
              style={styles.botaoPequeno}
              onPress={() => adicionar.mutate({ combo_id: c.id })}
              disabled={adicionar.isPending}
            >
              <Text style={styles.textoBotao}>Adicionar</Text>
            </Pressable>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

// ---------- Aba: Favoritos ----------

function Favoritos({ clienteId }: { clienteId: number }) {
  const favoritos = useFavoritos(clienteId);
  const adicionar = useAdicionarAoCarrinho(clienteId);
  const alternarFavorito = useAlternarFavorito(clienteId);

  if (favoritos.isPending) return <Carregando texto="Carregando favoritos..." />;
  if (favoritos.error) {
    return <Erro mensagem={favoritos.error.message} aoTentarDeNovo={() => favoritos.refetch()} />;
  }

  const lista = favoritos.data ?? [];
  if (lista.length === 0) {
    return (
      <View style={styles.centro}>
        <Text style={styles.vazio}>Você ainda não tem favoritos.{"\n"}Toque no 🤍 de um espeto no cardápio.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.lista}>
      {lista.map((e) => (
        <View key={e.id} style={styles.card}>
          {e.imagem ? <Image source={{ uri: e.imagem }} style={styles.miniatura} resizeMode="cover" /> : null}
          <View style={styles.linha}>
            <Text style={styles.nome}>{e.nome}</Text>
            <Pressable
              hitSlop={10}
              onPress={() => alternarFavorito.mutate({ espetoId: e.id, favorito: true })}
              disabled={alternarFavorito.isPending}
            >
              <Text style={styles.coracao}>❤️</Text>
            </Pressable>
          </View>
          {e.descricao ? <Text>{e.descricao}</Text> : null}
          <View style={styles.linha}>
            <Text style={styles.preco}>{formatarPreco(e.preco)}</Text>
            <Pressable
              style={styles.botaoPequeno}
              onPress={() => adicionar.mutate({ espeto_id: e.id })}
              disabled={adicionar.isPending}
            >
              <Text style={styles.textoBotao}>Adicionar</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

// ---------- Aba: Carrinho ----------

function PainelCarrinho({
  clienteId,
  aoFinalizar,
  aoPix,
}: {
  clienteId: number;
  aoFinalizar: () => void;
  aoPix: (pedido: Pedido) => void;
}) {
  const carrinho = useCarrinho(clienteId);
  const cupons = useCuponsDisponiveis(clienteId);
  const mudar = useMudarQuantidade(clienteId);
  const remover = useRemoverItem(clienteId);
  const limpar = useLimparCarrinho(clienteId);

  const [codigo, setCodigo] = useState("");
  const [aplicado, setAplicado] = useState<ValidacaoCupom | null>(null);
  const [erroCupom, setErroCupom] = useState<string | null>(null);
  const [validando, setValidando] = useState(false);

  const subtotal = carrinho.data?.total ?? 0;

  // Se o carrinho mudar com um cupom aplicado, conferimos de novo (o desconto pode mudar).
  useEffect(() => {
    if (!aplicado) return;
    let cancelado = false;
    api
      .validarCupom(clienteId, aplicado.codigo)
      .then((v) => {
        if (!cancelado) setAplicado(v);
      })
      .catch((e: Error) => {
        if (!cancelado) {
          setAplicado(null);
          setErroCupom(e.message);
        }
      });
    return () => {
      cancelado = true;
    };
  }, [subtotal]);

  async function aplicarCupom(texto: string) {
    setErroCupom(null);
    const limpo = texto.trim().toUpperCase();
    if (!limpo) {
      setErroCupom("Digite o código do cupom.");
      return;
    }
    setValidando(true);
    try {
      setAplicado(await api.validarCupom(clienteId, limpo));
      setCodigo("");
    } catch (e) {
      setAplicado(null);
      setErroCupom((e as Error).message);
    } finally {
      setValidando(false);
    }
  }

  if (carrinho.isPending) return <Carregando texto="Carregando carrinho..." />;
  if (carrinho.error) {
    return <Erro mensagem={carrinho.error.message} aoTentarDeNovo={() => carrinho.refetch()} />;
  }

  const itens = carrinho.data?.itens ?? [];
  const totalFinal = aplicado ? aplicado.total : subtotal;
  const ocupado = mudar.isPending || remover.isPending || limpar.isPending;

  if (itens.length === 0) {
    return (
      <View style={styles.centro}>
        <Text style={styles.vazio}>Seu carrinho está vazio 🛒{"\n"}Adicione algo no cardápio.</Text>
      </View>
    );
  }

  function confirmarLimpeza() {
    Alert.alert("Limpar carrinho", "Remover todos os itens?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Limpar", style: "destructive", onPress: () => limpar.mutate() },
    ]);
  }

  return (
    <ScrollView contentContainerStyle={styles.lista} keyboardShouldPersistTaps="handled">
      {itens.map((item) => (
        <View key={item.id} style={styles.card}>
          <Text style={styles.nome}>{item.nome}</Text>
          <Text>{formatarPreco(item.preco_unitario)} cada</Text>
          {item.observacao ? <Text style={styles.obs}>Obs.: {item.observacao}</Text> : null}

          <View style={styles.linha}>
            <View style={styles.quantidade}>
              <Pressable
                style={styles.botaoQuantidade}
                disabled={ocupado || item.quantidade <= 1}
                onPress={() => mudar.mutate({ itemId: item.id, quantidade: item.quantidade - 1 })}
              >
                <Text style={styles.textoQuantidade}>−</Text>
              </Pressable>
              <Text style={styles.numeroQuantidade}>{item.quantidade}</Text>
              <Pressable
                style={styles.botaoQuantidade}
                disabled={ocupado}
                onPress={() => mudar.mutate({ itemId: item.id, quantidade: item.quantidade + 1 })}
              >
                <Text style={styles.textoQuantidade}>+</Text>
              </Pressable>
            </View>

            <Text style={styles.preco}>{formatarPreco(item.subtotal)}</Text>
          </View>

          <Pressable disabled={ocupado} onPress={() => remover.mutate(item.id)}>
            <Text style={styles.remover}>Remover</Text>
          </Pressable>
        </View>
      ))}

      <View style={styles.cupomBox}>
        <Text style={styles.nome}>🏷️ Cupom de desconto</Text>

        {aplicado ? (
          <View style={styles.linha}>
            <Text style={styles.cupomOk}>{aplicado.codigo} aplicado</Text>
            <Pressable onPress={() => setAplicado(null)}>
              <Text style={styles.remover}>Remover</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.linha}>
              <TextInput
                style={styles.campoCupom}
                value={codigo}
                onChangeText={(t) => setCodigo(t.toUpperCase())}
                placeholder="Digite o código"
                autoCapitalize="characters"
                autoCorrect={false}
              />
              <Pressable style={styles.botaoPequeno} onPress={() => aplicarCupom(codigo)} disabled={validando}>
                {validando ? <ActivityIndicator color="#fff" /> : <Text style={styles.textoBotao}>Aplicar</Text>}
              </Pressable>
            </View>

            {(cupons.data ?? []).length > 0 ? (
              <View style={styles.cuponsLista}>
                {(cupons.data ?? []).map((cupom) => (
                  <Pressable key={cupom.codigo} style={styles.chipCupom} onPress={() => aplicarCupom(cupom.codigo)}>
                    <Text style={styles.textoChipCupom}>{cupom.codigo}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </>
        )}

        {erroCupom ? <Text style={styles.erroCupom}>{erroCupom}</Text> : null}
      </View>

      {aplicado ? (
        <View style={{ gap: 4 }}>
          <View style={styles.linha}>
            <Text>Subtotal</Text>
            <Text>{formatarPreco(subtotal)}</Text>
          </View>
          <View style={styles.linha}>
            <Text style={styles.cupomOk}>Desconto ({aplicado.codigo})</Text>
            <Text style={styles.cupomOk}>− {formatarPreco(aplicado.desconto)}</Text>
          </View>
        </View>
      ) : null}

      <View style={styles.totalLinha}>
        <Text style={styles.titulo}>Total</Text>
        <Text style={styles.titulo}>{formatarPreco(totalFinal)}</Text>
      </View>

      <FinalizarPedido clienteId={clienteId} total={totalFinal} cupom={aplicado?.codigo} aoConcluir={aoFinalizar} aoPix={aoPix} />

      <Pressable disabled={ocupado} onPress={confirmarLimpeza}>
        <Text style={styles.remover}>Limpar carrinho</Text>
      </Pressable>
    </ScrollView>
  );
}

const COR = "#d84315";

const styles = StyleSheet.create({
  tela: { flex: 1, paddingTop: 56 },
  topo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  saudacao: { flexShrink: 1 },
  ola: { fontSize: 18, fontWeight: "600" },
  verPerfil: { color: "#888", fontSize: 12 },
  sair: { color: COR, fontWeight: "bold" },
  sino: { fontSize: 20 },
  miniatura: { width: "100%", height: 130, borderRadius: 10 },
  admin: { color: "#d84315", fontWeight: "bold" },
  contadorSino: { fontSize: 14, fontWeight: "bold", color: "#d84315" },
  acoesTopo: { flexDirection: "row", alignItems: "center", gap: 16 },
  testar: { color: "#888", fontSize: 13 },
  abas: { flexDirection: "row", gap: 6, paddingHorizontal: 12, paddingVertical: 12 },
  linkCasa: { padding: 12, borderRadius: 12, backgroundColor: "#d8431520" },
  textoLinkCasa: { color: COR, fontWeight: "600" },
  chips: { flexGrow: 0 },
  chipsConteudo: { gap: 8, paddingVertical: 4 },
  chip: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1, borderColor: COR },
  chipAtivo: { backgroundColor: COR },
  textoChip: { color: COR, fontWeight: "600" },
  textoChipAtivo: { color: "#fff" },
  obs: { color: "#888", fontStyle: "italic" },
  cupomBox: { borderWidth: 1, borderColor: "#ddd", borderRadius: 12, padding: 12, gap: 8 },
  campoCupom: { flex: 1, borderWidth: 1, borderColor: "#ccc", borderRadius: 10, padding: 10, fontSize: 16 },
  cupomOk: { color: "#2e7d32", fontWeight: "bold" },
  erroCupom: { color: "#b00020" },
  cuponsLista: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chipCupom: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: COR, borderStyle: "dashed" },
  textoChipCupom: { color: COR, fontWeight: "600" },
  aba: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COR,
    alignItems: "center",
    justifyContent: "center",
  },
  abaAtiva: { backgroundColor: COR },
  conteudoAba: { flexDirection: "row", alignItems: "center", gap: 4 },
  textoAba: { color: COR, fontWeight: "600", fontSize: 13 },
  textoAbaAtiva: { color: "#fff" },
  selo: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COR,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  seloAtivo: { backgroundColor: "#fff" },
  textoSelo: { color: "#fff", fontSize: 11, fontWeight: "bold" },
  textoSeloAtivo: { color: COR },
  lista: { padding: 16, paddingTop: 0, gap: 12 },
  centro: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 8 },
  titulo: { fontSize: 22, fontWeight: "bold", marginTop: 4 },
  erro: { color: "#b00020", textAlign: "center" },
  vazio: { textAlign: "center", fontSize: 16 },
  card: { padding: 12, borderRadius: 12, borderWidth: 1, borderColor: "#ddd", gap: 6 },
  linha: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  nome: { fontSize: 18, fontWeight: "600", flexShrink: 1 },
  preco: { fontWeight: "bold" },
  coracao: { fontSize: 22 },
  botao: { backgroundColor: COR, padding: 14, borderRadius: 10, alignItems: "center", marginTop: 8 },
  botaoPequeno: { backgroundColor: COR, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 },
  textoBotao: { color: "#fff", fontWeight: "bold" },
  quantidade: { flexDirection: "row", alignItems: "center", gap: 12 },
  botaoQuantidade: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COR,
    alignItems: "center",
    justifyContent: "center",
  },
  textoQuantidade: { color: COR, fontSize: 20, fontWeight: "bold" },
  numeroQuantidade: { fontSize: 18, fontWeight: "600", minWidth: 24, textAlign: "center" },
  remover: { color: COR, fontWeight: "600", textAlign: "center", marginTop: 4 },
  totalLinha: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
});
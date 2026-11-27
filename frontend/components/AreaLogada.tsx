// A parte do app que só aparece depois do login: abas de Cardápio, Favoritos e Carrinho.

import { useEffect, useState, type ComponentProps } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";

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

type Aba =
  | "cardapio"
  | "promocoes"
  | "favoritos"
  | "carrinho"
  | "pedidos"
  | "perfil"
  | "casa"
  | "notificacoes"
  | "clube"
  | "cupons"
  | "pagamentos"
  | "admin";
type AbaPrincipal = Extract<Aba, "cardapio" | "promocoes" | "carrinho" | "pedidos" | "perfil">;
type NomeIcone = ComponentProps<typeof Ionicons>["name"];

const NAVEGACAO: { aba: AbaPrincipal; titulo: string; icone: NomeIcone }[] = [
  { aba: "cardapio", titulo: "Menu", icone: "restaurant-outline" },
  { aba: "promocoes", titulo: "Promoções", icone: "pricetag-outline" },
  { aba: "carrinho", titulo: "Carrinho", icone: "cart-outline" },
  { aba: "pedidos", titulo: "Pedidos", icone: "receipt-outline" },
  { aba: "perfil", titulo: "Perfil", icone: "person-outline" },
];

type Props = {
  cliente: Cliente;
  onSair: () => void;
  onAtualizado: (cliente: Cliente) => void;
};

export default function AreaLogada({ cliente, onSair, onAtualizado }: Props) {
  const [aba, setAba] = useState<Aba>("cardapio");
  const [abaAnterior, setAbaAnterior] = useState<"cardapio" | "perfil">("cardapio");
  const [detalhe, setDetalhe] = useState<ProdutoDetalhe | null>(null);
  const [pagamentoPix, setPagamentoPix] = useState<Pedido | null>(null);
  const carrinho = useCarrinho(cliente.id);
  const notificacoes = useNotificacoes(cliente.id);
  const naoLidas = notificacoes.data?.nao_lidas ?? 0;

  const totalItens = (carrinho.data?.itens ?? []).reduce((soma, item) => soma + item.quantidade, 0);

  return (
    <SafeAreaView style={styles.areaSegura} edges={["top", "bottom"]}>
      <StatusBar style="light" backgroundColor={MARROM} />
      <View style={styles.tela}>
        <View style={styles.topo}>
          <Pressable onPress={() => setAba("cardapio")} style={styles.logotipo}>
            <Image
              source={require("../assets/images/logo-espeto-brutus.png")}
              style={styles.imagemLogotipo}
              resizeMode="contain"
              accessibilityLabel="Espeto do Brutus"
            />
          </Pressable>
          <View style={styles.acoesTopo}>
            <Pressable
              onPress={() => {
                setDetalhe(null);
                setAbaAnterior(aba === "perfil" ? "perfil" : "cardapio");
                setAba("notificacoes");
              }}
              hitSlop={8}
              style={styles.acaoTopo}
              accessibilityLabel="Notificações"
            >
              <Ionicons name="notifications" size={22} color="#f0cf9a" />
              {naoLidas > 0 ? <View style={styles.pontoNotificacao} /> : null}
            </Pressable>
            <Pressable onPress={() => setAba("perfil")} hitSlop={8} accessibilityLabel="Configurações e perfil">
              <Ionicons name="settings-sharp" size={20} color="#f0cf9a" />
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
          <View style={styles.conteudo}>
            {aba === "cardapio" && (
              <Cardapio
                clienteId={cliente.id}
                aoAbrirProduto={setDetalhe}
                aoAbrirFavoritos={() => setAba("favoritos")}
              />
            )}
            {aba === "promocoes" && <Promocoes clienteId={cliente.id} aoAbrirProduto={setDetalhe} />}
            {aba === "favoritos" && <Favoritos clienteId={cliente.id} aoExplorar={() => setAba("cardapio")} />}
            {aba === "carrinho" && (
              <PainelCarrinho
                clienteId={cliente.id}
                aoFinalizar={() => setAba("pedidos")}
                aoPix={setPagamentoPix}
                aoAbrirCardapio={() => setAba("cardapio")}
              />
            )}
            {aba === "pedidos" && <Pedidos clienteId={cliente.id} aoMostrarPix={setPagamentoPix} />}
            {aba === "perfil" && (
              <Perfil
                cliente={cliente}
                onAtualizado={onAtualizado}
                onMeusPedidos={() => setAba("pedidos")}
                onClube={() => {
                  setAbaAnterior("perfil");
                  setAba("clube");
                }}
                onCupons={() => setAba("cupons")}
                onNotificacoes={() => {
                  setAbaAnterior("perfil");
                  setAba("notificacoes");
                }}
                onFormasPagamento={() => setAba("pagamentos")}
                onEstabelecimento={() => {
                  setAbaAnterior("perfil");
                  setAba("casa");
                }}
                onPainelAdmin={() => {
                  setAbaAnterior("perfil");
                  setAba("admin");
                }}
                onSair={onSair}
              />
            )}
            {aba === "casa" && <SobreACasa aoVoltar={() => setAba(abaAnterior)} />}
            {aba === "notificacoes" && <Notificacoes clienteId={cliente.id} />}
            {aba === "clube" && <Clube clienteId={cliente.id} aoVoltar={() => setAba(abaAnterior)} />}
            {aba === "cupons" && (
              <CuponsPerfil clienteId={cliente.id} aoVoltar={() => setAba("perfil")} aoIrCarrinho={() => setAba("carrinho")} />
            )}
            {aba === "pagamentos" && <FormasPagamentoPerfil aoVoltar={() => setAba("perfil")} />}
            {aba === "admin" && cliente.admin ? (
              <AdminPainel aoVoltar={() => setAba("perfil")} />
            ) : null}
          </View>
        )}

        <View style={styles.navegacao}>
          {NAVEGACAO.map((item) => (
            <BotaoNavegacao
              key={item.aba}
              titulo={item.titulo}
              icone={item.icone}
              ativo={
                aba === item.aba ||
                (item.aba === "pedidos" && Boolean(pagamentoPix)) ||
                (item.aba === "perfil" &&
                  abaAnterior === "perfil" &&
                  ["clube", "cupons", "pagamentos", "casa", "notificacoes", "admin"].includes(aba))
              }
              contador={item.aba === "carrinho" ? totalItens : 0}
              aoTocar={() => {
                setDetalhe(null);
                setPagamentoPix(null);
                setAba(item.aba);
              }}
            />
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

// ---------- Peças pequenas ----------

function BotaoNavegacao({
  titulo,
  icone,
  ativo,
  aoTocar,
  contador = 0,
}: {
  titulo: string;
  icone: NomeIcone;
  ativo: boolean;
  aoTocar: () => void;
  contador?: number;
}) {
  return (
    <Pressable style={[styles.itemNavegacao, ativo && styles.itemNavegacaoAtivo]} onPress={aoTocar}>
      <View style={styles.iconeNavegacao}>
        <Ionicons name={icone} size={21} color={ativo ? MARROM : "#fff8ef"} />
        {contador > 0 ? <View style={styles.contadorCarrinho} /> : null}
      </View>
      {ativo ? <Text style={styles.textoNavegacao} numberOfLines={1}>{titulo}</Text> : null}
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
  aoAbrirFavoritos,
}: {
  clienteId: number;
  aoAbrirProduto: (produto: ProdutoDetalhe) => void;
  aoAbrirFavoritos: () => void;
}) {
  const espetos = useEspetos();
  const combos = useCombos();
  const favoritos = useFavoritos(clienteId);
  const adicionar = useAdicionarAoCarrinho(clienteId);
  const alternarFavorito = useAlternarFavorito(clienteId);
  const categorias = useCategorias();
  const [categoriaSel, setCategoriaSel] = useState<number | null>(null);

  if (espetos.isPending || combos.isPending || categorias.isPending) return <Carregando texto="Carregando cardápio..." />;

  const erro = espetos.error ?? combos.error ?? categorias.error;
  if (erro) {
    return (
      <Erro
        mensagem={erro.message}
        aoTentarDeNovo={() => {
          espetos.refetch();
          combos.refetch();
          categorias.refetch();
        }}
      />
    );
  }

  const idsFavoritos = new Set((favoritos.data ?? []).map((f) => f.id));
  const categoriasCardapio = categorias.data ?? [];
  const categoriaBebidas = categoriasCardapio.find(
    (categoria) => categoria.nome.trim().toLocaleLowerCase("pt-BR") === "bebidas",
  );
  const produtosFiltrados = (espetos.data ?? []).filter((e) => categoriaSel === null || e.categoria_id === categoriaSel);
  const categoriasExibidas = categoriaSel === null
    ? categoriasCardapio
    : categoriasCardapio.filter((categoria) => categoria.id === categoriaSel);
  const espetosSemCategoria = produtosFiltrados.filter(
    (espeto) =>
      espeto.categoria_id === null ||
      !categoriasCardapio.some((categoria) => categoria.id === espeto.categoria_id),
  );
  const destaque = produtosFiltrados.find((e) => e.imagem && e.categoria_id !== categoriaBebidas?.id);

  function renderizarEspeto(espeto: NonNullable<typeof espetos.data>[number]) {
    const favorito = idsFavoritos.has(espeto.id);
    const abrirDetalhe = () =>
      aoAbrirProduto({
        tipo: "espeto",
        id: espeto.id,
        nome: espeto.nome,
        descricao: espeto.descricao,
        preco: espeto.preco,
        imagem: espeto.imagem,
      });

    return (
      <View key={espeto.id} style={styles.cardProduto}>
        <View style={styles.linhaProduto}>
          <Pressable style={styles.infoProduto} onPress={abrirDetalhe} accessibilityRole="button">
            <Text style={styles.nome}>{espeto.nome}</Text>
            {espeto.descricao ? <Text style={styles.descricaoProduto}>{espeto.descricao}</Text> : null}
            <Text style={styles.preco}>{formatarPreco(espeto.preco)}</Text>
          </Pressable>
          <View style={styles.thumbProdutoContainer}>
            {espeto.imagem ? (
              <Image source={{ uri: espeto.imagem }} style={styles.thumbProduto} resizeMode="cover" />
            ) : (
              <View style={styles.thumbSemImagem}>
                <Ionicons name="restaurant-outline" size={24} color={MARROM} />
              </View>
            )}
            <Pressable
              style={styles.botaoFavorito}
              hitSlop={8}
              onPress={() => alternarFavorito.mutate({ espetoId: espeto.id, favorito })}
              disabled={alternarFavorito.isPending}
              accessibilityLabel={favorito ? "Remover dos favoritos" : "Adicionar aos favoritos"}
            >
              <Ionicons name={favorito ? "heart" : "heart-outline"} size={19} color={COR} />
            </Pressable>
          </View>
        </View>
        <Pressable
          style={styles.botaoAdicionarEspeto}
          onPress={() => adicionar.mutate({ espeto_id: espeto.id })}
          disabled={adicionar.isPending}
          accessibilityRole="button"
          accessibilityLabel={`Adicionar ${espeto.nome} ao carrinho`}
        >
          {adicionar.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="add" size={17} color="#fff" />
              <Text style={styles.textoAdicionarEspeto}>Adicionar ao carrinho</Text>
            </>
          )}
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.lista}>
      <View style={styles.tituloCardapio}>
        <Text style={styles.titulo}>Cardápio</Text>
        <Pressable style={styles.favoritosLink} onPress={aoAbrirFavoritos}>
          <Ionicons name="heart" size={16} color={COR} />
          <Text style={styles.textoFavoritosLink}>Favoritos</Text>
        </Pressable>
      </View>

      {destaque ? (
        <Pressable
          style={styles.bannerDestaque}
          onPress={() =>
            aoAbrirProduto({
              tipo: "espeto",
              id: destaque.id,
              nome: destaque.nome,
              descricao: destaque.descricao,
              preco: destaque.preco,
              imagem: destaque.imagem,
            })
          }
        >
          <Image source={{ uri: destaque.imagem ?? undefined }} style={styles.imagemDestaque} resizeMode="cover" />
          <View style={styles.sombraDestaque}>
            <Text style={styles.tituloDestaque}>{destaque.nome}</Text>
            <Text style={styles.textoDestaque}>Espetinhos preparados na brasa, na hora.</Text>
          </View>
        </Pressable>
      ) : null}

      {categoriasCardapio.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chips}
          contentContainerStyle={styles.chipsConteudo}
        >
          <Chip titulo="Todos" ativo={categoriaSel === null} aoTocar={() => setCategoriaSel(null)} />
          {categoriasCardapio.map((cat) => (
            <Chip
              key={cat.id}
              titulo={cat.nome}
              ativo={categoriaSel === cat.id}
              aoTocar={() => setCategoriaSel(cat.id)}
            />
          ))}
        </ScrollView>
      ) : null}

      {categoriasExibidas.map((categoria) => {
        const produtosCategoria = produtosFiltrados.filter((espeto) => espeto.categoria_id === categoria.id);
        return (
          <View key={categoria.id}>
            <Text style={styles.titulo}>{categoria.nome}</Text>
            {produtosCategoria.length > 0 ? (
              produtosCategoria.map(renderizarEspeto)
            ) : (
              <Text style={styles.vazio}>Nenhum produto disponível nesta categoria no momento.</Text>
            )}
          </View>
        );
      })}

      {categoriaSel === null && espetosSemCategoria.length > 0 ? (
        <View>
          <Text style={styles.titulo}>Espetos</Text>
          {espetosSemCategoria.map(renderizarEspeto)}
        </View>
      ) : null}

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

function Promocoes({
  clienteId,
  aoAbrirProduto,
}: {
  clienteId: number;
  aoAbrirProduto: (produto: ProdutoDetalhe) => void;
}) {
  const combos = useCombos();
  const adicionar = useAdicionarAoCarrinho(clienteId);

  if (combos.isPending) return <Carregando texto="Carregando promoções..." />;
  if (combos.error) return <Erro mensagem={combos.error.message} aoTentarDeNovo={() => combos.refetch()} />;

  const lista = combos.data ?? [];
  const destaque = lista[0];

  return (
    <ScrollView contentContainerStyle={styles.listaPromocoes}>
      <Text style={styles.tituloPromocoes}>Promoções especiais para deixar seu pedido ainda melhor</Text>
      {destaque ? (
        <Pressable
          style={styles.bannerPromocao}
          onPress={() =>
            aoAbrirProduto({
              tipo: "combo",
              id: destaque.id,
              nome: destaque.nome,
              descricao: destaque.descricao,
              preco: destaque.preco,
              precoOriginal: destaque.preco_original,
              imagem: destaque.imagem,
            })
          }
        >
          {destaque.imagem ? (
            <Image source={{ uri: destaque.imagem }} style={styles.imagemBannerPromocao} resizeMode="cover" />
          ) : null}
          <View style={styles.conteudoBannerPromocao}>
            <Text style={styles.seloPromocao}>DESTAQUE DA SEMANA</Text>
            <Text style={styles.nomeBannerPromocao}>{destaque.nome}</Text>
            {destaque.descricao ? <Text style={styles.descricaoBannerPromocao}>{destaque.descricao}</Text> : null}
            <Text style={styles.precoBannerPromocao}>
              {destaque.preco_original ? `${formatarPreco(destaque.preco_original)}   ` : ""}
              {formatarPreco(destaque.preco)}
            </Text>
          </View>
          <Pressable style={styles.botaoQuero} onPress={() => adicionar.mutate({ combo_id: destaque.id })}>
            <Text style={styles.textoBotaoQuero}>Quero esse</Text>
          </Pressable>
        </Pressable>
      ) : (
        <Text style={styles.vazio}>Nenhuma promoção disponível no momento.</Text>
      )}

      {lista.slice(1).map((combo) => (
        <View key={combo.id} style={styles.cardPromocao}>
          {combo.imagem ? (
            <Image source={{ uri: combo.imagem }} style={styles.imagemCardPromocao} resizeMode="cover" />
          ) : (
            <View style={[styles.imagemCardPromocao, styles.thumbSemImagem]}>
              <Ionicons name="restaurant-outline" size={24} color={MARROM} />
            </View>
          )}
          <Pressable
            style={styles.infoCardPromocao}
            onPress={() =>
              aoAbrirProduto({
                tipo: "combo",
                id: combo.id,
                nome: combo.nome,
                descricao: combo.descricao,
                preco: combo.preco,
                precoOriginal: combo.preco_original,
                imagem: combo.imagem,
              })
            }
          >
            <Text style={styles.nomePromocao}>{combo.nome}</Text>
            {combo.descricao ? <Text style={styles.descricaoPromocao} numberOfLines={2}>{combo.descricao}</Text> : null}
            <Text style={styles.precoPromocao}>{formatarPreco(combo.preco)}</Text>
          </Pressable>
          <Pressable
            style={styles.adicionarPromocao}
            onPress={() => adicionar.mutate({ combo_id: combo.id })}
            disabled={adicionar.isPending}
            accessibilityLabel={`Adicionar ${combo.nome} ao carrinho`}
          >
            <Ionicons name="add" size={19} color={MARROM} />
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

// ---------- Aba: Favoritos ----------

function Favoritos({ clienteId, aoExplorar }: { clienteId: number; aoExplorar: () => void }) {
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
      <View style={styles.favoritosVazio}>
        <Text style={styles.titulo}>← Favoritos</Text>
        <Text style={styles.subtituloFavoritos}>Seus favoritos ficam aqui.</Text>
        <View style={styles.mensagemVaziaFavoritos}>
          <Ionicons name="heart-outline" size={22} color={COR} />
          <Text style={styles.tituloVazioFavoritos}>Nenhum favorito ainda</Text>
          <Text style={styles.subtituloFavoritos}>Toque no coração de um produto no cardápio para salvar aqui.</Text>
        </View>
        <Pressable style={styles.botaoExplorar} onPress={aoExplorar}>
          <Text style={styles.textoBotao}>Explorar cardápio</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.lista}>
      <Text style={styles.titulo}>Favoritos</Text>
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
  aoAbrirCardapio,
}: {
  clienteId: number;
  aoFinalizar: () => void;
  aoPix: (pedido: Pedido) => void;
  aoAbrirCardapio: () => void;
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
  const quantidadeItens = itens.reduce((soma, item) => soma + item.quantidade, 0);

  if (itens.length === 0) {
    return (
      <ScrollView
        contentContainerStyle={styles.carrinhoVazio}
        refreshControl={<RefreshControl refreshing={carrinho.isRefetching} onRefresh={() => carrinho.refetch()} />}
      >
        <Text style={styles.titulo}>Carrinho</Text>
        <View style={styles.iconeCarrinhoVazio}>
          <Ionicons name="cart-outline" size={38} color={MARROM} />
        </View>
        <Text style={styles.tituloCarrinhoVazio}>Seu carrinho está vazio</Text>
        <Text style={styles.vazio}>Explore o cardápio e adicione seus itens favoritos.</Text>
        <Pressable style={styles.botao} onPress={aoAbrirCardapio} accessibilityRole="button">
          <Text style={styles.textoBotao}>Ver cardápio</Text>
        </Pressable>
      </ScrollView>
    );
  }

  function confirmarLimpeza() {
    Alert.alert("Limpar carrinho", "Remover todos os itens?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Limpar", style: "destructive", onPress: () => limpar.mutate() },
    ]);
  }

  return (
    <ScrollView
      contentContainerStyle={styles.listaCarrinho}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={carrinho.isRefetching} onRefresh={() => carrinho.refetch()} />}
    >
      <View style={styles.cabecalhoCarrinho}>
        <Text style={styles.titulo}>Carrinho</Text>
        <Text style={styles.textoSecundario}>
          {quantidadeItens} {quantidadeItens === 1 ? "item" : "itens"}
        </Text>
      </View>
      {itens.map((item) => (
        <View key={item.id} style={styles.itemCarrinho}>
          <View style={styles.linhaItemCarrinho}>
            <View style={styles.detalheItemCarrinho}>
              <Text style={styles.nome}>{item.nome}</Text>
              <Text style={styles.textoSecundario}>{formatarPreco(item.preco_unitario)} cada</Text>
              {item.observacao ? <Text style={styles.obs}>Obs.: {item.observacao}</Text> : null}
            </View>
            <Text style={styles.preco}>{formatarPreco(item.subtotal)}</Text>
          </View>

          <View style={styles.linhaItemCarrinho}>
            <View style={styles.controlesQuantidade}>
              <Pressable
                style={styles.botaoQuantidade}
                disabled={ocupado || item.quantidade <= 1}
                onPress={() => mudar.mutate({ itemId: item.id, quantidade: item.quantidade - 1 })}
                accessibilityLabel={`Diminuir quantidade de ${item.nome}`}
              >
                <Text style={styles.textoQuantidade}>−</Text>
              </Pressable>
              <Text style={styles.numeroQuantidade}>{item.quantidade}</Text>
              <Pressable
                style={styles.botaoQuantidade}
                disabled={ocupado}
                onPress={() => mudar.mutate({ itemId: item.id, quantidade: item.quantidade + 1 })}
                accessibilityLabel={`Aumentar quantidade de ${item.nome}`}
              >
                <Text style={styles.textoQuantidade}>+</Text>
              </Pressable>
            </View>

            <Pressable
              style={styles.botaoRemoverItem}
              disabled={ocupado}
              onPress={() => remover.mutate(item.id)}
              accessibilityRole="button"
              accessibilityLabel={`Remover ${item.nome} do carrinho`}
            >
              <Ionicons name="trash-outline" size={16} color={COR} />
              <Text style={styles.remover}>Remover</Text>
            </Pressable>
          </View>
        </View>
      ))}

      <View style={styles.cupomBox}>
        <View style={styles.linha}>
          <Ionicons name="pricetag-outline" size={18} color={MARROM} />
          <Text style={[styles.nome, styles.tituloCupomCarrinho]}>Cupom de desconto</Text>
        </View>

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
            {cupons.error ? (
              <Text style={styles.erroCupom}>Não foi possível carregar seus cupons: {cupons.error.message}</Text>
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

      <Pressable style={styles.botaoContinuarComprando} onPress={aoAbrirCardapio} accessibilityRole="button">
        <Ionicons name="add" size={16} color={MARROM} />
        <Text style={styles.textoContinuarComprando}>Adicionar mais itens</Text>
      </Pressable>

      <FinalizarPedido clienteId={clienteId} total={totalFinal} cupom={aplicado?.codigo} aoConcluir={aoFinalizar} aoPix={aoPix} />

      <Pressable disabled={ocupado} onPress={confirmarLimpeza}>
        <Text style={styles.remover}>Limpar carrinho</Text>
      </Pressable>
    </ScrollView>
  );
}

function CabecalhoSubTela({ titulo, aoVoltar }: { titulo: string; aoVoltar: () => void }) {
  return (
    <View style={styles.cabecalhoSubTela}>
      <Pressable onPress={aoVoltar} style={styles.voltarSubTela} accessibilityRole="button">
        <Ionicons name="chevron-back" size={17} color={MARROM} />
        <Text style={styles.textoVoltarSubTela}>Perfil</Text>
      </Pressable>
      <Text style={styles.titulo}>{titulo}</Text>
    </View>
  );
}

function CuponsPerfil({
  clienteId,
  aoVoltar,
  aoIrCarrinho,
}: {
  clienteId: number;
  aoVoltar: () => void;
  aoIrCarrinho: () => void;
}) {
  const cupons = useCuponsDisponiveis(clienteId);

  if (cupons.isPending) return <Carregando texto="Carregando seus cupons..." />;
  if (cupons.error) return <Erro mensagem={cupons.error.message} aoTentarDeNovo={() => cupons.refetch()} />;

  const lista = cupons.data ?? [];
  return (
    <ScrollView contentContainerStyle={styles.lista}>
      <CabecalhoSubTela titulo="Cupons" aoVoltar={aoVoltar} />
      {lista.length === 0 ? (
        <View style={styles.centro}>
          <Ionicons name="pricetag-outline" size={34} color={MARROM} />
          <Text style={styles.vazio}>Você não tem cupons disponíveis no momento.</Text>
        </View>
      ) : (
        <>
          {lista.map((cupom) => {
            const validade = cupom.validade ? new Date(cupom.validade) : null;
            const validadeTexto =
              validade && !Number.isNaN(validade.getTime())
                ? `Válido até ${validade.toLocaleDateString("pt-BR")}`
                : "Sem data de validade";
            const desconto =
              cupom.tipo === "percentual" ? `${cupom.valor}% de desconto` : `${formatarPreco(cupom.valor)} de desconto`;

            return (
              <View key={cupom.codigo} style={styles.cardCupom}>
                <View style={styles.linha}>
                  <Text style={styles.codigoCupom}>{cupom.codigo}</Text>
                  <Ionicons name="ticket-outline" size={20} color={COR} />
                </View>
                <Text style={styles.tituloCupom}>{desconto}</Text>
                <Text style={styles.textoSecundario}>{cupom.descricao}</Text>
                {cupom.minimo > 0 ? (
                  <Text style={styles.textoSecundario}>Pedido mínimo de {formatarPreco(cupom.minimo)}</Text>
                ) : null}
                <Text style={styles.textoSecundario}>{validadeTexto}</Text>
              </View>
            );
          })}
          <Pressable style={styles.botao} onPress={aoIrCarrinho} accessibilityRole="button">
            <Text style={styles.textoBotao}>Usar cupom no carrinho</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

function FormasPagamentoPerfil({ aoVoltar }: { aoVoltar: () => void }) {
  return (
    <ScrollView contentContainerStyle={styles.lista}>
      <CabecalhoSubTela titulo="Formas de pagamento" aoVoltar={aoVoltar} />

      <View style={styles.cardPagamento}>
        <View style={styles.linhaPagamento}>
          <Ionicons name="qr-code-outline" size={22} color={MARROM} />
          <View style={styles.detalhePagamento}>
            <Text style={styles.nome}>Pix</Text>
            <Text style={styles.textoSecundario}>O QR Code aparece ao confirmar um pedido.</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardPagamento}>
        <View style={styles.linhaPagamento}>
          <Ionicons name="cash-outline" size={22} color={MARROM} />
          <View style={styles.detalhePagamento}>
            <Text style={styles.nome}>Dinheiro</Text>
            <Text style={styles.textoSecundario}>Você pode informar se precisa de troco ao fazer o pedido.</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardPagamento}>
        <View style={styles.linhaPagamento}>
          <Ionicons name="card-outline" size={22} color={MARROM} />
          <View style={styles.detalhePagamento}>
            <Text style={styles.nome}>Cartão</Text>
            <Text style={styles.textoSecundario}>Nenhum cartão cadastrado.</Text>
          </View>
        </View>
        <Text style={styles.avisoPagamento}>
          O cadastro seguro de cartões ficará disponível quando um provedor de pagamentos for integrado.
        </Text>
        <Pressable
          style={styles.botaoVazadoPagamento}
          onPress={() =>
            Alert.alert(
              "Cadastrar cartão",
              "O cadastro seguro de cartões estará disponível quando um provedor de pagamentos for integrado.",
            )
          }
          accessibilityRole="button"
        >
          <Text style={styles.textoBotaoVazadoPagamento}>Cadastrar cartão</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const COR = "#e63b08";
const MARROM = "#642600";

const styles = StyleSheet.create({
  areaSegura: { flex: 1, backgroundColor: MARROM },
  tela: { flex: 1, backgroundColor: "#fffaf5" },
  conteudo: { flex: 1 },
  topo: {
    minHeight: 76,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: MARROM,
  },
  logotipo: { paddingVertical: 2 },
  imagemLogotipo: { width: 52, height: 52 },
  acaoTopo: { position: "relative" },
  pontoNotificacao: { position: "absolute", right: -2, top: -1, width: 8, height: 8, borderRadius: 4, backgroundColor: "#eac58c" },
  acoesTopo: { flexDirection: "row", alignItems: "center", gap: 18 },
  navegacao: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    gap: 4,
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 8,
    backgroundColor: MARROM,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  itemNavegacao: { flex: 1, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 24 },
  itemNavegacaoAtivo: { flex: 1.65, flexDirection: "row", gap: 6, paddingHorizontal: 9, backgroundColor: "#fffaf5" },
  iconeNavegacao: { position: "relative" },
  contadorCarrinho: { position: "absolute", right: -4, top: -3, width: 7, height: 7, borderRadius: 4, backgroundColor: "#eac58c" },
  textoNavegacao: { color: MARROM, fontSize: 11, fontWeight: "700" },
  miniatura: { width: "100%", height: 130, borderRadius: 10 },
  favoritosVazio: { flex: 1, padding: 20, gap: 12, backgroundColor: "#fffaf5" },
  subtituloFavoritos: { color: "#786e67", fontSize: 12, lineHeight: 18 },
  mensagemVaziaFavoritos: { alignItems: "center", gap: 10, marginTop: 32, paddingHorizontal: 12 },
  tituloVazioFavoritos: { color: MARROM, fontSize: 15, fontWeight: "bold" },
  botaoExplorar: { backgroundColor: COR, padding: 13, borderRadius: 999, alignItems: "center", marginTop: 14 },
  tituloCardapio: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  favoritosLink: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 7, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: "#f0e2d5", backgroundColor: "#fff" },
  textoFavoritosLink: { color: MARROM, fontSize: 11, fontWeight: "600" },
  bannerDestaque: { height: 138, borderRadius: 14, overflow: "hidden", backgroundColor: MARROM, justifyContent: "flex-end" },
  imagemDestaque: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  sombraDestaque: { paddingHorizontal: 14, paddingVertical: 10, backgroundColor: "rgba(0,0,0,0.42)" },
  tituloDestaque: { color: "#fff", fontSize: 17, fontWeight: "bold" },
  textoDestaque: { color: "#fff", fontSize: 11 },
  chips: { flexGrow: 0 },
  chipsConteudo: { gap: 8, paddingVertical: 4 },
  chip: { paddingVertical: 7, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: "#f0e2d5", backgroundColor: "#fff" },
  chipAtivo: { backgroundColor: MARROM, borderColor: MARROM },
  textoChip: { color: MARROM, fontWeight: "600", fontSize: 12 },
  textoChipAtivo: { color: "#fff" },
  obs: { color: "#888", fontStyle: "italic" },
  cupomBox: { borderWidth: 1, borderColor: "#f0e2d5", borderRadius: 12, padding: 12, gap: 8, backgroundColor: "#fff" },
  campoCupom: { flex: 1, borderWidth: 1, borderColor: "#f0e2d5", borderRadius: 10, padding: 10, fontSize: 14, color: MARROM },
  cupomOk: { color: "#2e7d32", fontWeight: "bold" },
  erroCupom: { color: "#b00020" },
  cabecalhoSubTela: { gap: 5, marginBottom: 2 },
  voltarSubTela: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start" },
  textoVoltarSubTela: { color: MARROM, fontSize: 12, fontWeight: "600" },
  cardCupom: { padding: 14, borderRadius: 12, borderWidth: 1, borderColor: "#f0e2d5", backgroundColor: "#fff", gap: 5 },
  codigoCupom: { color: MARROM, fontSize: 14, fontWeight: "800", letterSpacing: 0.5 },
  tituloCupom: { color: COR, fontSize: 15, fontWeight: "700" },
  textoSecundario: { color: "#786e67", fontSize: 12, lineHeight: 17 },
  cardPagamento: { padding: 14, borderRadius: 12, borderWidth: 1, borderColor: "#f0e2d5", backgroundColor: "#fff", gap: 10 },
  linhaPagamento: { flexDirection: "row", alignItems: "center", gap: 12 },
  detalhePagamento: { flex: 1, gap: 3 },
  avisoPagamento: { color: "#786e67", fontSize: 12, lineHeight: 17 },
  botaoVazadoPagamento: { borderWidth: 1, borderColor: "#efd9c5", padding: 11, borderRadius: 10, alignItems: "center" },
  textoBotaoVazadoPagamento: { color: MARROM, fontWeight: "bold", fontSize: 13 },
  cuponsLista: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chipCupom: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: COR, borderStyle: "dashed" },
  textoChipCupom: { color: COR, fontWeight: "600" },
  listaCarrinho: { padding: 16, paddingTop: 14, gap: 12, paddingBottom: 24 },
  carrinhoVazio: { flexGrow: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 10 },
  iconeCarrinhoVazio: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8e9da",
    marginTop: 12,
  },
  tituloCarrinhoVazio: { color: MARROM, fontSize: 17, fontWeight: "bold" },
  cabecalhoCarrinho: { gap: 2 },
  itemCarrinho: { padding: 14, borderRadius: 12, borderWidth: 1, borderColor: "#f0e2d5", backgroundColor: "#fff", gap: 12 },
  linhaItemCarrinho: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 },
  detalheItemCarrinho: { flex: 1, gap: 4 },
  controlesQuantidade: { flexDirection: "row", alignItems: "center", gap: 12 },
  botaoRemoverItem: { flexDirection: "row", alignItems: "center", gap: 4, padding: 5 },
  tituloCupomCarrinho: { flex: 1 },
  botaoContinuarComprando: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, padding: 8 },
  textoContinuarComprando: { color: MARROM, fontSize: 13, fontWeight: "600" },
  lista: { padding: 16, paddingTop: 14, gap: 12, paddingBottom: 24 },
  listaPromocoes: { padding: 16, paddingTop: 16, gap: 12, paddingBottom: 24 },
  centro: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 8 },
  titulo: { fontSize: 20, fontWeight: "bold", marginTop: 4, color: MARROM },
  erro: { color: "#b00020", textAlign: "center" },
  vazio: { textAlign: "center", fontSize: 14, color: "#786e67", lineHeight: 20 },
  card: { padding: 12, borderRadius: 12, borderWidth: 1, borderColor: "#f0e2d5", backgroundColor: "#fff", gap: 6 },
  cardProduto: {
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f0e2d5",
    backgroundColor: "#fff",
  },
  linhaProduto: { minHeight: 72, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  infoProduto: { flex: 1, gap: 3 },
  botaoAdicionarEspeto: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 38,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: COR,
  },
  textoAdicionarEspeto: { color: "#fff", fontSize: 13, fontWeight: "700" },
  descricaoProduto: { color: "#786e67", fontSize: 11 },
  thumbProdutoContainer: { position: "relative" },
  thumbProduto: { width: 72, height: 72, borderRadius: 12 },
  thumbSemImagem: { width: 72, height: 72, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: "#f8e9da" },
  botaoFavorito: { position: "absolute", right: -4, top: -5, width: 27, height: 27, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  tituloPromocoes: { textAlign: "center", color: MARROM, fontSize: 16, fontWeight: "bold", paddingHorizontal: 8, marginBottom: 4 },
  bannerPromocao: { minHeight: 205, borderRadius: 16, overflow: "hidden", justifyContent: "flex-end", backgroundColor: MARROM, padding: 14 },
  imagemBannerPromocao: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  conteudoBannerPromocao: { alignItems: "center", paddingBottom: 9, backgroundColor: "rgba(0,0,0,0.4)" },
  seloPromocao: { color: "#f4d8ac", fontSize: 10, fontWeight: "bold" },
  nomeBannerPromocao: { color: "#fff", fontSize: 20, fontWeight: "bold", marginTop: 4 },
  descricaoBannerPromocao: { color: "#fff", fontSize: 12, textAlign: "center" },
  precoBannerPromocao: { color: "#fff", fontSize: 16, fontWeight: "bold", marginTop: 5 },
  botaoQuero: { alignSelf: "center", backgroundColor: "#f0cf9a", paddingHorizontal: 18, paddingVertical: 9, borderRadius: 20 },
  textoBotaoQuero: { color: MARROM, fontWeight: "bold", fontSize: 12 },
  cardPromocao: { flexDirection: "row", alignItems: "center", gap: 9, padding: 9, borderRadius: 14, backgroundColor: "#fff" },
  imagemCardPromocao: { width: 58, height: 58, borderRadius: 11 },
  infoCardPromocao: { flex: 1, gap: 3 },
  nomePromocao: { color: MARROM, fontWeight: "bold", fontSize: 13 },
  descricaoPromocao: { color: "#786e67", fontSize: 10 },
  precoPromocao: { color: MARROM, fontWeight: "bold", fontSize: 12 },
  adicionarPromocao: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#f0cf9a" },
  linha: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  nome: { fontSize: 15, fontWeight: "700", flexShrink: 1, color: MARROM },
  preco: { fontWeight: "bold", color: COR },
  coracao: { fontSize: 22 },
  botao: { backgroundColor: COR, padding: 14, borderRadius: 999, alignItems: "center", marginTop: 8 },
  botaoPequeno: { backgroundColor: COR, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999 },
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
  textoQuantidade: { color: MARROM, fontSize: 20, fontWeight: "bold" },
  numeroQuantidade: { fontSize: 18, fontWeight: "600", minWidth: 24, textAlign: "center" },
  remover: { color: COR, fontWeight: "600", textAlign: "center", marginTop: 4 },
  totalLinha: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4, padding: 12, borderWidth: 1, borderRadius: 12, borderColor: "#f0e2d5", backgroundColor: "#fff" },
});
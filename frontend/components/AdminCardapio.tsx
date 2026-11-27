// Arquivo: frontend/components/AdminCardapio.tsx
// Administrador: cadastrar e editar espetos, combos e categorias.

import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import {
  useAdminCardapio,
  useAdminCriarCategoria,
  useAdminExcluirCategoria,
  useAdminExcluirProduto,
  useAdminSalvarProduto,
} from "../hooks/useAdmin";
import { formatarPreco, type Categoria, type ComboAdmin, type EspetoAdmin } from "../services/api";
import { lerNumero } from "../services/numeros";

type Editor = {
  tipo: "espeto" | "combo";
  produto: EspetoAdmin | ComboAdmin | null;
  categoriaInicial?: number | null;
};

export default function AdminCardapio() {
  const cardapio = useAdminCardapio();
  const salvar = useAdminSalvarProduto();
  const criarCategoria = useAdminCriarCategoria();
  const excluirCategoria = useAdminExcluirCategoria();
  const excluirProduto = useAdminExcluirProduto();

  const [editor, setEditor] = useState<Editor | null>(null);
  const [novaCategoria, setNovaCategoria] = useState("");
  const [novaCategoriaVisivel, setNovaCategoriaVisivel] = useState(true);

  if (editor) {
    return (
      <FormProduto
        editor={editor}
        categorias={cardapio.data?.categorias ?? []}
        aoFechar={() => setEditor(null)}
      />
    );
  }

  if (cardapio.isPending) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (cardapio.error || !cardapio.data) {
    return (
      <View style={styles.centro}>
        <Text style={styles.erro}>{cardapio.error?.message ?? "Não foi possível carregar."}</Text>
        <Pressable style={styles.botao} onPress={() => cardapio.refetch()}>
          <Text style={styles.textoBotao}>Tentar de novo</Text>
        </Pressable>
      </View>
    );
  }

  const { espetos, combos, categorias } = cardapio.data;
  const nomeCategoria = (id: number | null) => categorias.find((c) => c.id === id)?.nome;
  const categoriaBebidas = categorias.find((categoria) => categoria.nome.trim().toLocaleLowerCase("pt-BR") === "bebidas");
  const bebidas = espetos.filter((espeto) => espeto.categoria_id === categoriaBebidas?.id);
  const outrosEspetos = espetos.filter((espeto) => espeto.categoria_id !== categoriaBebidas?.id);

  function alternarAtivo(tipo: "espeto" | "combo", produto: EspetoAdmin | ComboAdmin) {
    salvar.mutate({ tipo, id: produto.id, dados: { ativo: produto.ativo === false } });
  }

  function confirmarExclusao(c: Categoria) {
    Alert.alert("Excluir categoria", `Excluir "${c.nome}"? Os espetos dela ficam sem categoria.`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: () => excluirCategoria.mutate(c.id),
      },
    ]);
  }

  function confirmarExclusaoProduto(tipo: "espeto" | "combo", produto: EspetoAdmin | ComboAdmin) {
    Alert.alert(
      `Excluir ${tipo === "espeto" ? "espeto" : "combo"}`,
      `Tem certeza que deseja excluir "${produto.nome}"? O item será removido dos carrinhos, mas continuará aparecendo no histórico dos pedidos já feitos.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => excluirProduto.mutate({ tipo, id: produto.id }),
        },
      ],
    );
  }

  async function adicionarCategoria() {
    const nome = novaCategoria.trim();
    if (!nome) return;
    try {
      await criarCategoria.mutateAsync({ nome, visivel: novaCategoriaVisivel });
      setNovaCategoria("");
      setNovaCategoriaVisivel(true);
    } catch {
      // aviso de erro já mostrado
    }
  }

  function Linha({ tipo, produto, extra }: { tipo: "espeto" | "combo"; produto: EspetoAdmin | ComboAdmin; extra?: string }) {
    const ativo = produto.ativo !== false;
    return (
      <View style={[styles.card, !ativo && styles.cardInativo]}>
        <View style={styles.linha}>
          <Text style={styles.nome}>{produto.nome}</Text>
          <Text style={styles.preco}>{formatarPreco(produto.preco)}</Text>
        </View>
        <Text style={styles.detalhe}>
          {ativo ? "✅ À venda" : "⛔ Desativado"}
          {extra ? ` • ${extra}` : ""}
          {produto.imagem ? " • 🖼️ com foto" : ""}
        </Text>
        <View style={styles.botoes}>
          <Pressable style={styles.botaoVazado} onPress={() => setEditor({ tipo, produto })}>
            <Text style={styles.textoVazado}>Editar</Text>
          </Pressable>
          <Pressable style={styles.botaoVazado} disabled={salvar.isPending} onPress={() => alternarAtivo(tipo, produto)}>
            <Text style={styles.textoVazado}>{ativo ? "Desativar" : "Ativar"}</Text>
          </Pressable>
          <Pressable
            style={styles.botaoExcluir}
            disabled={excluirProduto.isPending}
            onPress={() => confirmarExclusaoProduto(tipo, produto)}
          >
            <Text style={styles.textoExcluir}>Excluir</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.lista} keyboardShouldPersistTaps="handled">
      <Text style={styles.titulo}>Espetos</Text>
      {outrosEspetos.map((e) => (
        <Linha key={e.id} tipo="espeto" produto={e} extra={nomeCategoria(e.categoria_id) ?? "sem categoria"} />
      ))}
      <Pressable style={styles.botao} onPress={() => setEditor({ tipo: "espeto", produto: null })}>
        <Text style={styles.textoBotao}>+ Novo espeto</Text>
      </Pressable>

      <Text style={styles.titulo}>Bebidas</Text>
      {bebidas.length > 0 ? (
        bebidas.map((bebida) => <Linha key={bebida.id} tipo="espeto" produto={bebida} />)
      ) : (
        <Text style={styles.detalhe}>Nenhuma bebida cadastrada.</Text>
      )}
      <Pressable
        style={[styles.botao, !categoriaBebidas && styles.desativado]}
        disabled={!categoriaBebidas}
        onPress={() =>
          setEditor({ tipo: "espeto", produto: null, categoriaInicial: categoriaBebidas?.id ?? null })
        }
      >
        <Text style={styles.textoBotao}>+ Nova bebida</Text>
      </Pressable>

      <Text style={styles.titulo}>Combos</Text>
      {combos.map((c) => (
        <Linha key={c.id} tipo="combo" produto={c} />
      ))}
      <Pressable style={styles.botao} onPress={() => setEditor({ tipo: "combo", produto: null })}>
        <Text style={styles.textoBotao}>+ Novo combo</Text>
      </Pressable>

      <Text style={styles.titulo}>Categorias</Text>
      <Text style={styles.detalhe}>Crie categorias para organizar os espetos ou exclua as que não usa mais.</Text>
      {categorias.map((c) => (
        <View key={c.id} style={styles.linhaCategoria}>
          <View style={styles.infoCategoria}>
            <Text style={styles.nome}>{c.nome}</Text>
            <Text style={styles.detalhe}>{c.visivel ? "Visível no cardápio" : "Oculta no cardápio"}</Text>
          </View>
          <Pressable
            onPress={() => confirmarExclusao(c)}
            disabled={excluirCategoria.isPending}
            accessibilityRole="button"
            accessibilityLabel={`Excluir categoria ${c.nome}`}
          >
            <Text style={styles.excluir}>Excluir</Text>
          </Pressable>
        </View>
      ))}
      <Text style={styles.rotulo}>Criar categoria</Text>
      <Text style={styles.detalhe}>A categoria será exibida como filtro no cardápio se estiver visível.</Text>
      <TextInput
        style={styles.campo}
        value={novaCategoria}
        onChangeText={setNovaCategoria}
        placeholder="Nome da categoria"
        maxLength={60}
      />
      <Text style={styles.rotulo}>Visível no cardápio?</Text>
      <View style={styles.botoes}>
        <Pressable
          style={[styles.chip, novaCategoriaVisivel && styles.chipAtivo]}
          onPress={() => setNovaCategoriaVisivel(true)}
          accessibilityRole="button"
          accessibilityState={{ selected: novaCategoriaVisivel }}
        >
          <Text style={[styles.textoChip, novaCategoriaVisivel && styles.textoChipAtivo]}>Sim, exibir</Text>
        </Pressable>
        <Pressable
          style={[styles.chip, !novaCategoriaVisivel && styles.chipAtivo]}
          onPress={() => setNovaCategoriaVisivel(false)}
          accessibilityRole="button"
          accessibilityState={{ selected: !novaCategoriaVisivel }}
        >
          <Text style={[styles.textoChip, !novaCategoriaVisivel && styles.textoChipAtivo]}>Não, ocultar</Text>
        </Pressable>
      </View>
      <Pressable
        style={[styles.botao, (criarCategoria.isPending || !novaCategoria.trim()) && styles.desativado]}
        onPress={adicionarCategoria}
        disabled={criarCategoria.isPending || !novaCategoria.trim()}
        accessibilityRole="button"
      >
        {criarCategoria.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.textoBotao}>
            Confirmar e criar categoria {novaCategoriaVisivel ? "visível" : "oculta"}
          </Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

function FormProduto({
  editor,
  categorias,
  aoFechar,
}: {
  editor: Editor;
  categorias: Categoria[];
  aoFechar: () => void;
}) {
  const { tipo, produto } = editor;
  const ehEspeto = tipo === "espeto";
  const salvar = useAdminSalvarProduto();

  const espeto = ehEspeto ? (produto as EspetoAdmin | null) : null;
  const combo = !ehEspeto ? (produto as ComboAdmin | null) : null;

  const [nome, setNome] = useState(produto?.nome ?? "");
  const [descricao, setDescricao] = useState(produto?.descricao ?? "");
  const [preco, setPreco] = useState(produto ? String(produto.preco).replace(".", ",") : "");
  const [precoOriginal, setPrecoOriginal] = useState(combo?.preco_original ? String(combo.preco_original).replace(".", ",") : "");
  const [imagem, setImagem] = useState(produto?.imagem ?? "");
  const [categoriaId, setCategoriaId] = useState<number | null>(
    espeto?.categoria_id ?? editor.categoriaInicial ?? null,
  );
  const [erro, setErro] = useState<string | null>(null);

  async function salvarProduto() {
    setErro(null);
    const valor = lerNumero(preco);
    if (!nome.trim()) return setErro("Informe o nome.");
    if (valor === null || valor < 0) return setErro("Informe um preço válido (ex.: 9,90).");

    try {
      await salvar.mutateAsync({
        tipo,
        id: produto?.id,
        dados: {
          nome: nome.trim(),
          descricao: descricao.trim(),
          preco: valor,
          imagem: imagem.trim(),
          ...(ehEspeto ? { categoria_id: categoriaId } : { preco_original: lerNumero(precoOriginal) }),
        },
      });
      aoFechar();
    } catch {
      // aviso de erro já mostrado pelo hook
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.lista} keyboardShouldPersistTaps="handled">
      <Pressable onPress={aoFechar}>
        <Text style={styles.voltar}>← Cancelar</Text>
      </Pressable>
      <Text style={styles.titulo}>
        {produto
          ? `Editar ${ehEspeto ? "espeto" : "combo"}`
          : editor.categoriaInicial != null
            ? "Nova bebida"
            : `Novo ${ehEspeto ? "espeto" : "combo"}`}
      </Text>

      <Text style={styles.rotulo}>Nome</Text>
      <TextInput style={styles.campo} value={nome} onChangeText={setNome} />

      <Text style={styles.rotulo}>Descrição</Text>
      <TextInput style={[styles.campo, { minHeight: 70 }]} value={descricao} onChangeText={setDescricao} multiline textAlignVertical="top" />

      <Text style={styles.rotulo}>Preço (R$)</Text>
      <TextInput style={styles.campo} value={preco} onChangeText={setPreco} keyboardType="decimal-pad" placeholder="9,90" />

      {!ehEspeto ? (
        <>
          <Text style={styles.rotulo}>Preço original (R$, opcional: aparece riscado)</Text>
          <TextInput style={styles.campo} value={precoOriginal} onChangeText={setPrecoOriginal} keyboardType="decimal-pad" />
        </>
      ) : null}

      <Text style={styles.rotulo}>Link da foto (opcional)</Text>
      <TextInput
        style={styles.campo}
        value={imagem}
        onChangeText={setImagem}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        placeholder="https://..."
      />

      {ehEspeto ? (
        <>
          <Text style={styles.rotulo}>Categoria</Text>
          <View style={styles.botoes}>
            <Pressable style={[styles.chip, categoriaId === null && styles.chipAtivo]} onPress={() => setCategoriaId(null)}>
              <Text style={[styles.textoChip, categoriaId === null && styles.textoChipAtivo]}>Nenhuma</Text>
            </Pressable>
            {categorias.map((c) => (
              <Pressable key={c.id} style={[styles.chip, categoriaId === c.id && styles.chipAtivo]} onPress={() => setCategoriaId(c.id)}>
                <Text style={[styles.textoChip, categoriaId === c.id && styles.textoChipAtivo]}>{c.nome}</Text>
              </Pressable>
            ))}
          </View>
        </>
      ) : null}

      {erro ? <Text style={styles.erro}>{erro}</Text> : null}

      <Pressable style={[styles.botao, salvar.isPending && styles.desativado]} onPress={salvarProduto} disabled={salvar.isPending}>
        {salvar.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.textoBotao}>Salvar</Text>}
      </Pressable>
    </ScrollView>
  );
}

const COR = "#d84315";

const styles = StyleSheet.create({
  lista: { padding: 16, paddingTop: 4, gap: 8, paddingBottom: 40 },
  centro: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 8 },
  titulo: { fontSize: 22, fontWeight: "bold", marginTop: 12 },
  voltar: { color: COR, fontWeight: "600", fontSize: 16 },
  erro: { color: "#b00020" },
  rotulo: { fontWeight: "600", marginTop: 6 },
  campo: { borderWidth: 1, borderColor: "#ccc", borderRadius: 10, padding: 10, fontSize: 16 },
  card: { padding: 12, borderRadius: 12, borderWidth: 1, borderColor: "#ddd", gap: 4 },
  cardInativo: { opacity: 0.55 },
  linha: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  linhaCategoria: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  infoCategoria: { flex: 1, gap: 2 },
  nome: { fontSize: 17, fontWeight: "600", flexShrink: 1 },
  preco: { fontWeight: "bold" },
  detalhe: { color: "#888" },
  excluir: { color: "#b00020", fontWeight: "600" },
  botoes: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  botao: { backgroundColor: COR, padding: 14, borderRadius: 10, alignItems: "center", marginTop: 4 },
  botaoPequeno: { backgroundColor: COR, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8 },
  botaoVazado: { borderWidth: 1, borderColor: COR, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 },
  botaoExcluir: { borderWidth: 1, borderColor: "#b00020", paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 },
  textoVazado: { color: COR, fontWeight: "bold" },
  textoExcluir: { color: "#b00020", fontWeight: "bold" },
  desativado: { opacity: 0.6 },
  textoBotao: { color: "#fff", fontWeight: "bold" },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: COR },
  chipAtivo: { backgroundColor: COR },
  textoChip: { color: COR, fontWeight: "600" },
  textoChipAtivo: { color: "#fff" },
});

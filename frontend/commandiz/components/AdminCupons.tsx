// Arquivo: frontend/commandiz/components/AdminCupons.tsx
// Administrador: criar cupons de desconto e ativar/desativar.

import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { useAdminAtualizarCupom, useAdminCriarCupom, useAdminCupons } from "../hooks/useAdmin";
import { formatarPreco } from "../services/api";
import { lerNumero } from "../services/numeros";

function formatarValidade(iso: string | null): string {
  if (!iso) return "sem validade";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const dois = (n: number) => String(n).padStart(2, "0");
  return `até ${dois(d.getDate())}/${dois(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export default function AdminCupons() {
  const cupons = useAdminCupons();
  const criar = useAdminCriarCupom();
  const atualizar = useAdminAtualizarCupom();

  const [criando, setCriando] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tipo, setTipo] = useState<"percentual" | "valor">("percentual");
  const [valor, setValor] = useState("");
  const [minimo, setMinimo] = useState("");
  const [dias, setDias] = useState("");
  const [limite, setLimite] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  async function salvar() {
    setErro(null);
    const v = lerNumero(valor);
    if (codigo.trim().length < 3) return setErro("O código precisa ter pelo menos 3 caracteres.");
    if (v === null || v <= 0) return setErro("Informe o valor do desconto.");
    if (tipo === "percentual" && v > 100) return setErro("O percentual não pode passar de 100.");

    try {
      await criar.mutateAsync({
        codigo: codigo.trim().toUpperCase(),
        descricao: descricao.trim(),
        tipo,
        valor: v,
        minimo: lerNumero(minimo) ?? 0,
        validade_dias: lerNumero(dias) ? Math.round(lerNumero(dias) as number) : undefined,
        limite_usos: lerNumero(limite) ? Math.round(lerNumero(limite) as number) : undefined,
      });
      setCriando(false);
      setCodigo("");
      setDescricao("");
      setValor("");
      setMinimo("");
      setDias("");
      setLimite("");
    } catch {
      // aviso de erro já mostrado pelo hook
    }
  }

  if (criando) {
    return (
      <ScrollView contentContainerStyle={styles.lista} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => setCriando(false)}>
          <Text style={styles.voltar}>← Cancelar</Text>
        </Pressable>
        <Text style={styles.titulo}>Novo cupom</Text>

        <Text style={styles.rotulo}>Código (o cliente digita)</Text>
        <TextInput style={styles.campo} value={codigo} onChangeText={(t) => setCodigo(t.toUpperCase())} autoCapitalize="characters" placeholder="NATAL10" />

        <Text style={styles.rotulo}>Descrição</Text>
        <TextInput style={styles.campo} value={descricao} onChangeText={setDescricao} placeholder="10% de desconto" />

        <Text style={styles.rotulo}>Tipo de desconto</Text>
        <View style={styles.botoes}>
          <Pressable style={[styles.chip, tipo === "percentual" && styles.chipAtivo]} onPress={() => setTipo("percentual")}>
            <Text style={[styles.textoChip, tipo === "percentual" && styles.textoChipAtivo]}>Percentual (%)</Text>
          </Pressable>
          <Pressable style={[styles.chip, tipo === "valor" && styles.chipAtivo]} onPress={() => setTipo("valor")}>
            <Text style={[styles.textoChip, tipo === "valor" && styles.textoChipAtivo]}>Valor (R$)</Text>
          </Pressable>
        </View>

        <Text style={styles.rotulo}>{tipo === "percentual" ? "Percentual de desconto" : "Valor do desconto (R$)"}</Text>
        <TextInput style={styles.campo} value={valor} onChangeText={setValor} keyboardType="decimal-pad" />

        <Text style={styles.rotulo}>Pedido mínimo (R$, opcional)</Text>
        <TextInput style={styles.campo} value={minimo} onChangeText={setMinimo} keyboardType="decimal-pad" />

        <Text style={styles.rotulo}>Vale por quantos dias (opcional)</Text>
        <TextInput style={styles.campo} value={dias} onChangeText={setDias} keyboardType="number-pad" />

        <Text style={styles.rotulo}>Limite de usos no total (opcional)</Text>
        <TextInput style={styles.campo} value={limite} onChangeText={setLimite} keyboardType="number-pad" />

        {erro ? <Text style={styles.erro}>{erro}</Text> : null}

        <Pressable style={[styles.botao, criar.isPending && styles.desativado]} onPress={salvar} disabled={criar.isPending}>
          {criar.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.textoBotao}>Criar cupom</Text>}
        </Pressable>
      </ScrollView>
    );
  }

  if (cupons.isPending) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (cupons.error) {
    return (
      <View style={styles.centro}>
        <Text style={styles.erro}>{cupons.error.message}</Text>
        <Pressable style={styles.botao} onPress={() => cupons.refetch()}>
          <Text style={styles.textoBotao}>Tentar de novo</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.lista}>
      <Pressable style={styles.botao} onPress={() => setCriando(true)}>
        <Text style={styles.textoBotao}>+ Novo cupom</Text>
      </Pressable>

      {(cupons.data ?? []).map((c) => (
        <View key={c.id} style={[styles.card, !c.ativo && styles.cardInativo]}>
          <View style={styles.linha}>
            <Text style={styles.nome}>{c.codigo}</Text>
            <Text style={styles.preco}>{c.tipo === "percentual" ? `${c.valor}%` : formatarPreco(c.valor)}</Text>
          </View>
          <Text style={styles.detalhe}>{c.descricao || "sem descrição"}</Text>
          <Text style={styles.detalhe}>
            Mínimo {formatarPreco(c.minimo)} • {formatarValidade(c.validade)} • usos {c.usos}
            {c.limite_usos ? `/${c.limite_usos}` : ""}
            {c.cliente_id ? " • exclusivo de um cliente" : ""}
          </Text>
          <View style={styles.botoes}>
            <Pressable
              style={styles.botaoVazado}
              disabled={atualizar.isPending}
              onPress={() => atualizar.mutate({ id: c.id, ativo: !c.ativo })}
            >
              <Text style={styles.textoVazado}>{c.ativo ? "Desativar" : "Ativar"}</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const COR = "#d84315";

const styles = StyleSheet.create({
  lista: { padding: 16, paddingTop: 4, gap: 8, paddingBottom: 40 },
  centro: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 8 },
  titulo: { fontSize: 22, fontWeight: "bold", marginTop: 8 },
  voltar: { color: COR, fontWeight: "600", fontSize: 16 },
  erro: { color: "#b00020" },
  rotulo: { fontWeight: "600", marginTop: 6 },
  campo: { borderWidth: 1, borderColor: "#ccc", borderRadius: 10, padding: 10, fontSize: 16 },
  card: { padding: 12, borderRadius: 12, borderWidth: 1, borderColor: "#ddd", gap: 4 },
  cardInativo: { opacity: 0.55 },
  linha: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  nome: { fontSize: 17, fontWeight: "bold" },
  preco: { fontWeight: "bold", color: COR },
  detalhe: { color: "#888" },
  botoes: { flexDirection: "row", gap: 8, marginTop: 4 },
  botao: { backgroundColor: COR, padding: 14, borderRadius: 10, alignItems: "center", marginTop: 4 },
  botaoVazado: { borderWidth: 1, borderColor: COR, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 },
  textoVazado: { color: COR, fontWeight: "bold" },
  desativado: { opacity: 0.6 },
  textoBotao: { color: "#fff", fontWeight: "bold" },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: COR },
  chipAtivo: { backgroundColor: COR },
  textoChip: { color: COR, fontWeight: "600" },
  textoChipAtivo: { color: "#fff" },
});

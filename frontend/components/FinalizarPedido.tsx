// Botão "Finalizar pedido": escolhe a forma de pagamento (simulada) e fecha o pedido.
// No pagamento em DINHEIRO: pergunta se precisa de troco e calcula o troco.

import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { useFecharPedido } from "../hooks/useCommandiz";
import { formatarPreco, type FormaPagamento, type NovoPedido, type Pedido } from "../services/api";

type FormaEscolhida = "pix" | "cartao_credito" | "cartao_debito" | "dinheiro";

const OPCOES: { valor: FormaEscolhida; titulo: string }[] = [
  { valor: "pix", titulo: "Pix" },
  { valor: "cartao_credito", titulo: "Cartão de crédito" },
  { valor: "cartao_debito", titulo: "Cartão de débito" },
  { valor: "dinheiro", titulo: "Dinheiro" },
];

// "50", "50,5" ou "R$ 50.50" viram número. Se não der para entender, devolve null.
function lerValor(texto: string): number | null {
  const limpo = texto.replace(/[^0-9,.]/g, "").replace(",", ".");
  if (!limpo) return null;
  const numero = Number(limpo);
  if (!Number.isFinite(numero) || numero <= 0) return null;
  return Math.round(numero * 100) / 100;
}

// Compara valores em centavos para evitar erros de arredondamento.
function centavos(valor: number): number {
  return Math.round(valor * 100);
}

function CaixaMarcacao({
  titulo,
  marcado,
  aoTocar,
  desativado,
}: {
  titulo: string;
  marcado: boolean;
  aoTocar: () => void;
  desativado?: boolean;
}) {
  return (
    <Pressable style={styles.checkLinha} onPress={aoTocar} disabled={desativado} hitSlop={6}>
      <View style={[styles.caixinha, marcado && styles.caixinhaMarcada]}>
        {marcado ? <Text style={styles.marca}>✓</Text> : null}
      </View>
      <Text style={styles.textoCheck}>{titulo}</Text>
    </Pressable>
  );
}

type Props = {
  clienteId: number;
  total: number;
  cupom?: string;
  aoConcluir: () => void;
  aoPix?: (pedido: Pedido) => void; // mostra a tela do QR Code
};

export default function FinalizarPedido({ clienteId, total, cupom, aoConcluir, aoPix }: Props) {
  const [aberto, setAberto] = useState(false);
  const [forma, setForma] = useState<FormaEscolhida | null>(null);
  const [precisaTroco, setPrecisaTroco] = useState<boolean | null>(null);
  const [textoValor, setTextoValor] = useState("");
  const fechar = useFecharPedido(clienteId);

  const valor = lerValor(textoValor);
  const valorSuficiente = valor !== null && centavos(valor) >= centavos(total);
  const trocoCalculado = valor !== null ? (centavos(valor) - centavos(total)) / 100 : null;

  function escolherForma(nova: FormaEscolhida) {
    setForma(nova);
    if (nova !== "dinheiro") {
      setPrecisaTroco(null);
      setTextoValor("");
    }
  }

  function marcarTroco(sim: boolean) {
    setPrecisaTroco(sim);
    if (!sim) setTextoValor(""); // sem troco = paga o valor exato
  }

  async function confirmar() {
    if (!forma) {
      Alert.alert("Pagamento", "Escolha a forma de pagamento.");
      return;
    }

    if (forma === "cartao_credito" || forma === "cartao_debito") {
      Alert.alert("Cartão não cadastrado", "Cadastre um cartão para continuar. O app ainda não coleta nem salva dados de cartão.");
      return;
    }

    const formaPagamento: FormaPagamento = forma === "pix" ? "pix" : "dinheiro";
    const dados: NovoPedido = { forma_pagamento: formaPagamento, cupom };

    if (forma === "dinheiro") {
      if (precisaTroco === null) {
        Alert.alert("Dinheiro", "Informe se você precisa de troco.");
        return;
      }
      dados.precisa_troco = precisaTroco;

      if (precisaTroco) {
        if (valor === null) {
          Alert.alert("Dinheiro", "Digite com quanto você vai pagar.");
          return;
        }
        if (!valorSuficiente) {
          Alert.alert("Dinheiro", `O valor precisa ser pelo menos ${formatarPreco(total)}.`);
          return;
        }
        dados.valor_pago = valor;
      }
    }

    try {
      const pedido = await fechar.mutateAsync(dados);

      // Pix: abre a tela com o QR Code em vez do aviso simples
      if (pedido.forma_pagamento === "pix" && pedido.pix_copia_cola && aoPix) {
        setAberto(false);
        setForma(null);
        setPrecisaTroco(null);
        setTextoValor("");
        aoPix(pedido);
        return;
      }

      if (pedido.forma_pagamento === "pix") {
        Alert.alert(
          "QR Code indisponível",
          "O pedido foi criado, mas o código Pix não foi recebido. Não refaça o pedido; consulte seus pedidos ou fale com a espetaria.",
          [{ text: "Ver pedidos", onPress: aoConcluir }],
        );
        return;
      }

      let mensagem = `Pedido #${pedido.id} no valor de ${formatarPreco(pedido.total)}.`;
      if (pedido.troco && pedido.troco > 0) {
        mensagem += `\nTroco a receber: ${formatarPreco(pedido.troco)}.`;
      }
      Alert.alert("Pedido realizado! 🎉", mensagem);

      setAberto(false);
      setForma(null);
      setPrecisaTroco(null);
      setTextoValor("");
      aoConcluir();
    } catch {
      // O aviso de erro já aparece sozinho (veja useFecharPedido).
    }
  }

  if (!aberto) {
    return (
      <Pressable style={styles.botao} onPress={() => setAberto(true)}>
        <Text style={styles.textoBotao}>Finalizar pedido</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.caixa}>
      <Text style={styles.titulo}>Forma de pagamento</Text>

      <View style={styles.opcoes}>
        {OPCOES.map((opcao) => (
          <Pressable
            key={opcao.valor}
            style={styles.opcao}
            onPress={() => escolherForma(opcao.valor)}
            disabled={fechar.isPending}
          >
            <View style={[styles.radio, forma === opcao.valor && styles.radioAtivo]}>
              {forma === opcao.valor ? <View style={styles.radioPonto} /> : null}
            </View>
            <Text style={styles.textoOpcao}>{opcao.titulo}</Text>
          </Pressable>
        ))}
      </View>

      {forma === "cartao_credito" || forma === "cartao_debito" ? (
        <View style={styles.cartaoVazio}>
          <Text style={styles.cartaoTitulo}>Nenhum cartão cadastrado</Text>
          <Text style={styles.aviso}>Cadastre um cartão para selecioná-lo. Por enquanto, o app não coleta nem salva dados de cartão.</Text>
          <Pressable
            style={styles.botaoVazado}
            onPress={() =>
              Alert.alert(
                "Cadastrar cartão",
                "O cadastro seguro de cartões estará disponível quando um provedor de pagamentos for integrado.",
              )
            }
          >
            <Text style={styles.textoBotaoVazado}>Cadastrar cartão</Text>
          </Pressable>
        </View>
      ) : null}

      {forma === "dinheiro" ? (
        <View style={styles.blocoDinheiro}>
          <Text style={styles.linhaTotal}>Total do pedido: {formatarPreco(total)}</Text>

          <Text style={styles.rotulo}>Com quanto você vai pagar?</Text>
          <TextInput
            style={[styles.campo, precisaTroco === false && styles.campoDesativado]}
            value={textoValor}
            onChangeText={(texto) => setTextoValor(texto.replace(/[^0-9,.]/g, ""))}
            placeholder={precisaTroco === false ? "Valor exato (sem troco)" : "Ex.: 50,00"}
            keyboardType="decimal-pad"
            editable={precisaTroco !== false && !fechar.isPending}
          />

          <Text style={styles.rotulo}>Precisa de troco?</Text>
          <View style={styles.checks}>
            <CaixaMarcacao
              titulo="Sim"
              marcado={precisaTroco === true}
              aoTocar={() => marcarTroco(true)}
              desativado={fechar.isPending}
            />
            <CaixaMarcacao
              titulo="Não"
              marcado={precisaTroco === false}
              aoTocar={() => marcarTroco(false)}
              desativado={fechar.isPending}
            />
          </View>

          {precisaTroco === true && valor !== null ? (
            valorSuficiente ? (
              <Text style={styles.troco}>
                {trocoCalculado && trocoCalculado > 0
                  ? `Seu troco: ${formatarPreco(trocoCalculado)}`
                  : "Sem troco: o valor é exato."}
              </Text>
            ) : (
              <Text style={styles.erro}>O valor precisa ser pelo menos {formatarPreco(total)}.</Text>
            )
          ) : null}

          {precisaTroco === false ? (
            <Text style={styles.aviso}>Você vai pagar o valor exato: {formatarPreco(total)}.</Text>
          ) : null}
        </View>
      ) : null}

      {forma === "pix" ? <Text style={styles.aviso}>O QR Code Pix será exibido após confirmar o pedido.</Text> : null}

      <Pressable
        style={[styles.botao, fechar.isPending && styles.botaoDesativado]}
        onPress={confirmar}
        disabled={fechar.isPending}
      >
        {fechar.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.textoBotao}>Confirmar pedido ({formatarPreco(total)})</Text>
        )}
      </Pressable>

      <Pressable onPress={() => setAberto(false)} disabled={fechar.isPending}>
        <Text style={styles.voltar}>Voltar</Text>
      </Pressable>
    </View>
  );
}

const COR = "#e63b08";
const MARROM = "#642600";

const styles = StyleSheet.create({
  caixa: { borderWidth: 1, borderColor: "#efd9c5", borderRadius: 14, padding: 14, gap: 10, marginTop: 8, backgroundColor: "#fff" },
  titulo: { fontSize: 17, fontWeight: "bold", color: MARROM },
  opcoes: { borderWidth: 1, borderColor: "#efd9c5", borderRadius: 12, paddingHorizontal: 10, backgroundColor: "#fff" },
  opcao: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0e2d5",
  },
  radio: { width: 16, height: 16, borderRadius: 8, borderWidth: 1.5, borderColor: "#777", alignItems: "center", justifyContent: "center" },
  radioAtivo: { borderColor: COR },
  radioPonto: { width: 8, height: 8, borderRadius: 4, backgroundColor: COR },
  textoOpcao: { color: MARROM, fontSize: 14 },
  cartaoVazio: { gap: 8, padding: 12, borderRadius: 12, backgroundColor: "#fff8f1", borderWidth: 1, borderColor: "#efd9c5" },
  cartaoTitulo: { fontWeight: "bold", color: MARROM },
  blocoDinheiro: { gap: 8, padding: 10, borderRadius: 10, backgroundColor: "#fff8f1" },
  linhaTotal: { fontWeight: "bold" },
  rotulo: { fontWeight: "600" },
  campo: { borderWidth: 1, borderColor: "#ccc", borderRadius: 10, padding: 12, fontSize: 16 },
  campoDesativado: { opacity: 0.5 },
  checks: { flexDirection: "row", gap: 24 },
  checkLinha: { flexDirection: "row", alignItems: "center", gap: 8 },
  caixinha: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COR,
    alignItems: "center",
    justifyContent: "center",
  },
  caixinhaMarcada: { backgroundColor: COR },
  marca: { color: "#fff", fontWeight: "bold", fontSize: 16, lineHeight: 18 },
  textoCheck: { fontSize: 16 },
  troco: { color: "#2e7d32", fontWeight: "bold", fontSize: 16 },
  erro: { color: "#b00020" },
  aviso: { color: "#666", fontSize: 13 },
  botao: { backgroundColor: COR, padding: 14, borderRadius: 999, alignItems: "center", marginTop: 8 },
  botaoDesativado: { opacity: 0.6 },
  textoBotao: { color: "#fff", fontWeight: "bold" },
  botaoVazado: { borderWidth: 1, borderColor: "#efd9c5", padding: 11, borderRadius: 10, alignItems: "center" },
  textoBotaoVazado: { color: MARROM, fontWeight: "bold" },
  voltar: { color: COR, fontWeight: "600", textAlign: "center" },
});
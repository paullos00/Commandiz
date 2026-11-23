// Arquivo: frontend/commandiz/components/SobreACasa.tsx
// Tela "Sobre a Casa": descrição, endereço, telefone, horários e se está aberto agora.
// Os dados vêm do backend (arquivo backend/casa.py).

import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useCasa, useResumoAvaliacoes } from "../hooks/useCommandiz";
import type { Horario } from "../services/api";

const DIAS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

function minutos(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

// Confere se está aberto agora, inclusive quando o horário passa da meia-noite.
function estaAberto(horarios: Horario[], agora: Date): boolean {
  const atual = agora.getHours() * 60 + agora.getMinutes();
  const hoje = horarios.find((h) => h.dia === DIAS[agora.getDay()]);
  const ontem = horarios.find((h) => h.dia === DIAS[(agora.getDay() + 6) % 7]);

  if (hoje?.abre && hoje.fecha) {
    const abre = minutos(hoje.abre);
    const fecha = minutos(hoje.fecha);
    if (fecha > abre ? atual >= abre && atual < fecha : atual >= abre) return true;
  }

  // Turno de ontem que terminou depois da meia-noite
  if (ontem?.abre && ontem.fecha) {
    const abre = minutos(ontem.abre);
    const fecha = minutos(ontem.fecha);
    if (fecha <= abre && atual < fecha) return true;
  }

  return false;
}

export default function SobreACasa({ aoVoltar }: { aoVoltar: () => void }) {
  const casa = useCasa();
  const resumo = useResumoAvaliacoes();

  if (casa.isPending) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" />
        <Text>Carregando informações...</Text>
      </View>
    );
  }

  if (casa.error || !casa.data) {
    return (
      <View style={styles.centro}>
        <Text style={styles.titulo}>Ops, deu erro 😕</Text>
        <Text style={styles.erro}>{casa.error?.message ?? "Não foi possível carregar."}</Text>
        <Pressable style={styles.botao} onPress={() => casa.refetch()}>
          <Text style={styles.textoBotao}>Tentar de novo</Text>
        </Pressable>
        <Pressable onPress={aoVoltar}>
          <Text style={styles.voltar}>← Voltar</Text>
        </Pressable>
      </View>
    );
  }

  const info = casa.data;
  const agora = new Date();
  const aberto = estaAberto(info.horarios, agora);
  const hoje = DIAS[agora.getDay()];

  return (
    <ScrollView contentContainerStyle={styles.lista}>
      <Pressable onPress={aoVoltar} hitSlop={10}>
        <Text style={styles.voltar}>← Voltar ao cardápio</Text>
      </Pressable>

      <Text style={styles.nome}>{info.nome}</Text>

      <View style={[styles.selo, aberto ? styles.seloAberto : styles.seloFechado]}>
        <Text style={styles.textoSelo}>{aberto ? "● Aberto agora" : "● Fechado agora"}</Text>
      </View>

      <Text style={styles.descricao}>{info.descricao}</Text>

      <Text style={styles.rotulo}>📍 Endereço</Text>
      <Text style={styles.valor}>{info.endereco}</Text>

      <Text style={styles.rotulo}>📞 Telefone</Text>
      <View style={styles.linha}>
        <Text style={styles.valor}>{info.telefone}</Text>
        <Pressable
          style={styles.botaoPequeno}
          onPress={() => Linking.openURL(`tel:${info.telefone.replace(/\D/g, "")}`)}
        >
          <Text style={styles.textoBotao}>Ligar</Text>
        </Pressable>
      </View>

      <Text style={styles.rotulo}>🕒 Horários</Text>
      <View style={styles.card}>
        {info.horarios.map((h) => {
          const eHoje = h.dia === hoje;
          return (
            <View key={h.dia} style={styles.linha}>
              <Text style={[styles.dia, eHoje && styles.destaque]}>{h.dia}</Text>
              <Text style={[styles.hora, eHoje && styles.destaque]}>
                {h.abre && h.fecha ? `${h.abre} às ${h.fecha}` : "Fechado"}
              </Text>
            </View>
          );
        })}
      </View>

      <Text style={styles.rotulo}>⭐ Avaliações dos clientes</Text>
      {resumo.data && resumo.data.total > 0 ? (
        <View style={styles.card}>
          <Text style={styles.notaMedia}>
            {resumo.data.media.toFixed(1).replace(".", ",")} de 5 • {resumo.data.total}{" "}
            {resumo.data.total === 1 ? "avaliação" : "avaliações"}
          </Text>
          {resumo.data.recentes.map((a, indice) => (
            <View key={indice} style={styles.avaliacao}>
              <Text style={styles.dia}>
                {a.nome} {"⭐".repeat(a.nota)}
              </Text>
              {a.comentario ? <Text style={styles.comentario}>“{a.comentario}”</Text> : null}
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.valor}>Ainda não há avaliações.</Text>
      )}
    </ScrollView>
  );
}

const COR = "#d84315";

const styles = StyleSheet.create({
  lista: { padding: 16, paddingTop: 12, gap: 8, paddingBottom: 40 },
  centro: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 8 },
  voltar: { color: COR, fontWeight: "600", fontSize: 16 },
  titulo: { fontSize: 22, fontWeight: "bold" },
  erro: { color: "#b00020", textAlign: "center" },
  nome: { fontSize: 26, fontWeight: "bold", marginTop: 8 },
  selo: { alignSelf: "flex-start", paddingVertical: 4, paddingHorizontal: 12, borderRadius: 999 },
  seloAberto: { backgroundColor: "#2e7d32" },
  seloFechado: { backgroundColor: "#b00020" },
  textoSelo: { color: "#fff", fontWeight: "bold" },
  descricao: { fontSize: 16, lineHeight: 22, marginTop: 4 },
  rotulo: { fontWeight: "bold", fontSize: 16, marginTop: 12 },
  valor: { fontSize: 16, flexShrink: 1 },
  linha: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  card: { borderWidth: 1, borderColor: "#ddd", borderRadius: 12, padding: 12, gap: 6 },
  dia: { fontSize: 16 },
  notaMedia: { fontSize: 18, fontWeight: "bold" },
  avaliacao: { gap: 2, paddingTop: 6 },
  comentario: { fontStyle: "italic", color: "#888" },
  hora: { fontSize: 16 },
  destaque: { fontWeight: "bold", color: COR },
  botao: { backgroundColor: COR, padding: 14, borderRadius: 10, alignItems: "center", marginTop: 8 },
  botaoPequeno: { backgroundColor: COR, paddingVertical: 8, paddingHorizontal: 18, borderRadius: 8 },
  textoBotao: { color: "#fff", fontWeight: "bold" },
});

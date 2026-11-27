// Arquivo: frontend/components/AdminPainel.tsx
// Painel do administrador: Pedidos | Cardápio | Cupons.

import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import AdminCardapio from "./AdminCardapio";
import AdminCupons from "./AdminCupons";
import AdminPedidos from "./AdminPedidos";

type Sub = "pedidos" | "cardapio" | "cupons";

export default function AdminPainel({ aoVoltar }: { aoVoltar: () => void }) {
  const [sub, setSub] = useState<Sub>("pedidos");

  const aba = (id: Sub, titulo: string) => (
    <Pressable style={[styles.aba, sub === id && styles.abaAtiva]} onPress={() => setSub(id)}>
      <Text style={[styles.textoAba, sub === id && styles.textoAbaAtiva]}>{titulo}</Text>
    </Pressable>
  );

  return (
    <View style={{ flex: 1 }}>
      <Pressable style={styles.voltar} onPress={aoVoltar} accessibilityRole="button">
        <Ionicons name="chevron-back" size={17} color="#642600" />
        <Text style={styles.textoVoltar}>Voltar ao perfil</Text>
      </Pressable>
      <Text style={styles.titulo}>Painel do administrador</Text>
      <View style={styles.abas}>
        {aba("pedidos", "Pedidos")}
        {aba("cardapio", "Cardápio")}
        {aba("cupons", "Cupons")}
      </View>

      {sub === "pedidos" && <AdminPedidos />}
      {sub === "cardapio" && <AdminCardapio />}
      {sub === "cupons" && <AdminCupons />}
    </View>
  );
}

const COR = "#d84315";

const styles = StyleSheet.create({
  voltar: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 16, paddingTop: 2 },
  textoVoltar: { color: "#642600", fontSize: 12, fontWeight: "700" },
  titulo: { fontSize: 18, fontWeight: "bold", paddingHorizontal: 16, paddingTop: 8 },
  abas: { flexDirection: "row", gap: 6, padding: 12 },
  aba: { flex: 1, minHeight: 40, borderRadius: 10, borderWidth: 1, borderColor: COR, alignItems: "center", justifyContent: "center" },
  abaAtiva: { backgroundColor: COR },
  textoAba: { color: COR, fontWeight: "600" },
  textoAbaAtiva: { color: "#fff" },
});

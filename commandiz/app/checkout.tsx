import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { useCart } from '../context/cart-context';
import { formatBRL } from '../data/menu';
import { Colors, Typography, Spacing } from '../constants/theme';

const METHODS = ['Pix', 'Cartão de crédito', 'Dinheiro na entrega'];

export default function CheckoutScreen() {
  const { items, subtotal, clear } = useCart();
  const [method, setMethod] = useState(METHODS[0]);

  const confirm = () => {
    clear();
    Alert.alert('Pedido realizado!', `Pagamento: ${method}. Acompanhe em "Pedidos".`, [
      { text: 'OK', onPress: () => router.replace('/(tabs)/orders') },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Resumo</Text>
      {items.map((i) => (
        <View key={i.id} style={styles.row}>
          <Text style={styles.text}>{i.quantity}x {i.title}</Text>
          <Text style={styles.text}>{formatBRL(i.price * i.quantity)}</Text>
        </View>
      ))}
      <View style={[styles.row, styles.totalRow]}>
        <Text style={styles.total}>Total</Text>
        <Text style={styles.total}>{formatBRL(subtotal)}</Text>
      </View>

      <Text style={[styles.label, { marginTop: Spacing.lg }]}>Forma de pagamento</Text>
      {METHODS.map((m) => (
        <TouchableOpacity key={m} style={[styles.method, m === method && styles.methodActive]} onPress={() => setMethod(m)}>
          <Text style={[styles.text, m === method && { color: '#FFF', fontWeight: '700' }]}>{m}</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={styles.button} onPress={confirm} disabled={items.length === 0}>
        <Text style={styles.buttonText}>Confirmar pedido</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.brand.background, padding: Spacing.lg },
  label: { ...Typography.h2, color: Colors.brand.text, marginBottom: Spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  text: { ...Typography.body, color: Colors.brand.text },
  totalRow: { borderTopWidth: 1, borderTopColor: '#EEE', paddingTop: Spacing.sm, marginTop: Spacing.sm },
  total: { ...Typography.h2, color: Colors.brand.primary },
  method: { backgroundColor: Colors.brand.surface, padding: Spacing.md, borderRadius: 12, marginBottom: Spacing.sm },
  methodActive: { backgroundColor: Colors.brand.primary },
  button: { backgroundColor: Colors.brand.primary, padding: Spacing.md, borderRadius: 16, alignItems: 'center', marginTop: Spacing.lg },
  buttonText: { ...Typography.h2, color: Colors.brand.textLight },
});
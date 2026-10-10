import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { MENU_ITEMS, formatBRL } from '../data/menu';
import { useCart } from '../context/cart-context';
import { Colors, Typography, Spacing } from '../constants/theme';


export default function ModalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { add } = useCart();
  const item = MENU_ITEMS.find((i) => i.id === id);
  if (!item) return null;

  return (
    <View style={styles.container}>
      <Image source={item.image} style={styles.image} />
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.desc}>{item.desc}</Text>
      <View style={styles.footer}>
        <Text style={styles.price}>{formatBRL(item.price)}</Text>
        <TouchableOpacity style={styles.button} onPress={() => { add(item); router.back(); }}>
          <Text style={styles.buttonText}>Adicionar ao carrinho +</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.brand.background, padding: Spacing.lg },
  image: { width: '100%', height: 240, borderRadius: 20, marginBottom: Spacing.md },
  title: { ...Typography.h1, color: Colors.brand.text, marginBottom: Spacing.sm },
  desc: { ...Typography.body, color: Colors.brand.textMuted },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.lg },
  price: { fontSize: 24, fontWeight: '800', color: Colors.brand.text },
  button: { backgroundColor: '#E8450C', paddingVertical: 12, paddingHorizontal: 18, borderRadius: 24 },
  buttonText: { color: '#FFF', fontWeight: '700' },
});
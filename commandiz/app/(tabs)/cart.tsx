import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Header from '../../components/header';
import CartItem from '../../components/cart-item';
import { useCart } from '../../context/cart-context';
import { formatBRL } from '../../data/menu';
import { Colors, Typography, Spacing } from '../../constants/theme';

export default function CartScreen() {
  const { items, increase, decrease, remove, subtotal } = useCart();
  const [coupon, setCoupon] = useState('');

  const desconto = coupon.trim().toUpperCase() === 'BRUTUS10' ? subtotal * 0.1 : 0;
  const total = subtotal - desconto;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Carrinho" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {items.length === 0 ? (
          <Text style={styles.emptyText}>Seu carrinho está vazio.</Text>
        ) : (
          items.map((item) => (
            <CartItem
              key={item.id}
              title={item.title}
              price={item.price}
              quantity={item.quantity}
              image={item.image}
              onIncrease={() => increase(item.id)}
              onDecrease={() => decrease(item.id)}
              onRemove={() => remove(item.id)}
            />
          ))
        )}

        <Text style={styles.sectionLabel}>Cupom</Text>
        <TextInput
          style={styles.couponInput}
          placeholder="Digite seu cupom"
          placeholderTextColor={Colors.brand.textMuted}
          value={coupon}
          onChangeText={setCoupon}
          autoCapitalize="characters"
        />

        <View style={styles.summary}>
          <Text style={styles.sectionLabel}>Resumo</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{formatBRL(subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Desconto</Text>
            <Text style={styles.summaryValue}>- {formatBRL(desconto)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatBRL(total)}</Text>
          </View>
        </View>
      </ScrollView>

      {items.length > 0 && (
        <TouchableOpacity style={styles.checkoutButton} onPress={() => router.push('/checkout')}>
          <Text style={styles.checkoutText}>Finalizar pedido — {formatBRL(total)}</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.brand.background },
  scrollContent: { padding: Spacing.md, paddingBottom: Spacing.xl },
  emptyText: { ...Typography.body, color: Colors.brand.textMuted, textAlign: 'center', marginTop: Spacing.xl },
  sectionLabel: { ...Typography.h2, color: Colors.brand.text, marginTop: Spacing.md, marginBottom: Spacing.sm },
  couponInput: {
    backgroundColor: Colors.brand.surface,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: Colors.brand.text,
  },
  summary: { marginTop: Spacing.lg },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xs },
  summaryLabel: { ...Typography.body, color: Colors.brand.textMuted },
  summaryValue: { ...Typography.body, color: Colors.brand.text },
  totalRow: { marginTop: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: '#EEE' },
  totalLabel: { ...Typography.h2, color: Colors.brand.text },
  totalValue: { ...Typography.h2, color: Colors.brand.primary },
  checkoutButton: {
    backgroundColor: Colors.brand.primary,
    margin: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: 16,
    alignItems: 'center',
  },
  checkoutText: { ...Typography.h2, color: Colors.brand.textLight },
});
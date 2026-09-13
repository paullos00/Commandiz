import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '../constants/theme';

export type OrderStatus = 'preparando' | 'a_caminho' | 'entregue' | 'cancelado';

type OrderCardProps = {
  orderNumber: string;
  date: string;
  itemsSummary: string;
  total: number;
  status: OrderStatus;
};

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  preparando: { label: 'Preparando', color: '#B8860B', bg: '#FDF3D9' },
  a_caminho: { label: 'A caminho', color: '#1D6FA5', bg: '#DCEEFB' },
  entregue: { label: 'Entregue', color: '#2E7D32', bg: '#E3F3E4' },
  cancelado: { label: 'Cancelado', color: '#B00020', bg: '#FBE0E4' },
};

export default function OrderCard({ orderNumber, date, itemsSummary, total, status }: OrderCardProps) {
  const statusInfo = STATUS_CONFIG[status];

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.orderNumber}>Pedido #{orderNumber}</Text>
        <View style={[styles.badge, { backgroundColor: statusInfo.bg }]}>
          <Text style={[styles.badgeText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
        </View>
      </View>

      <Text style={styles.date}>{date}</Text>
      <Text style={styles.items}>{itemsSummary}</Text>

      <View style={styles.footerRow}>
        <Text style={styles.total}>R$ {total.toFixed(2).replace('.', ',')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.brand.surface,
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderNumber: { ...Typography.h2, color: Colors.brand.text },
  badge: { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  date: { ...Typography.body, color: Colors.brand.textMuted, marginTop: Spacing.xs },
  items: { ...Typography.body, color: Colors.brand.textMuted, marginTop: 2 },
  footerRow: { marginTop: Spacing.sm, borderTopWidth: 1, borderTopColor: '#EEE', paddingTop: Spacing.sm },
  total: { ...Typography.price, color: Colors.brand.primary },
});
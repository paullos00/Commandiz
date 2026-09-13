import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../../components/header';
import OrderCard, { OrderStatus } from '../../components/order-card';
import { Colors, Typography, Spacing } from '../../constants/theme';

type Order = {
  id: string;
  orderNumber: string;
  date: string;
  itemsSummary: string;
  total: number;
  status: OrderStatus;
};

const ORDERS: Order[] = [
  { id: '1', orderNumber: '1042', date: '11 set. — 20:14', itemsSummary: '2x Kafta, 1x Picanha', total: 38, status: 'a_caminho' },
  { id: '2', orderNumber: '1039', date: '09 set. — 19:30', itemsSummary: '1x Kafta com Queijo', total: 9, status: 'entregue' },
  { id: '3', orderNumber: '1035', date: '05 set. — 21:02', itemsSummary: '3x Picanha', total: 60, status: 'entregue' },
  { id: '4', orderNumber: '1030', date: '01 set. — 18:47', itemsSummary: '1x Kafta', total: 9, status: 'cancelado' },
];

const FILTERS: { key: 'todos' | OrderStatus; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'a_caminho', label: 'A caminho' },
  { key: 'entregue', label: 'Entregues' },
  { key: 'cancelado', label: 'Cancelados' },
];

export default function OrdersScreen() {
  const [filter, setFilter] = useState<'todos' | OrderStatus>('todos');

  const filteredOrders = filter === 'todos' ? ORDERS : ORDERS.filter((o) => o.status === filter);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Meus Pedidos" />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {FILTERS.map((f) => {
          const isActive = f.key === filter;
          return (
            <TouchableOpacity
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
            >
              <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {filteredOrders.length === 0 ? (
          <Text style={styles.emptyText}>Nenhum pedido nessa categoria.</Text>
        ) : (
          filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              orderNumber={order.orderNumber}
              date={order.date}
              itemsSummary={order.itemsSummary}
              total={order.total}
              status={order.status}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.brand.background },
  filterRow: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: Spacing.sm },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 20,
    backgroundColor: Colors.brand.surface,
    marginRight: Spacing.sm,
  },
  filterChipActive: { backgroundColor: Colors.brand.primary },
  filterChipText: { ...Typography.body, color: Colors.brand.text },
  filterChipTextActive: { color: Colors.brand.textLight, fontWeight: '600' },
  scrollContent: { padding: Spacing.md, paddingBottom: Spacing.xl },
  emptyText: { ...Typography.body, color: Colors.brand.textMuted, textAlign: 'center', marginTop: Spacing.xl },
});
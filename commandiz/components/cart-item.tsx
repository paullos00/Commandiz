import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ImageSourcePropType } from 'react-native';
import { Minus, Plus, Trash2 } from 'lucide-react-native';
import { Colors, Typography, Spacing } from '../constants/theme';

type CartItemProps = {
  title: string;
  price: number;
  quantity: number;
  image: ImageSourcePropType;
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
};

export default function CartItem({ title, price, quantity, image, onIncrease, onDecrease, onRemove }: CartItemProps) {
  return (
    <View style={styles.card}>
      <Image source={image} style={styles.image} />
      <View style={styles.info}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.price}>R$ {(price * quantity).toFixed(2).replace('.', ',')}</Text>
        <View style={styles.stepper}>
          <TouchableOpacity onPress={onDecrease} style={styles.stepButton}>
            <Minus size={14} color={Colors.brand.primary} />
          </TouchableOpacity>
          <Text style={styles.quantity}>{quantity}</Text>
          <TouchableOpacity onPress={onIncrease} style={styles.stepButton}>
            <Plus size={14} color={Colors.brand.primary} />
          </TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity onPress={onRemove} style={styles.removeButton}>
        <Trash2 size={18} color={Colors.brand.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.brand.surface,
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    alignItems: 'center',
    gap: Spacing.md,
  },
  image: { width: 64, height: 64, borderRadius: 12 },
  info: { flex: 1 },
  title: { ...Typography.h2, color: Colors.brand.text },
  price: { ...Typography.price, color: Colors.brand.primary, marginVertical: Spacing.xs },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  stepButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: Colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantity: { ...Typography.body, color: Colors.brand.text, minWidth: 18, textAlign: 'center' },
  removeButton: { padding: Spacing.xs },
});
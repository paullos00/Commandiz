import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Colors, Typography, Spacing } from '../constants/theme';

export default function ModalScreen() {
  const { title, desc, price } = useLocalSearchParams<{
    title: string;
    desc: string;
    price: string;
  }>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.desc}>{desc}</Text>
      <Text style={styles.price}>{price}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.brand.background, padding: Spacing.lg },
  title: { ...Typography.h1, color: Colors.brand.text, marginBottom: Spacing.sm },
  desc: { ...Typography.body, color: Colors.brand.textMuted, marginBottom: Spacing.md },
  price: { ...Typography.price, color: Colors.brand.primary },
});
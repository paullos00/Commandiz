import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '../constants/theme';

export default function AboutScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Espeto Brutus</Text>
      <Text style={styles.label}>Endereço</Text>
      <Text style={styles.text}>Avenida 2, 20, Jardim Monte Cristo, Campinas - São Paulo.</Text>
      <Text style={styles.label}>Horário de funcionamento</Text>
      <Text style={styles.text}>Quarta á Sábado, a partir das 19 horas.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.brand.background, padding: Spacing.lg },
  title: { ...Typography.h1, color: Colors.brand.text, marginBottom: Spacing.md },
  label: { ...Typography.h2, color: Colors.brand.primary, marginTop: Spacing.md },
  text: { ...Typography.body, color: Colors.brand.textMuted, marginTop: 4 },
});
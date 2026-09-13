import React from 'react';
import { View, Text, ScrollView, Image, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import Header from '../../components/header';
import PromoCard from '../../components/promo-card';
import { Colors, Typography, Spacing } from '../../constants/theme';

const HERO_BANNER = require('../../assets/images/promo-banner.jpeg');

const PROMOTIONS = [
  {
    id: '1',
    title: '10% de desconto',
    description: 'Válido para o primeiro pedido do app.',
    code: 'BRUTUS10',
    expiresAt: '30/09',
  },
  {
    id: '2',
    title: 'Frete grátis',
    description: 'Em pedidos acima de R$ 40.',
    code: 'FRETEGRATIS',
    expiresAt: '15/10',
  },
  {
    id: '3',
    title: 'Kafta em dobro',
    description: 'Compre 1 Kafta e leve 2, às quartas-feiras.',
    code: 'KAFTADOBRO',
    expiresAt: '30/10',
  },
];

export default function PromoScreen() {
  const handleCopy = async (code: string) => {
    await Clipboard.setStringAsync(code);
    Alert.alert('Cupom copiado!', `O código "${code}" foi copiado.`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Promoções" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroContainer}>
          <Image source={HERO_BANNER} style={styles.heroImage} />
          <View style={styles.heroOverlay}>
            <Text style={styles.heroTitle}>Cupons e Mimos</Text>
            <Text style={styles.heroDesc}>Descontos e promoções imperdíveis para aproveitar.</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Disponíveis para você</Text>

        {PROMOTIONS.map((promo) => (
          <PromoCard
            key={promo.id}
            title={promo.title}
            description={promo.description}
            code={promo.code}
            expiresAt={promo.expiresAt}
            onCopy={handleCopy}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.brand.background },
  scrollContent: { padding: Spacing.md, paddingBottom: Spacing.xl },
  heroContainer: {
    width: '100%',
    height: 140,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.md,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  heroTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  heroDesc: { color: '#E0E0E0', fontSize: 12, marginTop: 4 },
  sectionLabel: {
    ...Typography.body,
    color: Colors.brand.textMuted,
    textTransform: 'uppercase',
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
});
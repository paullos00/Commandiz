import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Image,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../../components/header';
import MenuCard from '../../components/menu-card';
import { MENU_ITEMS, CATEGORIES, formatBRL } from '../../data/menu';
import { Colors, Spacing } from '../../constants/theme';

const ESPETOS = require('../../assets/images/espetos.jpg');

export default function MenuScreen() {
  const [category, setCategory] = useState(CATEGORIES[0]);
  const visible = MENU_ITEMS.filter((i) => i.category === category);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.brand.primary} />
      <Header title="Espetos Brutus" hasNotification />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroContainer}>
          <Image source={ESPETOS} style={styles.heroImage} />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
          {CATEGORIES.map((c) => {
            const active = c === category;
            return (
              <TouchableOpacity
                key={c}
                onPress={() => setCategory(c)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{c}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.listContainer}>
          {visible.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum item nessa categoria ainda.</Text>
          ) : (
            visible.map((item) => (
              <MenuCard
                key={item.id}
                id={item.id}
                title={item.title}
                desc={item.desc}
                price={formatBRL(item.price)}
                image={item.image}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.brand.background },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: Spacing.xl },
  heroContainer: {
    width: '100%',
    height: 200,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
  },
  heroImage: { width: '100%', height: '100%' },
  chipsRow: { marginBottom: 16, flexGrow: 0 },
  chip: {
    backgroundColor: Colors.brand.surface,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  chipActive: { backgroundColor: Colors.brand.primary },
  chipText: { color: Colors.brand.text, fontWeight: '700' },
  chipTextActive: { color: '#FFFFFF' },
  listContainer: { gap: 4 },
  emptyText: { color: Colors.brand.textMuted, textAlign: 'center', marginTop: Spacing.lg },
});
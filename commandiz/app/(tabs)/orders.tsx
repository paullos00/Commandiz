// app/(tabs)/promo.tsx (mesma base para cart.tsx, orders.tsx, profile.tsx, trocando o texto)
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/theme';

export default function PromoScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.text}>Ordens em breve</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.brand.background, alignItems: 'center', justifyContent: 'center' },
  text: { color: Colors.brand.text, fontSize: 16 },
});
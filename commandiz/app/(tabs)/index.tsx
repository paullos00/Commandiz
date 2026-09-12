import React from 'react';
import { StyleSheet, View, ScrollView, Image, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../../components/header';
import MenuCard from '../../components/menu-card';
import { Colors, Spacing} from '../../constants/theme';

const ESPETOS = require('../../assets/images/espetos.jpg');

const MENU_ITEMS = [
  { id: '1', title: 'Kafta', desc: 'Delicioso espeto de kafta.', price: 'R$9,00', image: require('../../assets/images/kafta.jpg') },
  { id: '2', title: 'Kafta com Queijo', desc: 'Recheio de queijo, combinação perfeita.', price: 'R$9,00', image: require('../../assets/images/kaftaqueijo.jpg') },
  { id: '3', title: 'Picanha', desc: 'Corte especial, preço especial.', price: 'R$9,00', image: require('../../assets/images/picanha.jpg') },
];

export default function MenuScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.brand.primary} />
      <Header title="Espetos Brutus" hasNotification />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroContainer}>
          <Image source={ESPETOS} style={styles.heroImage} />
        </View>
        <View style={styles.listContainer}>
          {MENU_ITEMS.map((item) => (
            <MenuCard key={item.id} {...item} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.brand.background },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20 },
  heroContainer: { width: '100%', height: 200, borderRadius: 20, overflow: 'hidden', marginBottom: 20 },
  heroImage: { width: '100%', height: '100%' },
  listContainer: { gap: 20 },
});
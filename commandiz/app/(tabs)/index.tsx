import React from 'react';
import { StyleSheet, Text, View, Image, ScrollView, SafeAreaView, TouchableOpacity, StatusBar} from 'react-native';
import { Star, Bell, Utensils, BadgePercent, ShoppingCart, ReceiptText, User} from 'lucide-react-native';

const ESPETOS = require('../../assets/images/espetos.jpg');

const MENU_ITEMS = [
  { id: '1', title: 'Kafta', desc: 'Delicioso espeto de kafta, uma obra prima da culinária árabe.', price: 'R$9,00', image: require('../../assets/images/kafta.jpg')},
  { id: '2', title: 'Kafta com Queijo', desc: 'Deliciosa kafta com um recheio especial de queijo, uma combinação perfeita de sabores.', price: 'R$9,00', image: require('../../assets/images/kaftaqueijo.jpg')},
  { id: '3', title: 'Picanha', desc: 'Saboroso espeto de picanha, um corte especial, por um preço especial', price: 'R$9,00', image: require('../../assets/images/picanha.jpg')},
];

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle='light-content' backgroundColor="#4a2511"/>

      {/*HEADER*/}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Espetos{'\n'}BRUTUS</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton}>
            <Star color="#FDF8F5" size={24}/>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Bell color="#FDF8F5" size={24}/>
            <View style={styles.notificationDot}/>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* BANNER DESTAQUE */}
        <View style={styles.heroContainer}>
          <Image source={ESPETOS} style={styles.heroImage}/>
          <View style={styles.heroOverlay}>
            <Text style={styles.heroTitle}>Espetinhos</Text>
            <Text style={styles.heroDesc}>Os melhores espetinhos da cidade, preparados com carinho e ingredientes frescos.</Text>
            <View style={styles.pagination}>
              <View style={[styles.dot, styles.dotActive]}/>
              <View style={styles.dot}/>
              <View style={styles.dot}/>
            </View>
          </View>
        </View> 

        {/* TAG CATEGORIA*/}
        <View style={styles.categoryContainer}>
          <Text style={styles.categoryText}>Carnes</Text>
        </View>

        {/* LISTA DE ITENS */}
        <View style={styles.listContainer}>
          {MENU_ITEMS.map(item => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDesc}>{item.desc}</Text>
                <Text style={styles.cardPrice}>{item.price}</Text>
              </View>
              <Image source={item.image} style={styles.cardImage}/>
            </View>
          ))}
        </View>
      </ScrollView>

      {/*ESPAÇO RODAPE*/}
      <View style={{height: 80}}></View>

      {/*RODAPÉ*/}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItemActive}>
          <Utensils color="#4a2511" size={20} />
          <Text style={styles.navItemActiveText}>Menu</Text>
        </TouchableOpacity>
        
        <TouchableOpacity>
          <BadgePercent color="#FDF8F5" size={28} />
        </TouchableOpacity>
        
        <TouchableOpacity>
          <ShoppingCart color="#FDF8F5" size={28} />
        </TouchableOpacity>
        
        <TouchableOpacity>
          <ReceiptText color="#FDF8F5" size={28} />
        </TouchableOpacity>
        
        <TouchableOpacity>
          <User color="#FDF8F5" size={28} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ESTILOS//
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDF8F5', // Cor de fundo off-white/creme
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  // HEADER
  header: {
    backgroundColor: '#4a2511', // Marrom escuro
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  logoText: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  iconButton: {
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 0,
    right: 2,
    width: 8,
    height: 8,
    backgroundColor: '#D9B382', // Cor bege/dourada
    borderRadius: 4,
  },
  // HERO BANNER
  heroContainer: {
    width: '100%',
    height: 200,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 20,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 15,
    backgroundColor: 'rgba(0,0,0,0.4)', // Fundo escuro transparente para leitura do texto
  },
  heroTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  heroDesc: {
    color: '#E0E0E0',
    fontSize: 12,
    marginBottom: 10,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  dotActive: {
    backgroundColor: '#FFF',
  },
  // CATEGORY
  categoryContainer: {
    backgroundColor: '#6b3011', // Marrom médio
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginBottom: 20,
  },
  categoryText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  // LISTA (CARDS)
  listContainer: {
    gap: 20,
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardInfo: {
    flex: 1,
    paddingRight: 15,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 5,
  },
  cardDesc: {
    fontSize: 11,
    color: '#555',
    lineHeight: 16,
    marginBottom: 10,
  },
  cardPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  cardImage: {
    width: 90,
    height: 90,
    borderRadius: 15,
  },
  // BOTTOM NAVIGATION
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#4a2511',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  navItemActive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 25,
    gap: 8,
  },
  navItemActiveText: {
    color: '#4a2511',
    fontWeight: 'bold',
    fontSize: 14,
  }
});
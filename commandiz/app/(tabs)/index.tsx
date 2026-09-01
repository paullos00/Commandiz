import React from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Cabeçalho do App */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>COMMANDIZ</Text>
        <Text style={styles.headerSubtitle}>Sistema de Gestão Ágil</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Banner do Conceito */}
        <View style={styles.banner}>
          <Text style={styles.bannerText}>🔥 Cardápio Digital</Text>
        </View>

        <Text style={styles.sectionTitle}>Principais Opções</Text>

        {/* Item 1 */}
        <View style={styles.card}>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>Espetinho de Picanha</Text>
            <Text style={styles.cardDescription}>Aproveite um saboroso e especial espetinho de picanha!</Text>
            <Text style={styles.cardPrice}>R$ 11,90</Text>
          </View>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Adicionar</Text>
          </TouchableOpacity>
        </View>

        {/* Item 2 */}
        <View style={styles.card}>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>Espetinho de carne</Text>
            <Text style={styles.cardDescription}>Aproveite um saboroso e especial espetinho de carne.</Text>
            <Text style={styles.cardPrice}>R$ 119,00</Text>
          </View>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Adicionar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    backgroundColor: '#8B0000',
    padding: 20,
    alignItems: 'center',
    paddingTop: 40,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  headerSubtitle: {
    color: '#FFD700',
    fontSize: 14,
  },
  content: {
    padding: 16,
  },
  banner: {
    backgroundColor: '#1E1E1E',
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF4500',
    marginBottom: 20,
  },
  bannerText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
    paddingRight: 10,
  },
  cardTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardDescription: {
    color: '#AAA',
    fontSize: 12,
    marginVertical: 4,
  },
  cardPrice: {
    color: '#FFD700',
    fontSize: 15,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#FF4500',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
});
import React from 'react';
import { View, Text, ScrollView, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  User,
  Crown,
  MapPin,
  CreditCard,
  Store,
  Bell,
  LogOut,
} from 'lucide-react-native';
import Header from '../../components/header';
import ProfileOption from '../../components/profile-option';
import { Colors, Typography, Spacing } from '../../constants/theme';

const PROFILE = {
  name: 'Paulo Sérgio',
  email: 'paulo@example.com',
  points: 240,
  avatar: require('../../assets/images/avatar-placeholder.png'),
};

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Meu Perfil" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.identityCard}>
          <Image source={PROFILE.avatar} style={styles.avatar} />
          <View style={styles.identityInfo}>
            <Text style={styles.name}>{PROFILE.name}</Text>
            <Text style={styles.email}>{PROFILE.email}</Text>
          </View>
        </View>

        <View style={styles.clubCard}>
          <Crown size={22} color={Colors.brand.accent} />
          <View style={styles.clubTextWrapper}>
            <Text style={styles.clubTitle}>Commandiz Club</Text>
            <Text style={styles.clubSubtitle}>{PROFILE.points} pontos acumulados</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Conta</Text>
        <ProfileOption icon={User} label="Dados pessoais" subtitle="Nome, telefone, e-mail" />
        <ProfileOption icon={MapPin} label="Endereços" subtitle="Gerencie seus endereços de entrega" />
        <ProfileOption icon={CreditCard} label="Formas de pagamento" subtitle="Cartões e Pix salvos" />

        <Text style={styles.sectionLabel}>Preferências</Text>
        <ProfileOption icon={Bell} label="Notificações" subtitle="Pedidos, promoções e novidades" />
        <ProfileOption icon={Store} label="Sobre a casa" subtitle="Endereço, horários e contato" />

        <Text style={styles.sectionLabel}>Sessão</Text>
        <ProfileOption icon={LogOut} label="Sair da conta" danger onPress={() => {}} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.brand.background },
  scrollContent: { padding: Spacing.md, paddingBottom: Spacing.xl },
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.brand.surface,
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  avatar: { width: 56, height: 56, borderRadius: 28, marginRight: Spacing.md },
  identityInfo: { flex: 1 },
  name: { ...Typography.h1, color: Colors.brand.text },
  email: { ...Typography.body, color: Colors.brand.textMuted, marginTop: 2 },
  clubCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.brand.primary,
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  clubTextWrapper: { marginLeft: Spacing.sm },
  clubTitle: { ...Typography.h2, color: Colors.brand.textLight },
  clubSubtitle: { ...Typography.body, color: Colors.brand.accent, marginTop: 2 },
  sectionLabel: {
    ...Typography.body,
    color: Colors.brand.textMuted,
    textTransform: 'uppercase',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    fontWeight: '700',
  },
});
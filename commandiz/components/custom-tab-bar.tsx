import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Utensils, BadgePercent, ShoppingCart, ReceiptText, User } from 'lucide-react-native';
import { Colors, Spacing } from '../constants/theme';

const ICONS: Record<string, any> = {
  index: Utensils,
  promo: BadgePercent,
  cart: ShoppingCart,
  orders: ReceiptText,
  profile: User,
};

const LABELS: Record<string, string> = {
  index: 'Menu',
  promo: 'Promoções',
  cart: 'Carrinho',
  orders: 'Pedidos',
  profile: 'Perfil',
};

export default function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: insets.bottom > 0 ? insets.bottom : 10 },
      ]}
    >
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const Icon = ICONS[route.name] ?? Utensils;
        const label = LABELS[route.name] ?? route.name;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            style={[styles.tabItem, isFocused && styles.tabItemActive]}
          >
            <Icon
              color={isFocused ? Colors.brand.primary : Colors.brand.accent}
              size={isFocused ? 20 : 26}
            />
            {isFocused && <Text style={styles.tabLabel}>{label}</Text>}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: Colors.brand.primary,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 10,
    paddingHorizontal: Spacing.md,
  },
  tabItem: {
    padding: Spacing.sm,
  },
  tabItemActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.brand.textLight, // pílula branca
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: 20,
  },
  tabLabel: {
    color: Colors.brand.primary,
    fontWeight: '600',
    fontSize: 13,
  },
});
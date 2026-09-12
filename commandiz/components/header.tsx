import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Star, Bell } from 'lucide-react-native';
import { Colors, Spacing } from '../constants/theme';

type HeaderProps = { title: string; hasNotification?: boolean };

export default function Header({ title, hasNotification }: HeaderProps) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.icons}>
        <TouchableOpacity style={styles.iconButton}>
          <Star color={Colors.brand.accent} size={24} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton}>
          <Bell color={Colors.brand.accent} size={24} />
          {hasNotification && <View style={styles.dot} />}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.brand.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  title: {
    fontFamily: 'Frijole_400Regular',
    fontSize: 16,
    lineHeight: 20,
    color: Colors.brand.textLight,
    textTransform: 'uppercase',
  },
  icons: { flexDirection: 'row', gap: Spacing.sm },
  iconButton: { padding: Spacing.xs },
  dot: {
    position: 'absolute', top: 2, right: 2,
    width: 8, height: 8, borderRadius: 4, backgroundColor: 'red',
  },
});
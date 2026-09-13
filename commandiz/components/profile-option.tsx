import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronRight, LucideIcon } from 'lucide-react-native';
import { Colors, Typography, Spacing } from '../constants/theme';

type ProfileOptionProps = {
  icon: LucideIcon;
  label: string;
  subtitle?: string;
  onPress?: () => void;
  danger?: boolean;
};

export default function ProfileOption({ icon: Icon, label, subtitle, onPress, danger }: ProfileOptionProps) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <View style={[styles.iconWrapper, danger && styles.iconWrapperDanger]}>
        <Icon size={18} color={danger ? '#B00020' : Colors.brand.primary} />
      </View>
      <View style={styles.textWrapper}>
        <Text style={[styles.label, danger && styles.labelDanger]}>{label}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {!danger && <ChevronRight size={18} color={Colors.brand.textMuted} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.brand.surface,
    borderRadius: 14,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  iconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F4E9DE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  iconWrapperDanger: { backgroundColor: '#FBE0E4' },
  textWrapper: { flex: 1 },
  label: { ...Typography.h2, color: Colors.brand.text },
  labelDanger: { color: '#B00020' },
  subtitle: { ...Typography.body, color: Colors.brand.textMuted, marginTop: 2 },
});
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Copy, Check, Tag } from 'lucide-react-native';
import { Colors, Typography, Spacing } from '../constants/theme';

type PromoCardProps = {
  title: string;
  description: string;
  code: string;
  expiresAt: string;
  onCopy?: (code: string) => void;
};

export default function PromoCard({ title, description, code, expiresAt, onCopy }: PromoCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopy?.(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={styles.card}>
      <View style={styles.iconWrapper}>
        <Tag size={20} color={Colors.brand.textLight} />
      </View>

      <View style={styles.info}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        <Text style={styles.expiry}>Válido até {expiresAt}</Text>
      </View>

      <TouchableOpacity style={styles.codeButton} onPress={handleCopy}>
        <Text style={styles.codeText}>{code}</Text>
        {copied ? (
          <Check size={14} color={Colors.brand.primary} />
        ) : (
          <Copy size={14} color={Colors.brand.primary} />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.brand.surface,
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1 },
  title: { ...Typography.h2, color: Colors.brand.text },
  description: { ...Typography.body, color: Colors.brand.textMuted, marginTop: 2 },
  expiry: { fontSize: 11, color: Colors.brand.textMuted, marginTop: 4 },
  codeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.brand.primary,
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  codeText: { fontSize: 13, fontWeight: '700', color: Colors.brand.primary },
});
import React from 'react';
import { Pressable, View, Text, Image, StyleSheet, ImageSourcePropType } from 'react-native';
import { router } from 'expo-router';
import { Colors, Typography, Spacing } from '../constants/theme';

type MenuCardProps = {
  title: string;
  desc: string;
  price: string;
  image: ImageSourcePropType;
};

export default function MenuCard({ title, desc, price, image }: MenuCardProps) {
  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push({ pathname: '/modal', params: { title, desc, price } })}
    >
      <View style={styles.info}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.desc}>{desc}</Text>
        <Text style={styles.price}>{price}</Text>
      </View>
      <Image source={image} style={styles.image} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.brand.surface,
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  info: { flex: 1, justifyContent: 'center' },
  title: { ...Typography.h2, color: Colors.brand.text },
  desc: { ...Typography.body, color: Colors.brand.textMuted, marginVertical: Spacing.xs },
  price: { ...Typography.price, color: Colors.brand.primary },
  image: { width: 80, height: 80, borderRadius: 12 },
});
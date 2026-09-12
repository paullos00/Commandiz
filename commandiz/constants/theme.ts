import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: { /* ... mantém */ },
  dark: { /* ... mantém */ },
  brand: {
    background: '#FDF8F5',
    surface: '#FFFFFF',
    primary: '#5E2104',
    accent: '#E6C28E',
    text: '#000000',
    textMuted: '#555555',
    textLight: '#FFFFFF',
  },
};

export const Typography = {
  h1: { fontSize: 22, fontWeight: '700' as const },
  h2: { fontSize: 16, fontWeight: '600' as const },
  body: { fontSize: 13, fontWeight: '400' as const },
  price: { fontSize: 15, fontWeight: '700' as const },
};

export const Spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };

export const Fonts = Platform.select({ /* ... */ });
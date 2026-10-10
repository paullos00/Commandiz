import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Frijole_400Regular } from '@expo-google-fonts/frijole';
import * as SplashScreen from 'expo-splash-screen';
import { CartProvider } from '../context/cart-context';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Frijole_400Regular });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <CartProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Detalhes' }} />
          <Stack.Screen name="checkout" options={{ title: 'Finalizar pedido' }} />
          <Stack.Screen name="about" options={{ title: 'Sobre a casa' }} />
        </Stack>
      </CartProvider>
    </SafeAreaProvider>
  );
}
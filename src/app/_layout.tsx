import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';

import { AppProviders } from '@/providers/app-providers';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    ArchivoBlack: require('../../assets/fonts/ArchivoBlack-Regular.ttf'),
    Inter: require('../../assets/fonts/Inter-Regular.ttf'),
    'Inter-SemiBold': require('../../assets/fonts/Inter-SemiBold.ttf'),
    'Inter-Black': require('../../assets/fonts/Inter-Black.ttf'),
    JetBrainsMono: require('../../assets/fonts/JetBrainsMono-Regular.ttf'),
    'JetBrainsMono-Bold': require('../../assets/fonts/JetBrainsMono-Bold.ttf'),
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AppProviders>
      <Stack screenOptions={{ headerShown: false, animation: 'none' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="catalog" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="connections" />
        <Stack.Screen name="skins" />
        <Stack.Screen name="fight" />
        <Stack.Screen name="lab" />
      </Stack>
    </AppProviders>
  );
}

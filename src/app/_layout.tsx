import { Stack } from 'expo-router';

import { AppProviders } from '@/providers/app-providers';

export default function RootLayout() {
  return (
    <AppProviders>
      <Stack screenOptions={{ headerShown: false, animation: 'none' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="catalog" />
        <Stack.Screen name="profile" />
      </Stack>
    </AppProviders>
  );
}

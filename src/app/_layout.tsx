import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { LanguageProvider } from '@/context/language-context';
import { RatesProvider } from '@/context/rates-context';
import { ThemeProvider } from '@/context/theme-context';

SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ duration: 600, fade: true });

export default function RootLayout() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <RatesProvider>
          <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="auth/callback" />
          </Stack>
        </RatesProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}

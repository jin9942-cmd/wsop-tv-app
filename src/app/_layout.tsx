import * as Notifications from 'expo-notifications';
import { DarkTheme, router, Stack, ThemeProvider, type Href } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SheetHost } from '@/components/sheets';
import { ToastHost } from '@/components/toasts';
import { notificationsSupported } from '@/lib/notifications';
import { AppProvider } from '@/state/app';
import { colors } from '@/theme';

SplashScreen.preventAutoHideAsync();

const theme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: colors.bg, card: colors.bg, text: colors.text, border: colors.line, primary: colors.gold },
};

/** Tapping a "Live now" notification opens its player (`data.url`, e.g. /live/sc-09) — on launch and while running. */
function useNotificationObserver() {
  useEffect(() => {
    if (!notificationsSupported) return;
    const redirect = (n: Notifications.Notification) => {
      const url = n.request.content.data?.url;
      if (typeof url === 'string') {
        router.push(url as Href);
        Notifications.clearLastNotificationResponse();
      }
    };
    const last = Notifications.getLastNotificationResponse();
    if (last?.notification) redirect(last.notification);
    const sub = Notifications.addNotificationResponseReceivedListener((r) => redirect(r.notification));
    return () => sub.remove();
  }, []);
}

export default function RootLayout() {
  useNotificationObserver();
  useEffect(() => {
    SplashScreen.hide();
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider value={theme}>
        <AppProvider>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
            <Stack.Screen name="(tabs)" />
          </Stack>
          <SheetHost />
          <ToastHost />
        </AppProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

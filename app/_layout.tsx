import { Stack } from "expo-router";
import '@/global.css'
import { useFonts } from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect } from 'react'
import { AuthProvider } from '@/lib/auth-context'
import { ApplicationsProvider } from '@/lib/applications-store'
import { useReminderNotifications } from '@/lib/use-reminder-notifications'
import { useSearchIndex } from '@/lib/use-search-index'
import DialogHost from '@/components/DialogHost'
import { AppearanceProvider } from '@/lib/appearance'
import ReminderBanner from '@/components/ReminderBanner'

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

// Lives inside ApplicationsProvider because it schedules reminders from the live list
function ReminderNotifications() {
  useReminderNotifications();
  return null;
}

// Same for the AI search index, which is rebuilt from the live list
function SearchIndex() {
  useSearchIndex();
  return null;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    // Geist: clean, modern and very clear for numbers, which this app is full of (dates, countdowns, counts)
    'sans-light': require('@expo-google-fonts/geist/300Light/Geist_300Light.ttf'),
    'sans-regular': require('@expo-google-fonts/geist/400Regular/Geist_400Regular.ttf'),
    'sans-medium': require('@expo-google-fonts/geist/500Medium/Geist_500Medium.ttf'),
    'sans-semibold': require('@expo-google-fonts/geist/600SemiBold/Geist_600SemiBold.ttf'),
    'sans-bold': require('@expo-google-fonts/geist/700Bold/Geist_700Bold.ttf'),
    'sans-extrabold': require('@expo-google-fonts/geist/800ExtraBold/Geist_800ExtraBold.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <AppearanceProvider>
    <AuthProvider>
      <ApplicationsProvider>
        <ReminderNotifications />
        <SearchIndex />
        <Stack screenOptions={{headerShown: false}} />
        {/* Web only: in-app reminder banners and dialogs (phones use system notifications and alerts) */}
        <ReminderBanner />
        <DialogHost />
      </ApplicationsProvider>
    </AuthProvider>
    </AppearanceProvider>
  );
}

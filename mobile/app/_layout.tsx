import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { FontMap } from '@/constants/Typography';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts(FontMap);

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="login" options={{ presentation: 'modal' }} />
          <Stack.Screen name="register" options={{ presentation: 'modal' }} />
          <Stack.Screen name="events/[id]" />
          <Stack.Screen name="users/[id]" />
          <Stack.Screen name="matches/[id]" />
          <Stack.Screen name="matches/compare/[candidateId]" />
          <Stack.Screen name="chat/[otherUserId]" />
          <Stack.Screen name="profile/edit" />
          <Stack.Screen name="admin/index" />
          <Stack.Screen name="admin/events" />
          <Stack.Screen name="admin/posts" />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

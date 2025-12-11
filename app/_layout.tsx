import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef } from 'react';
import { Animated, StatusBar, StyleSheet, useWindowDimensions, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from '~/context/AuthUserContext';
import { SnackbarProvider } from '~/context/SnackbarContext';
import { useColorScheme } from '~/hooks/useColorScheme';
import '../global.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import LottieView from 'lottie-react-native';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function Root() {
  const colorScheme = useColorScheme();
  const { user } = useAuth();

  useEffect(() => {
    const notificationListener = Notifications.addNotificationReceivedListener((notification) => {
      // notification received
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      // notification response received
    });

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);

  if (user === undefined) return null;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }} initialRouteName={!!user ? '(tabs)' : '(auth)'}>
        <Stack.Protected guard={user === null}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Protected guard={!!user}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(protected)" />
        </Stack.Protected>
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar barStyle="default" />
      <PortalHost />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const queryClient = new QueryClient();

  const { width, height } = useWindowDimensions();
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const [loaded, error] = useFonts({
    OnestLight: require('../assets/fonts/Onest-Light.ttf'),
    OnestThin: require('../assets/fonts/Onest-Thin.ttf'),
    OnestRegular: require('../assets/fonts/Onest-Regular.ttf'),
    OnestMedium: require('../assets/fonts/Onest-Medium.ttf'),
    OnestSemiBold: require('../assets/fonts/Onest-SemiBold.ttf'),
    OnestBold: require('../assets/fonts/Onest-Bold.ttf'),
  });

  useEffect(() => {
    if (loaded || error) {
      // Hide splash screen once fonts are loaded or if there's an error
      SplashScreen.hideAsync();

      // Wait for Lottie to finish, then fade out
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }, 6000);
    }
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SnackbarProvider>
          <GestureHandlerRootView>
            <Root />
            <Animated.View
              pointerEvents="none"
              style={{
                ...StyleSheet.absoluteFillObject,
                opacity: fadeAnim,
                backgroundColor: '#0C0E12',
              }}>
              <View className="flex-1 items-center justify-center">
                <LottieView
                  autoPlay
                  loop={false}
                  style={{ width: width / 2, height }}
                  source={require('~/assets/lottie/qr-wise-logo.json')}
                />
              </View>
            </Animated.View>
          </GestureHandlerRootView>
        </SnackbarProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

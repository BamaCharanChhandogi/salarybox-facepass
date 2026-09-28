import React, { useEffect, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { 
  useFonts, 
  Inter_400Regular, 
  Inter_500Medium, 
  Inter_600SemiBold, 
  Inter_700Bold 
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { Camera } from 'expo-camera';
import * as Location from 'expo-location';
import { Providers } from './src/Providers';

// Safely prevent auto hide (catch in Expo Go to avoid crashing)
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  // Request all required production permissions (Camera & Location) upfront on app launch
  useEffect(() => {
    async function requestAppPermissions() {
      try {
        await Promise.all([
          Camera.requestCameraPermissionsAsync().catch((err: any) => {
            console.warn('[App] Camera permission upfront request error:', err);
          }),
          Location.requestForegroundPermissionsAsync().catch((err: any) => {
            console.warn('[App] Location permission upfront request error:', err);
          }),
        ]);
      } catch (err: any) {
        console.warn('[App] Permissions initialization error:', err);
      }
    }

    requestAppPermissions();
  }, []);

  // Fallback timer: if fonts take longer than 1.5s, dismiss splash and render with system fonts
  useEffect(() => {
    const timer = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  if (!fontsLoaded && !fontError) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0084FF" />
      </View>
    );
  }

  return (
    <View style={styles.container} onLayout={onLayoutRootView}>
      <Providers />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
});

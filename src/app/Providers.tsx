import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { DatabaseProvider, useDatabase } from '../context/DatabaseContext';
import { AuthProvider } from '../context/AuthContext';
import { RootNavigator } from '../navigation/RootNavigator';
import { Colors } from '../constants/theme';

const InnerApp = () => {
  const { isReady } = useDatabase();

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
};

export const Providers = ({ children }: { children?: React.ReactNode }) => {
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <DatabaseProvider>
        <InnerApp />
      </DatabaseProvider>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background, // fallback color
  },
});

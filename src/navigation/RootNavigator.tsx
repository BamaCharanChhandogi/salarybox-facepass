import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useAuth } from '../context/AuthContext';
import { AdminNavigator } from './AdminNavigator';
import { StaffNavigator } from './StaffNavigator';
import { LoginScreen } from '../screens/auth/LoginScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Screen name="Login" component={LoginScreen as React.ComponentType<any>} />
      ) : user?.role === 'admin' ? (
        <Stack.Screen name="AdminTabs" component={AdminNavigator as React.ComponentType<any>} />
      ) : (
        <Stack.Screen name="StaffTabs" component={StaffNavigator as React.ComponentType<any>} />
      )}
    </Stack.Navigator>
  );
};

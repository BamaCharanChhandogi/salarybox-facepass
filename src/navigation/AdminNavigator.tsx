import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AdminStackParamList } from '../types';
import { LogOut } from 'lucide-react-native';
import { Colors } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

// Import screens
import DashboardScreen from '../screens/admin/DashboardScreen';
import StaffListScreen from '../screens/admin/StaffListScreen';
import AddStaffScreen from '../screens/admin/AddStaffScreen';
import StaffProfileScreen from '../screens/admin/StaffProfileScreen';
import FaceEnrollScreen from '../screens/admin/FaceEnrollScreen';

const Stack = createNativeStackNavigator<AdminStackParamList>();

export const AdminNavigator = () => {
  const { logout } = useAuth();
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerStyle: { backgroundColor: colors.headerBg },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="Dashboard"
        component={DashboardScreen as React.ComponentType<any>}
        options={{
          headerShown: false, // DashboardScreen has its own custom modern header
        }}
      />
      <Stack.Screen 
        name="StaffList" 
        component={StaffListScreen as React.ComponentType<any>} 
        options={{ 
          title: 'All Staff Members',
          headerBackTitle: '',
        }} 
      />
      <Stack.Screen 
        name="AddStaff" 
        component={AddStaffScreen as React.ComponentType<any>} 
        options={{ 
          title: 'Add New Staff',
          headerBackTitle: '',
        }} 
      />
      <Stack.Screen 
        name="StaffProfile" 
        component={StaffProfileScreen as React.ComponentType<any>} 
        options={{ 
          title: 'Staff Profile',
          headerBackTitle: '',
        }} 
      />
      <Stack.Screen 
        name="FaceEnroll" 
        component={FaceEnrollScreen as React.ComponentType<any>} 
        options={{ 
          headerShown: false, // FaceEnrollScreen has full camera overlay header
        }} 
      />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  logoutButton: {
    marginRight: 16,
    padding: 6,
  },
});

import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AdminStackParamList } from '../types';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

// Import screens
import DashboardScreen from '../screens/admin/DashboardScreen';
import StaffListScreen from '../screens/admin/StaffListScreen';
import AddStaffScreen from '../screens/admin/AddStaffScreen';
import StaffProfileScreen from '../screens/admin/StaffProfileScreen';
import FaceEnrollScreen from '../screens/admin/FaceEnrollScreen';

const Stack = createNativeStackNavigator<AdminStackParamList>();

export const AdminNavigator = () => {
  const { logout } = useAuth();

  return (
    <Stack.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerStyle: { backgroundColor: Colors.surface },
        headerTintColor: Colors.textPrimary,
      }}
    >
      <Stack.Screen
        name="Dashboard"
        component={DashboardScreen as React.ComponentType<any>}
        options={{
          headerRight: () => (
            <TouchableOpacity onPress={logout} style={styles.logoutButton}>
              <Ionicons name="log-out-outline" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen name="StaffList" component={StaffListScreen as React.ComponentType<any>} options={{ title: 'Staff List' }} />
      <Stack.Screen name="AddStaff" component={AddStaffScreen as React.ComponentType<any>} options={{ title: 'Add Staff' }} />
      <Stack.Screen name="StaffProfile" component={StaffProfileScreen as React.ComponentType<any>} options={{ title: 'Staff Profile' }} />
      <Stack.Screen name="FaceEnroll" component={FaceEnrollScreen as React.ComponentType<any>} options={{ title: 'Face Enrollment' }} />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  logoutButton: {
    marginRight: 16,
  },
});

import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StaffStackParamList } from '../types';
import { Camera, Clock, LogOut } from 'lucide-react-native';
import { Colors } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

// Import screens
import { AttendanceScreen } from '../screens/staff/AttendanceScreen';
import { HistoryScreen } from '../screens/staff/HistoryScreen';

const Tab = createBottomTabNavigator<StaffStackParamList>();

export const StaffNavigator = () => {
  const { logout } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: { 
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F1F5F9',
          height: 62,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerStyle: { 
          backgroundColor: '#FFFFFF',
          shadowOpacity: 0,
          elevation: 0,
        },
        headerShadowVisible: false,
        headerTintColor: Colors.textPrimary,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
          letterSpacing: -0.4,
        },
        headerRight: () => (
          <TouchableOpacity onPress={logout} style={styles.logoutButton} hitSlop={10}>
            <LogOut size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        ),
      }}
    >
      <Tab.Screen
        name="Attendance"
        component={AttendanceScreen as React.ComponentType<any>}
        options={{
          title: 'FacePass Punch',
          tabBarLabel: 'Attendance',
          tabBarIcon: ({ color, size }) => (
            <Camera size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen as React.ComponentType<any>}
        options={{
          title: 'My History',
          tabBarLabel: 'History',
          tabBarIcon: ({ color, size }) => (
            <Clock size={22} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  logoutButton: {
    marginRight: 16,
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
});

import React from 'react';
import { TouchableOpacity, StyleSheet, View, Text, Alert } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StaffStackParamList, StaffTabParamList } from '../types';
import { Camera, Clock, LogOut } from 'lucide-react-native';
import { Colors } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

// Import screens
import { AttendanceScreen } from '../screens/staff/AttendanceScreen';
import { HistoryScreen } from '../screens/staff/HistoryScreen';
import BiometricPunchScreen from '../screens/staff/BiometricPunchScreen';

const Tab = createBottomTabNavigator<StaffTabParamList>();
const Stack = createNativeStackNavigator<StaffStackParamList>();

function StaffTabs() {
  const { logout } = useAuth();
  const { colors } = useTheme();

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: logout 
        }
      ]
    );
  };

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: colors.tabBarInactive,
        tabBarStyle: { 
          backgroundColor: colors.tabBarBg,
          borderTopWidth: 1,
          borderTopColor: colors.tabBarBorder,
          height: 62,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerStyle: { 
          backgroundColor: colors.headerBg,
          shadowOpacity: 0,
          elevation: 0,
        },
        headerShadowVisible: false,
        headerTintColor: colors.textPrimary,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
          letterSpacing: -0.4,
        },
        headerRight: () => (
          <TouchableOpacity 
            onPress={handleLogout} 
            style={[styles.logoutButton, { 
              backgroundColor: colors.logoutBg, 
              borderColor: colors.logoutBorder 
            }]} 
            activeOpacity={0.8}
            hitSlop={8}
          >
            <LogOut size={15} color={colors.logoutIcon} style={{ marginRight: 4 }} />
            <Text style={[styles.logoutText, { color: colors.logoutText }]}>Exit</Text>
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
}

export const StaffNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="StaffMainTabs" 
        component={StaffTabs} 
      />
      <Stack.Screen 
        name="BiometricPunch" 
        component={BiometricPunchScreen as React.ComponentType<any>}
        options={{
          animation: 'slide_from_bottom',
        }}
      />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  logoutButton: {
    marginRight: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  logoutText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

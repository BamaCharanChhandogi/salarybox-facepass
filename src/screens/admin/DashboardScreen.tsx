import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { getTotalStaffCount, getEnrolledCount, getTodayAttendanceCount } from '../../services/database';
import { useAuth } from '../../context/AuthContext';
import { AdminStackParamList } from '../../types';

type NavigationProp = NativeStackNavigationProp<AdminStackParamList, 'Dashboard'>;

export default function DashboardScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, enrolled: 0, today: 0 });
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [])
  );

  const loadStats = async () => {
    try {
      setLoading(true);
      const total = await getTotalStaffCount();
      const enrolled = await getEnrolledCount();
      const today = await getTodayAttendanceCount();
      setStats({ total, enrolled, today });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStatCard = (title: string, value: number, icon: keyof typeof Ionicons.glyphMap, color: string) => (
    <View style={styles.statCard}>
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Hello, {user?.name || 'Admin'}</Text>
          <Text style={styles.subtitle}>Welcome to SalaryBox Admin</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
        ) : (
          <View style={styles.statsContainer}>
            {renderStatCard('Total Staff', stats.total, 'people-outline', Colors.primary)}
            {renderStatCard('Enrolled Faces', stats.enrolled, 'scan-outline', Colors.secondary)}
            {renderStatCard("Today's Check-ins", stats.today, 'checkmark-circle-outline', Colors.success || '#10B981')}
          </View>
        )}

        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.primaryButton]} 
              onPress={() => navigation.navigate('StaffList')}
            >
              <Ionicons name="people" size={24} color={Colors.surface} />
              <Text style={styles.primaryButtonText}>Manage Staff</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, styles.secondaryButton]} 
              onPress={() => navigation.navigate('AddStaff')}
            >
              <Ionicons name="person-add" size={24} color={Colors.primary} />
              <Text style={styles.secondaryButtonText}>Add Staff</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    padding: Spacing.m,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  greeting: {
    ...Typography.h1,
    color: Colors.text,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  loader: {
    marginVertical: Spacing.xxl,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    padding: Spacing.m,
    borderRadius: BorderRadius.m,
    marginHorizontal: Spacing.xs,
    alignItems: 'center',
    ...Shadows.small,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.s,
  },
  statValue: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  statTitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  actionsContainer: {
    marginTop: Spacing.m,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.m,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.m,
    borderRadius: BorderRadius.m,
    marginHorizontal: Spacing.xs,
    ...Shadows.small,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  secondaryButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  primaryButtonText: {
    ...Typography.button,
    color: Colors.surface,
    marginLeft: Spacing.s,
  },
  secondaryButtonText: {
    ...Typography.button,
    color: Colors.primary,
    marginLeft: Spacing.s,
  },
});

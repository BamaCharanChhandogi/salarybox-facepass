import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Image } from 'react-native';
import { useRoute, useNavigation, useFocusEffect, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { getStaffById, getAttendanceForUser } from '../../services/database';
import { AdminStackParamList, StaffWithEnrollment, AttendanceRecord } from '../../types';
import { resolvePhotoUri } from '../../services/fileSystem';

type ProfileRouteProp = RouteProp<AdminStackParamList, 'StaffProfile'>;
type NavigationProp = NativeStackNavigationProp<AdminStackParamList, 'StaffProfile'>;

export default function StaffProfileScreen() {
  const route = useRoute<ProfileRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { staffId } = route.params;
  
  const [staff, setStaff] = useState<StaffWithEnrollment | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const staffData = await getStaffById(staffId);
      if (staffData) setStaff(staffData);
      
      const attendanceData = await getAttendanceForUser(staffId, 10);
      setAttendance(attendanceData);
    } catch (error) {
      console.error('Failed to load profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [staffId])
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!staff) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Staff member not found</Text>
      </View>
    );
  }

  const enrollmentPhotoFullUri = staff.enrollmentPhotoUri ? resolvePhotoUri(staff.enrollmentPhotoUri) : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.profileHeader}>
          {enrollmentPhotoFullUri ? (
            <Image source={{ uri: enrollmentPhotoFullUri }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={48} color={Colors.surface} />
            </View>
          )}
          <Text style={styles.name}>{staff.name}</Text>
          <Text style={styles.employeeId}>ID: {staff.employeeId}</Text>
          <Text style={styles.createdDate}>Joined: {formatDate(staff.createdAt)}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Face Recognition</Text>
          <View style={styles.enrollmentCard}>
            <View style={styles.enrollmentStatusRow}>
              <View style={[styles.statusIndicator, staff.isEnrolled ? styles.statusEnrolled : styles.statusNotEnrolled]} />
              <Text style={styles.statusText}>
                {staff.isEnrolled ? 'Face Enrolled' : 'Face Not Enrolled'}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.enrollButton}
              onPress={() => navigation.navigate('FaceEnroll', { staffId: staff.id, staffName: staff.name })}
            >
              <Text style={styles.enrollButtonText}>
                {staff.isEnrolled ? 'Re-enrol Face' : 'Enrol Face'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Attendance (Last 10)</Text>
          {attendance.length > 0 ? (
            attendance.map((record) => {
              const selfieUri = resolvePhotoUri(record.selfieUri);
              return (
                <View key={record.id} style={styles.attendanceRecord}>
                  <View style={styles.recordLeft}>
                    {selfieUri ? (
                      <Image source={{ uri: selfieUri }} style={styles.selfieThumbnail} />
                    ) : (
                      <View style={[
                        styles.typeIconContainer, 
                        record.type === 'check_in' ? styles.checkInIcon : styles.checkOutIcon
                      ]}>
                        <Ionicons 
                          name={record.type === 'check_in' ? "log-in" : "log-out"} 
                          size={20} 
                          color={record.type === 'check_in' ? Colors.success : Colors.error} 
                        />
                      </View>
                    )}
                    <View style={styles.recordInfo}>
                      <Text style={styles.recordType}>
                        {record.type === 'check_in' ? 'Check In' : 'Check Out'}
                      </Text>
                      <Text style={styles.recordDate}>{formatDate(record.timestamp)} • {formatTime(record.timestamp)}</Text>
                      {record.address && (
                        <Text style={styles.recordAddress} numberOfLines={1}>
                          📍 {record.address}
                        </Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.recordRight}>
                    <View style={styles.scorePill}>
                      <Text style={styles.scorePillText}>
                        {(record.matchConfidence * 100).toFixed(0)}%
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyAttendance}>
              <Text style={styles.emptyAttendanceText}>No attendance records found</Text>
            </View>
          )}
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  errorText: {
    ...Typography.body,
    color: Colors.error,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: Spacing.l,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.m,
    ...Shadows.small,
    marginBottom: Spacing.m,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: Spacing.m,
  },
  avatarPlaceholder: {
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    ...Typography.h2,
    color: Colors.text,
  },
  employeeId: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  createdDate: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  section: {
    marginTop: Spacing.m,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.s,
  },
  enrollmentCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.m,
    borderRadius: BorderRadius.m,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadows.small,
  },
  enrollmentStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Spacing.s,
  },
  statusEnrolled: {
    backgroundColor: '#10B981',
  },
  statusNotEnrolled: {
    backgroundColor: '#F59E0B',
  },
  statusText: {
    ...Typography.bodyMedium,
    color: Colors.text,
  },
  enrollButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    borderRadius: BorderRadius.s,
  },
  enrollButtonText: {
    ...Typography.smallMedium,
    color: Colors.surface,
  },
  attendanceRecord: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.m,
    borderRadius: BorderRadius.m,
    marginBottom: Spacing.s,
    ...Shadows.small,
  },
  recordLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.sm,
  },
  selfieThumbnail: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: Spacing.m,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  recordInfo: {
    flex: 1,
  },
  recordAddress: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  scorePill: {
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.s,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  scorePillText: {
    ...Typography.captionMedium,
    color: Colors.primary,
  },
  typeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    marginRight: Spacing.m,
  },
  checkInIcon: {
    backgroundColor: '#D1FAE5',
  },
  checkOutIcon: {
    backgroundColor: '#FEE2E2',
  },
  recordType: {
    ...Typography.bodyMedium,
    color: Colors.text,
  },
  recordDate: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  recordRight: {
    alignItems: 'flex-end',
  },
  recordTime: {
    ...Typography.bodySemiBold,
    color: Colors.text,
  },
  recordMatch: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  emptyAttendance: {
    padding: Spacing.l,
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.m,
  },
  emptyAttendanceText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
});

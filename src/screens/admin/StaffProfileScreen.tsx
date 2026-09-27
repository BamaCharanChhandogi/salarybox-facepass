import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation, useFocusEffect, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { 
  User, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  MapPin, 
  ScanFace, 
  Clock, 
  ShieldCheck, 
  ArrowUpRight,
  Sparkles
} from 'lucide-react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { getStaffById, getAttendanceForUser } from '../../services/database';
import { AdminStackParamList, StaffWithEnrollment, AttendanceRecord } from '../../types';
import { resolvePhotoUri } from '../../services/fileSystem';

type ProfileRouteProp = RouteProp<AdminStackParamList, 'StaffProfile'>;
type NavigationProp = NativeStackNavigationProp<AdminStackParamList, 'StaffProfile'>;

export default function StaffProfileScreen() {
  const insets = useSafeAreaInsets();
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
        <AlertCircle size={40} color={Colors.error} />
        <Text style={styles.errorText}>Staff member not found</Text>
      </View>
    );
  }

  const enrollmentPhotoFullUri = staff.enrollmentPhotoUri ? resolvePhotoUri(staff.enrollmentPhotoUri) : null;

  return (
    <View style={styles.safeArea}>
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: Math.max(insets.bottom, 16) + 30 }]}>
        
        {/* Profile Header Card */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarWrapper}>
            {enrollmentPhotoFullUri ? (
              <Image source={{ uri: enrollmentPhotoFullUri }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <User size={40} color="#94A3B8" />
              </View>
            )}
            <View style={[
              styles.avatarBadge,
              staff.isEnrolled ? styles.avatarBadgeActive : styles.avatarBadgePending
            ]}>
              {staff.isEnrolled ? (
                <CheckCircle2 size={14} color="#FFFFFF" />
              ) : (
                <AlertCircle size={14} color="#FFFFFF" />
              )}
            </View>
          </View>

          <Text style={styles.name}>{staff.name}</Text>
          
          <View style={styles.idBadgeRow}>
            <View style={styles.idBadge}>
              <Text style={styles.idBadgeText}>ID: {staff.employeeId}</Text>
            </View>
            <View style={styles.dotSeparator} />
            <View style={styles.joinedBadge}>
              <Calendar size={12} color="#64748B" style={{ marginRight: 4 }} />
              <Text style={styles.joinedText}>Joined {formatDate(staff.createdAt)}</Text>
            </View>
          </View>
        </View>

        {/* Biometrics Card */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Biometric Registration</Text>
          <View style={styles.biometricCard}>
            <View style={styles.biometricLeft}>
              <View style={[
                styles.biometricIconBox,
                staff.isEnrolled ? styles.biometricIconBoxSuccess : styles.biometricIconBoxWarning
              ]}>
                <ScanFace size={22} color={staff.isEnrolled ? '#0D9488' : '#D97706'} />
              </View>
              <View style={styles.biometricTextContainer}>
                <Text style={styles.biometricTitle}>
                  {staff.isEnrolled ? 'Face Registered' : 'Biometrics Missing'}
                </Text>
                <Text style={styles.biometricSubtitle}>
                  {staff.isEnrolled 
                    ? '1:1 facial matching active for attendance' 
                    : 'Staff cannot punch until face is enrolled'}
                </Text>
              </View>
            </View>

            <TouchableOpacity 
              style={[
                styles.biometricActionBtn,
                staff.isEnrolled ? styles.biometricActionBtnSecondary : styles.biometricActionBtnPrimary
              ]}
              onPress={() => navigation.navigate('FaceEnroll', { staffId: staff.id, staffName: staff.name })}
              activeOpacity={0.85}
            >
              <Text style={[
                styles.biometricActionBtnText,
                staff.isEnrolled ? styles.biometricActionBtnTextSecondary : styles.biometricActionBtnTextPrimary
              ]}>
                {staff.isEnrolled ? 'Re-enrol' : 'Enrol Face'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Attendance Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeader}>Attendance History</Text>
            <Text style={styles.sectionSubCount}>{attendance.length} recent logs</Text>
          </View>

          {attendance.length > 0 ? (
            attendance.map((record) => {
              const selfieUri = resolvePhotoUri(record.selfieUri);
              const isCheckIn = record.type === 'check_in';
              return (
                <View key={record.id} style={styles.attendanceCard}>
                  <View style={styles.attendanceThumbBox}>
                    {selfieUri ? (
                      <Image source={{ uri: selfieUri }} style={styles.selfieThumbnail} />
                    ) : (
                      <View style={[styles.typeIconFallback, isCheckIn ? styles.checkInIcon : styles.checkOutIcon]}>
                        <Clock size={18} color={isCheckIn ? '#059669' : '#0284C7'} />
                      </View>
                    )}
                  </View>

                  <View style={styles.attendanceDetails}>
                    <View style={styles.badgeRow}>
                      <View style={[
                        styles.punchBadge, 
                        isCheckIn ? styles.punchBadgeCheckIn : styles.punchBadgeCheckOut
                      ]}>
                        <Text style={[
                          styles.punchBadgeText,
                          isCheckIn ? styles.punchBadgeCheckInText : styles.punchBadgeCheckOutText
                        ]}>
                          {isCheckIn ? 'CHECK IN' : 'CHECK OUT'}
                        </Text>
                      </View>
                      <Text style={styles.attendanceTime}>{formatTime(record.timestamp)}</Text>
                    </View>

                    <Text style={styles.attendanceDate}>{formatDate(record.timestamp)}</Text>

                    {record.address ? (
                      <View style={styles.locationRow}>
                        <MapPin size={12} color="#64748B" style={{ marginRight: 4, marginTop: 1 }} />
                        <Text style={styles.attendanceAddress} numberOfLines={1}>
                          {record.address}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.matchScoreBox}>
                    <Text style={styles.matchScoreNumber}>
                      {(record.matchConfidence * 100).toFixed(0)}%
                    </Text>
                    <Text style={styles.matchScoreLabel}>Match</Text>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyCard}>
              <Clock size={32} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No Attendance Activity</Text>
              <Text style={styles.emptySubtitle}>
                No punches recorded yet for this staff member.
              </Text>
            </View>
          )}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    padding: Spacing.md,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: Spacing.xl,
  },
  errorText: {
    fontSize: 15,
    color: Colors.error,
    marginTop: 8,
    fontWeight: '600',
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...Shadows.sm,
    marginBottom: Spacing.md,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: '#F1F5F9',
  },
  avatarPlaceholder: {
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarBadgeActive: {
    backgroundColor: '#10B981',
  },
  avatarBadgePending: {
    backgroundColor: '#F59E0B',
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  idBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  idBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  idBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  dotSeparator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 8,
  },
  joinedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  joinedText: {
    fontSize: 12,
    color: '#64748B',
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  sectionSubCount: {
    fontSize: 12,
    color: '#94A3B8',
  },
  biometricCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...Shadows.sm,
  },
  biometricLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  biometricIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  biometricIconBoxSuccess: {
    backgroundColor: '#CCFBF1',
  },
  biometricIconBoxWarning: {
    backgroundColor: '#FEF3C7',
  },
  biometricTextContainer: {
    flex: 1,
  },
  biometricTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  biometricSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  biometricActionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
  },
  biometricActionBtnPrimary: {
    backgroundColor: Colors.primary,
  },
  biometricActionBtnSecondary: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  biometricActionBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  biometricActionBtnTextPrimary: {
    color: '#FFFFFF',
  },
  biometricActionBtnTextSecondary: {
    color: Colors.textPrimary,
  },
  attendanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.xs + 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...Shadows.sm,
  },
  attendanceThumbBox: {
    marginRight: Spacing.md,
  },
  selfieThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  typeIconFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkInIcon: {
    backgroundColor: '#ECFDF5',
  },
  checkOutIcon: {
    backgroundColor: '#F0F9FF',
  },
  attendanceDetails: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  punchBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  punchBadgeCheckIn: {
    backgroundColor: '#DCFCE7',
  },
  punchBadgeCheckOut: {
    backgroundColor: '#E0F2FE',
  },
  punchBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  punchBadgeCheckInText: {
    color: '#15803D',
  },
  punchBadgeCheckOutText: {
    color: '#0369A1',
  },
  attendanceTime: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  attendanceDate: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attendanceAddress: {
    fontSize: 11,
    color: '#64748B',
    flex: 1,
  },
  matchScoreBox: {
    alignItems: 'center',
    paddingLeft: 8,
  },
  matchScoreNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  matchScoreLabel: {
    fontSize: 10,
    color: '#94A3B8',
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.xl,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});

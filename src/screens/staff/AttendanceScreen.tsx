import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Image,
  Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { 
  ScanFace, 
  Clock, 
  MapPin, 
  LogOut,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Lock
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { getLatestAttendance, getAttendanceForUser, getFaceEnrollment } from '../../services/database';
import { resolvePhotoUri } from '../../services/fileSystem';
import { AttendanceType, AttendanceRecord, StaffStackParamList } from '../../types';
import { formatTime, formatDate } from '../../utils/dateFormat';

type NavigationProp = NativeStackNavigationProp<StaffStackParamList>;

function getPunctualityStatus(timestamp: string, type: AttendanceType) {
  if (type === 'check_out') {
    return { label: 'Shift Ended', color: '#0369A1', bg: '#E0F2FE' };
  }
  const d = new Date(timestamp);
  const totalMinutes = d.getHours() * 60 + d.getMinutes();
  // 09:45 AM = 585 minutes; 01:00 PM = 780 minutes
  if (totalMinutes <= 585) {
    return { label: 'On Time', color: '#059669', bg: '#ECFDF5' };
  } else if (totalMinutes <= 780) {
    return { label: 'Late Mark', color: '#D97706', bg: '#FEF3C7' };
  } else {
    return { label: 'Half Day', color: '#EA580C', bg: '#FFEDD5' };
  }
}

export function AttendanceScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  
  const [latestRecord, setLatestRecord] = useState<AttendanceRecord | null>(null);
  const [recentRecords, setRecentRecords] = useState<AttendanceRecord[]>([]);
  const [isEnrolled, setIsEnrolled] = useState<boolean>(true);

  const loadAttendanceData = useCallback(async () => {
    if (user) {
      const enrollment = await getFaceEnrollment(user.id);
      setIsEnrolled(!!enrollment);
      const latest = await getLatestAttendance(user.id);
      const recent = await getAttendanceForUser(user.id, 5);
      setLatestRecord(latest);
      setRecentRecords(recent);
    }
  }, [user]);

  // Automatically refresh latest records whenever returning to this screen
  useFocusEffect(
    useCallback(() => {
      loadAttendanceData();
    }, [loadAttendanceData])
  );

  const isCheckedInToday = !!latestRecord && 
    new Date(latestRecord.timestamp).toDateString() === new Date().toDateString() &&
    latestRecord.type === 'check_in';

  // Calculate live shift elapsed time
  let shiftDurationStr = '';
  if (isCheckedInToday && latestRecord) {
    const elapsedMinutes = Math.max(0, Math.floor((Date.now() - new Date(latestRecord.timestamp).getTime()) / 60000));
    const hours = Math.floor(elapsedMinutes / 60);
    const mins = elapsedMinutes % 60;
    shiftDurationStr = `${hours}h ${mins}m`;
  }

  const handleStartAttendance = (type: AttendanceType) => {
    if (!isEnrolled) {
      Alert.alert(
        'Face Profile Required',
        'Your face has not been enrolled in the company system yet. Please ask your Workspace Admin to complete your Biometric Face Enrollment.',
        [{ text: 'Understood', style: 'default' }]
      );
      return;
    }

    if (type === 'check_in' && isCheckedInToday) {
      Alert.alert(
        'Shift Already Active',
        `You have already checked in today at ${formatTime(latestRecord!.timestamp)}. If your work shift is completed, please select Punch Check Out.`,
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    if (type === 'check_out' && !isCheckedInToday) {
      Alert.alert(
        'Check-In Required',
        'You have not checked in yet today. You must record your Check In before punching Check Out.',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    navigation.navigate('BiometricPunch', { punchType: type });
  };

  const today = new Date();
  const dayNumber = today.getDate();
  const monthName = today.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 16) + 30 }]}>
        
        {/* Top Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.headerInfo}>
            <Text style={styles.greetingText}>Welcome back,</Text>
            <Text style={styles.userNameText}>{user?.name}</Text>
            <View style={styles.badgeRow}>
              <View style={styles.empIdBadge}>
                <Text style={styles.empIdBadgeText}>ID: {user?.employeeId}</Text>
              </View>
              <View style={styles.statusPill}>
                <View style={[styles.statusDot, isCheckedInToday ? styles.statusDotActive : styles.statusDotInactive]} />
                <Text style={styles.statusPillText}>
                  {isCheckedInToday ? 'Checked In' : 'Pending Punch'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.dateBox}>
            <Text style={styles.dateDay}>{dayNumber}</Text>
            <Text style={styles.dateMonth}>{monthName}</Text>
          </View>
        </View>

        {/* Live Active Shift Banner */}
        {isCheckedInToday && latestRecord && (
          <View style={styles.activeShiftBanner}>
            <View style={styles.activeShiftDotPulse}>
              <View style={styles.activeShiftDotInner} />
            </View>
            <View style={styles.activeShiftContent}>
              <View style={styles.activeShiftTitleRow}>
                <Text style={styles.activeShiftTitle}>Shift In Progress</Text>
                <View style={styles.activeShiftTimerBadge}>
                  <Clock size={11} color="#059669" style={{ marginRight: 3 }} />
                  <Text style={styles.activeShiftTimerText}>{shiftDurationStr}</Text>
                </View>
              </View>
              <Text style={styles.activeShiftDesc}>
                Checked in at {formatTime(latestRecord.timestamp)} • Ready for check out
              </Text>
            </View>
          </View>
        )}

        {/* Un-enrolled Staff Warning Banner */}
        {!isEnrolled && (
          <View style={styles.unenrolledBanner}>
            <View style={styles.unenrolledBannerIconCircle}>
              <AlertTriangle size={18} color="#D97706" />
            </View>
            <View style={styles.unenrolledBannerContent}>
              <Text style={styles.unenrolledBannerTitle}>Biometric Face Profile Required</Text>
              <Text style={styles.unenrolledBannerDesc}>
                Your 3D face scan has not been enrolled yet. Please ask your Workspace Admin to enroll your face in the Admin Dashboard before marking attendance.
              </Text>
            </View>
          </View>
        )}

        {/* Punch CTAs Grid with Strict State Machine Logic */}
        <Text style={styles.sectionHeader}>Biometric Attendance</Text>
        <View style={styles.actionGrid}>
          
          {/* Check In Card: ACTIVE when not checked in, DISABLED when checked in */}
          <TouchableOpacity 
            style={[
              styles.punchCard, 
              styles.checkInCard,
              isCheckedInToday && styles.punchCardDisabled
            ]}
            onPress={() => handleStartAttendance('check_in')}
            activeOpacity={isCheckedInToday ? 0.9 : 0.85}
          >
            <View style={[
              styles.punchIconCircleCheckIn,
              isCheckedInToday && styles.punchIconCircleDisabled
            ]}>
              {isCheckedInToday ? (
                <CheckCircle2 size={24} color="#64748B" />
              ) : (
                <ScanFace size={26} color="#0D9488" />
              )}
            </View>
            <Text style={[styles.punchTitle, isCheckedInToday && styles.punchTitleDisabled]}>
              {isCheckedInToday ? 'Checked In' : 'Punch Check In'}
            </Text>
            <View style={[
              styles.statePill,
              isCheckedInToday ? styles.statePillActive : styles.statePillReady
            ]}>
              <Text style={[
                styles.statePillText,
                isCheckedInToday ? styles.statePillActiveText : styles.statePillReadyText
              ]}>
                {isCheckedInToday ? 'Already on shift' : 'Start Shift'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Check Out Card: ACTIVE when checked in, DISABLED when not checked in */}
          <TouchableOpacity 
            style={[
              styles.punchCard, 
              styles.checkOutCard,
              !isCheckedInToday && styles.punchCardDisabled
            ]}
            onPress={() => handleStartAttendance('check_out')}
            activeOpacity={!isCheckedInToday ? 0.9 : 0.85}
          >
            <View style={[
              styles.punchIconCircleCheckOut,
              !isCheckedInToday && styles.punchIconCircleDisabled
            ]}>
              {!isCheckedInToday ? (
                <Lock size={22} color="#64748B" />
              ) : (
                <LogOut size={24} color="#0284C7" />
              )}
            </View>
            <Text style={[styles.punchTitle, !isCheckedInToday && styles.punchTitleDisabled]}>
              Punch Check Out
            </Text>
            <View style={[
              styles.statePill,
              !isCheckedInToday ? styles.statePillLocked : styles.statePillActive
            ]}>
              <Text style={[
                styles.statePillText,
                !isCheckedInToday ? styles.statePillLockedText : styles.statePillActiveText
              ]}>
                {!isCheckedInToday ? 'Check in first' : 'End Shift'}
              </Text>
            </View>
          </TouchableOpacity>

        </View>

        {/* Recent Attendance Activity */}
        <View style={styles.historyHeaderRow}>
          <Text style={styles.sectionHeader}>Recent Activity</Text>
          <Text style={styles.historySubheader}>Last 5 logs</Text>
        </View>

        {recentRecords.length === 0 ? (
          <View style={styles.emptyCard}>
            <Clock size={36} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No Activity Recorded</Text>
            <Text style={styles.emptySubtitle}>Punch check in to log your attendance for today.</Text>
          </View>
        ) : (
          recentRecords.map((record) => {
            const resolvedSelfie = resolvePhotoUri(record.selfieUri);
            const isCheckIn = record.type === 'check_in';
            const punctuality = getPunctualityStatus(record.timestamp, record.type);

            return (
              <View key={record.id} style={styles.historyCard}>
                <View style={styles.historyThumbBox}>
                  {resolvedSelfie ? (
                    <Image source={{ uri: resolvedSelfie }} style={styles.historyThumb} />
                  ) : (
                    <View style={[styles.typeIconFallback, isCheckIn ? styles.checkInIcon : styles.checkOutIcon]}>
                      <Clock size={18} color={isCheckIn ? '#059669' : '#0284C7'} />
                    </View>
                  )}
                </View>

                <View style={styles.historyDetails}>
                  <View style={styles.historyBadgeRow}>
                    <View style={[
                      styles.typePill, 
                      isCheckIn ? styles.typeCheckIn : styles.typeCheckOut
                    ]}>
                      <Text style={[
                        styles.typePillText,
                        isCheckIn ? styles.typeCheckInText : styles.typeCheckOutText
                      ]}>
                        {isCheckIn ? 'CHECK IN' : 'CHECK OUT'}
                      </Text>
                    </View>
                    <View style={[styles.punctualityPill, { backgroundColor: punctuality.bg }]}>
                      <Text style={[styles.punctualityText, { color: punctuality.color }]}>
                        {punctuality.label}
                      </Text>
                    </View>
                    <Text style={styles.historyTime}>{formatTime(record.timestamp)}</Text>
                  </View>

                  <Text style={styles.historyDate}>{formatDate(record.timestamp)}</Text>
                  
                  {record.address && (
                    <View style={styles.locationRow}>
                      <MapPin size={11} color="#64748B" style={{ marginRight: 3, marginTop: 1 }} />
                      <Text style={styles.historyAddress} numberOfLines={1}>
                        {record.address}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.matchScoreBadge}>
                  <Text style={styles.matchScoreText}>
                    {Math.round(record.matchConfidence * 100)}%
                  </Text>
                  <Text style={styles.matchScoreLabel}>Match</Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: Spacing.md,
  },
  headerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...Shadows.sm,
  },
  headerInfo: {
    flex: 1,
  },
  greetingText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  userNameText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  empIdBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  empIdBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusDotActive: {
    backgroundColor: '#10B981',
  },
  statusDotInactive: {
    backgroundColor: '#94A3B8',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  dateBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: BorderRadius.lg,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  dateDay: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  dateMonth: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: 1,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  punchCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    ...Shadows.sm,
  },
  checkInCard: {
    borderColor: '#CCFBF1',
  },
  checkOutCard: {
    borderColor: '#E0F2FE',
  },
  punchIconCircleCheckIn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F0FDFA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  punchIconCircleCheckOut: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  punchTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  historyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  historySubheader: {
    fontSize: 12,
    color: '#94A3B8',
  },
  historyCard: {
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
  historyThumbBox: {
    marginRight: Spacing.md,
  },
  historyThumb: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  typeIconFallback: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkInIcon: {
    backgroundColor: '#ECFDF5',
  },
  checkOutIcon: {
    backgroundColor: '#F0F9FF',
  },
  historyDetails: {
    flex: 1,
  },
  historyBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  typePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeCheckIn: {
    backgroundColor: '#DCFCE7',
  },
  typeCheckOut: {
    backgroundColor: '#E0F2FE',
  },
  typePillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  typeCheckInText: {
    color: '#15803D',
  },
  typeCheckOutText: {
    color: '#0369A1',
  },
  historyTime: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  historyDate: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyAddress: {
    fontSize: 11,
    color: '#64748B',
    flex: 1,
  },
  matchScoreBadge: {
    alignItems: 'center',
    paddingLeft: 8,
  },
  matchScoreText: {
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
    borderRadius: BorderRadius.xl,
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
  unenrolledBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFBEB',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  unenrolledBannerIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  unenrolledBannerContent: {
    flex: 1,
  },
  unenrolledBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 2,
  },
  unenrolledBannerDesc: {
    fontSize: 11,
    color: '#B45309',
    lineHeight: 16,
  },
  activeShiftBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  activeShiftDotPulse: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeShiftDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#16A34A',
  },
  activeShiftContent: {
    flex: 1,
  },
  activeShiftTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  activeShiftTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
  },
  activeShiftTimerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  activeShiftTimerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  activeShiftDesc: {
    fontSize: 11,
    color: '#166534',
  },
  punchCardDisabled: {
    opacity: 0.48,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  punchIconCircleDisabled: {
    backgroundColor: '#E2E8F0',
  },
  punchTitleDisabled: {
    color: '#64748B',
  },
  statePill: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  statePillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statePillReady: {
    backgroundColor: '#CCFBF1',
  },
  statePillReadyText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0F766E',
  },
  statePillActive: {
    backgroundColor: '#E0F2FE',
  },
  statePillActiveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0369A1',
  },
  statePillLocked: {
    backgroundColor: '#F1F5F9',
  },
  statePillLockedText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  punctualityPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 6,
  },
  punctualityText: {
    fontSize: 10,
    fontWeight: '700',
  },
});

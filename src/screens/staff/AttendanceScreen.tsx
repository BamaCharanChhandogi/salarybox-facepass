import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Image
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { 
  ScanFace, 
  Clock, 
  MapPin, 
  LogOut,
  ChevronRight
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { getLatestAttendance, getAttendanceForUser } from '../../services/database';
import { resolvePhotoUri } from '../../services/fileSystem';
import { AttendanceType, AttendanceRecord, StaffStackParamList } from '../../types';
import { formatTime, formatDate } from '../../utils/dateFormat';

type NavigationProp = NativeStackNavigationProp<StaffStackParamList>;

export function AttendanceScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  
  const [latestRecord, setLatestRecord] = useState<AttendanceRecord | null>(null);
  const [recentRecords, setRecentRecords] = useState<AttendanceRecord[]>([]);

  const loadAttendanceData = useCallback(async () => {
    if (user) {
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

  const handleStartAttendance = (type: AttendanceType) => {
    navigation.navigate('BiometricPunch', { punchType: type });
  };

  const isCheckedInToday = latestRecord && 
    new Date(latestRecord.timestamp).toDateString() === new Date().toDateString() &&
    latestRecord.type === 'check_in';

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

        {/* Punch CTAs Grid */}
        <Text style={styles.sectionHeader}>Biometric Attendance</Text>
        <View style={styles.actionGrid}>
          
          {/* Check In Card */}
          <TouchableOpacity 
            style={[styles.punchCard, styles.checkInCard]}
            onPress={() => handleStartAttendance('check_in')}
            activeOpacity={0.85}
          >
            <View style={styles.punchIconCircleCheckIn}>
              <ScanFace size={26} color="#0D9488" />
            </View>
            <Text style={styles.punchTitle}>Punch Check In</Text>
          </TouchableOpacity>

          {/* Check Out Card */}
          <TouchableOpacity 
            style={[styles.punchCard, styles.checkOutCard]}
            onPress={() => handleStartAttendance('check_out')}
            activeOpacity={0.85}
          >
            <View style={styles.punchIconCircleCheckOut}>
              <LogOut size={24} color="#0284C7" />
            </View>
            <Text style={styles.punchTitle}>Punch Check Out</Text>
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
});

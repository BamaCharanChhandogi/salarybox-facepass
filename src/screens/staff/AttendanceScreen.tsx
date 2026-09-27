import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  SafeAreaView, 
  ActivityIndicator,
  ScrollView,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { CameraView } from '../../components/camera/CameraView';
import { getFaceEnrollment, recordAttendance, getLatestAttendance, getAttendanceForUser } from '../../services/database';
import { getCurrentLocation } from '../../services/location';
import { verifyFaceMatch } from '../../services/faceRecognition';
import { saveSelfie, resolvePhotoUri } from '../../services/fileSystem';
import { AttendanceType, AttendanceRecord } from '../../types';
import { formatTime, formatDate } from '../../utils/dateFormat';

export function AttendanceScreen() {
  const { user } = useAuth();
  const [showCamera, setShowCamera] = useState(false);
  const [attendanceType, setAttendanceType] = useState<AttendanceType>('check_in');
  const [processing, setProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('Verifying Face with Face++ AI...');
  const [latestRecord, setLatestRecord] = useState<AttendanceRecord | null>(null);
  const [recentRecords, setRecentRecords] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    if (user) {
      loadAttendanceData();
    }
  }, [user]);

  const loadAttendanceData = async () => {
    if (user) {
      const latest = await getLatestAttendance(user.id);
      const recent = await getAttendanceForUser(user.id, 5);
      setLatestRecord(latest);
      setRecentRecords(recent);
    }
  };

  const handleStartAttendance = (type: AttendanceType) => {
    setAttendanceType(type);
    setShowCamera(true);
  };

  const handleCapture = async (photoUri: string) => {
    setShowCamera(false);
    if (!user) return;

    try {
      setProcessing(true);
      setProcessingStatus('Checking biometric enrollment profile...');

      // 1. Check if user is enrolled
      const enrollment = await getFaceEnrollment(user.id);
      if (!enrollment || !enrollment.enrollmentPhotoUri) {
        Alert.alert(
          'Face Profile Not Enrolled',
          'Your biometric face profile is not registered yet. Please request your Admin to enrol your face before marking attendance.'
        );
        setProcessing(false);
        return;
      }

      // 2. Resolve enrolled photo file path
      const enrolledPhotoPath = resolvePhotoUri(enrollment.enrollmentPhotoUri);
      if (!enrolledPhotoPath) {
        Alert.alert('Error', 'Enrolled face photo file could not be found.');
        setProcessing(false);
        return;
      }

      setProcessingStatus('Comparing selfie with enrolled face via Face++ AI...');

      // 3. Real Face++ 1:1 facial comparison
      const matchResult = await verifyFaceMatch(photoUri, enrolledPhotoPath);

      if (!matchResult.matched) {
        const scoreText = matchResult.rawConfidence !== undefined 
          ? `(Match Confidence: ${matchResult.rawConfidence.toFixed(1)}% / Required: 70%)` 
          : '';
        Alert.alert(
          'Biometric Verification Failed ❌',
          matchResult.error || `Your face did not match the registered profile ${scoreText}. Please face the camera directly in good lighting and try again.`
        );
        setProcessing(false);
        return;
      }

      setProcessingStatus('Acquiring verified GPS coordinates & address...');

      // 4. Fetch GPS and reverse-geocoded location
      let location = { latitude: 0, longitude: 0, address: 'Unknown Location' };
      try {
        const loc = await getCurrentLocation();
        location = {
          latitude: loc.latitude,
          longitude: loc.longitude,
          address: loc.address || `${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`
        };
      } catch (locErr) {
        console.warn('GPS location error:', locErr);
        location.address = 'Location permission unavailable';
      }

      setProcessingStatus('Saving attendance log and selfie snapshot...');

      // 5. Save selfie locally
      const savedSelfieRelativePath = await saveSelfie(user.id, photoUri);

      // 6. Record to SQLite Database
      await recordAttendance(
        user.id,
        attendanceType,
        savedSelfieRelativePath,
        location.latitude,
        location.longitude,
        matchResult.confidence,
        location.address
      );

      // 7. Show success confirmation
      const actionName = attendanceType === 'check_in' ? 'Check In' : 'Check Out';
      Alert.alert(
        'Attendance Verified! ✅',
        `${actionName} recorded successfully.\n\n` +
        `• Time: ${formatTime(new Date().toISOString())}\n` +
        `• Match Score: ${(matchResult.rawConfidence ?? 90).toFixed(1)}%\n` +
        `• Location: ${location.address}`,
        [{ text: 'OK' }]
      );

      loadAttendanceData();

    } catch (error: any) {
      console.error('[Attendance] Verification error:', error);
      Alert.alert('Attendance Error', error.message || 'Verification process failed');
    } finally {
      setProcessing(false);
    }
  };

  if (showCamera) {
    return (
      <CameraView 
        onCapture={handleCapture} 
        onClose={() => setShowCamera(false)}
        mode="verify" 
        promptMessage="Align your face to verify and punch"
      />
    );
  }

  const isCheckedInToday = latestRecord && 
    new Date(latestRecord.timestamp).toDateString() === new Date().toDateString() &&
    latestRecord.type === 'check_in';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Top Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.headerInfo}>
            <Text style={styles.greetingText}>Welcome back,</Text>
            <Text style={styles.userNameText}>{user?.name}</Text>
            <Text style={styles.empIdBadge}>ID: {user?.employeeId}</Text>
          </View>
          <View style={styles.dateBox}>
            <Text style={styles.dateDay}>{new Date().getDate()}</Text>
            <Text style={styles.dateMonth}>
              {new Date().toLocaleString('en-US', { month: 'short' }).toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Live Attendance Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={[styles.statusIndicator, isCheckedInToday ? styles.statusGreen : styles.statusAmber]} />
            <Text style={styles.statusCardTitle}>
              {isCheckedInToday ? 'Currently Checked In' : 'Not Checked In Today'}
            </Text>
          </View>
          {latestRecord ? (
            <Text style={styles.statusSubtext}>
              Last punch: {latestRecord.type === 'check_in' ? 'Check In' : 'Check Out'} at {formatTime(latestRecord.timestamp)} ({formatDate(latestRecord.timestamp)})
            </Text>
          ) : (
            <Text style={styles.statusSubtext}>No attendance logged yet today.</Text>
          )}
        </View>

        {/* Biometric Punch Action Cards */}
        <Text style={styles.sectionHeader}>Mark Your Attendance</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity 
            style={[styles.punchButton, styles.checkInGradient]}
            onPress={() => handleStartAttendance('check_in')}
            activeOpacity={0.85}
          >
            <View style={styles.punchIconCircle}>
              <Ionicons name="scan" size={28} color="#00D2B4" />
            </View>
            <Text style={styles.punchButtonTitle}>Punch Check In</Text>
            <Text style={styles.punchButtonSubtitle}>Selfie + GPS verification</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.punchButton, styles.checkOutGradient]}
            onPress={() => handleStartAttendance('check_out')}
            activeOpacity={0.85}
          >
            <View style={styles.punchIconCircle}>
              <Ionicons name="log-out-outline" size={28} color="#0084FF" />
            </View>
            <Text style={styles.punchButtonTitle}>Punch Check Out</Text>
            <Text style={styles.punchButtonSubtitle}>Selfie + GPS verification</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Attendance Activity */}
        <View style={styles.historyHeaderRow}>
          <Text style={styles.sectionHeader}>Recent Punches</Text>
          <Text style={styles.historySubheader}>Last 5 activity logs</Text>
        </View>

        {recentRecords.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="time-outline" size={36} color={Colors.textTertiary} />
            <Text style={styles.emptyText}>No recent punch records found</Text>
          </View>
        ) : (
          recentRecords.map((record) => {
            const resolvedSelfie = resolvePhotoUri(record.selfieUri);
            return (
              <View key={record.id} style={styles.historyCard}>
                <View style={styles.historyThumbBox}>
                  {resolvedSelfie ? (
                    <Image source={{ uri: resolvedSelfie }} style={styles.historyThumb} />
                  ) : (
                    <Ionicons name="person-circle-outline" size={40} color={Colors.textSecondary} />
                  )}
                </View>
                <View style={styles.historyDetails}>
                  <View style={styles.historyBadgeRow}>
                    <View style={[
                      styles.typePill, 
                      record.type === 'check_in' ? styles.typeCheckIn : styles.typeCheckOut
                    ]}>
                      <Text style={[
                        styles.typePillText,
                        record.type === 'check_in' ? styles.typeCheckInText : styles.typeCheckOutText
                      ]}>
                        {record.type === 'check_in' ? 'CHECK IN' : 'CHECK OUT'}
                      </Text>
                    </View>
                    <Text style={styles.historyTime}>{formatTime(record.timestamp)}</Text>
                  </View>
                  <Text style={styles.historyDate}>{formatDate(record.timestamp)}</Text>
                  {record.address && (
                    <Text style={styles.historyAddress} numberOfLines={1}>
                      📍 {record.address}
                    </Text>
                  )}
                </View>
                <View style={styles.matchScoreBadge}>
                  <Text style={styles.matchScoreText}>
                    {Math.round(record.matchConfidence * 100)}%
                  </Text>
                  <Text style={styles.matchScoreLabel}>AI match</Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Processing Loader Modal */}
      {processing && (
        <View style={styles.processingOverlay}>
          <View style={styles.processingCard}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.processingTitle}>Verifying Biometrics</Text>
            <Text style={styles.processingSubtitle}>{processingStatus}</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  headerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  headerInfo: {
    flex: 1,
  },
  greetingText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  userNameText: {
    ...Typography.h2,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  empIdBadge: {
    ...Typography.smallMedium,
    color: Colors.primary,
    marginTop: 4,
  },
  dateBox: {
    backgroundColor: '#F0F9FF',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  dateDay: {
    ...Typography.h2,
    color: Colors.primary,
  },
  dateMonth: {
    ...Typography.smallMedium,
    color: Colors.primaryDark,
  },
  statusCard: {
    backgroundColor: 'white',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    ...Shadows.sm,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: Spacing.sm,
  },
  statusGreen: {
    backgroundColor: Colors.secondary,
  },
  statusAmber: {
    backgroundColor: '#F59E0B',
  },
  statusCardTitle: {
    ...Typography.bodySemiBold,
    color: Colors.textPrimary,
  },
  statusSubtext: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  sectionHeader: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  punchButton: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.md,
  },
  checkInGradient: {
    borderTopWidth: 4,
    borderTopColor: '#00D2B4',
  },
  checkOutGradient: {
    borderTopWidth: 4,
    borderTopColor: '#0084FF',
  },
  punchIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  punchButtonTitle: {
    ...Typography.bodySemiBold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  punchButtonSubtitle: {
    ...Typography.small,
    color: Colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  historyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  historySubheader: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  historyThumbBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  historyThumb: {
    width: 48,
    height: 48,
  },
  historyDetails: {
    flex: 1,
  },
  historyBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  typePill: {
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  typeCheckIn: {
    backgroundColor: '#E6FFFA',
  },
  typeCheckOut: {
    backgroundColor: '#EFF6FF',
  },
  typePillText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
  },
  typeCheckInText: {
    color: '#0D9488',
  },
  typeCheckOutText: {
    color: '#2563EB',
  },
  historyTime: {
    ...Typography.bodySemiBold,
    color: Colors.textPrimary,
  },
  historyDate: {
    ...Typography.small,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  historyAddress: {
    ...Typography.small,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  matchScoreBadge: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.sm,
  },
  matchScoreText: {
    ...Typography.captionMedium,
    color: Colors.primary,
  },
  matchScoreLabel: {
    fontSize: 9,
    color: Colors.textTertiary,
  },
  emptyCard: {
    backgroundColor: 'white',
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    padding: Spacing.xl,
  },
  processingCard: {
    backgroundColor: 'white',
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    width: '85%',
    ...Shadows.lg,
  },
  processingTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
  },
  processingSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
});

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  ScrollView,
  Image,
  Modal
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  ScanFace, 
  Camera, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  MapPin, 
  LogOut, 
  Sparkles,
  Calendar,
  ShieldCheck,
  Check
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { CameraView } from '../../components/camera/CameraView';
import { getFaceEnrollment, recordAttendance, getLatestAttendance, getAttendanceForUser } from '../../services/database';
import { getCurrentLocation } from '../../services/location';
import { verifyFaceMatch } from '../../services/faceRecognition';
import { saveSelfie, resolvePhotoUri } from '../../services/fileSystem';
import { AttendanceType, AttendanceRecord } from '../../types';
import { formatTime, formatDate } from '../../utils/dateFormat';

interface FeedbackState {
  type: 'success' | 'mismatch' | 'not_enrolled' | 'error';
  title: string;
  message: string;
  punchType?: AttendanceType;
  time?: string;
  confidence?: number;
  location?: string;
}

export function AttendanceScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [showCamera, setShowCamera] = useState(false);
  const [attendanceType, setAttendanceType] = useState<AttendanceType>('check_in');
  const [processing, setProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('Verifying Face with Face++ AI...');
  const [latestRecord, setLatestRecord] = useState<AttendanceRecord | null>(null);
  const [recentRecords, setRecentRecords] = useState<AttendanceRecord[]>([]);

  // Subtle modern feedback modal
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

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
      setProcessingStatus('Checking biometric profile...');

      // 1. Check if user is enrolled
      const enrollment = await getFaceEnrollment(user.id);
      if (!enrollment || !enrollment.enrollmentPhotoUri) {
        setProcessing(false);
        setFeedback({
          type: 'not_enrolled',
          title: 'Biometrics Not Registered',
          message: 'Your facial profile is not registered yet. Please request your Admin to enrol your face before punching attendance.'
        });
        return;
      }

      // 2. Resolve enrolled photo file path
      const enrolledPhotoPath = resolvePhotoUri(enrollment.enrollmentPhotoUri);
      if (!enrolledPhotoPath) {
        setProcessing(false);
        setFeedback({
          type: 'error',
          title: 'Enrollment Error',
          message: 'The enrolled biometric profile image could not be loaded.'
        });
        return;
      }

      setProcessingStatus('Comparing selfie via Face++ AI...');

      // 3. Real Face++ 1:1 facial comparison
      const matchResult = await verifyFaceMatch(photoUri, enrolledPhotoPath);

      if (!matchResult.matched) {
        setProcessing(false);
        setFeedback({
          type: 'mismatch',
          title: 'Verification Unsuccessful',
          message: matchResult.error || 'Your face did not match the registered profile. Please face the camera in good lighting and try again.',
          confidence: matchResult.rawConfidence
        });
        return;
      }

      setProcessingStatus('Acquiring verified GPS coordinates...');

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
        location.address = 'Location unavailable';
      }

      setProcessingStatus('Saving attendance snapshot...');

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

      // 7. Show elegant success feedback modal
      const now = new Date();
      setFeedback({
        type: 'success',
        title: 'Attendance Verified',
        message: `${attendanceType === 'check_in' ? 'Check In' : 'Check Out'} recorded successfully with 1:1 biometric match.`,
        punchType: attendanceType,
        time: formatTime(now.toISOString()),
        confidence: matchResult.rawConfidence ?? 90,
        location: location.address
      });

      loadAttendanceData();

    } catch (error: any) {
      console.error('[Attendance] Verification error:', error);
      setFeedback({
        type: 'error',
        title: 'Attendance Error',
        message: error.message || 'Verification process encountered an unexpected issue.'
      });
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
        promptMessage="Center face inside oval to verify"
      />
    );
  }

  const isCheckedInToday = latestRecord && 
    new Date(latestRecord.timestamp).toDateString() === new Date().toDateString() &&
    latestRecord.type === 'check_in';

  const today = new Date();
  const dayName = today.toLocaleDateString('en-US', { weekday: 'short' });
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
            <Text style={styles.punchSubtitle}>Selfie + GPS verification</Text>
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
            <Text style={styles.punchSubtitle}>Selfie + GPS verification</Text>
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

      {/* Processing Loader Overlay */}
      {processing && (
        <View style={styles.processingOverlay}>
          <View style={styles.processingCard}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.processingTitle}>Verifying Biometrics</Text>
            <Text style={styles.processingSubtitle}>{processingStatus}</Text>
          </View>
        </View>
      )}

      {/* Subtle, Elegant Feedback Modal */}
      <Modal
        visible={!!feedback}
        transparent
        animationType="fade"
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            
            {/* Modal Icon */}
            {feedback?.type === 'success' && (
              <View style={styles.modalIconCircleSuccess}>
                <CheckCircle2 size={36} color="#0D9488" />
              </View>
            )}
            {feedback?.type === 'mismatch' && (
              <View style={styles.modalIconCircleMismatch}>
                <AlertCircle size={36} color="#E11D48" />
              </View>
            )}
            {feedback?.type === 'not_enrolled' && (
              <View style={styles.modalIconCircleWarning}>
                <ScanFace size={36} color="#D97706" />
              </View>
            )}
            {feedback?.type === 'error' && (
              <View style={styles.modalIconCircleMismatch}>
                <AlertCircle size={36} color="#E11D48" />
              </View>
            )}

            <Text style={styles.modalTitle}>{feedback?.title}</Text>
            <Text style={styles.modalSubtitle}>{feedback?.message}</Text>

            {/* Success Details Box */}
            {feedback?.type === 'success' && (
              <View style={styles.receiptBox}>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Punch Type</Text>
                  <Text style={styles.receiptValue}>
                    {feedback.punchType === 'check_in' ? 'Check In' : 'Check Out'}
                  </Text>
                </View>

                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Time Logged</Text>
                  <Text style={styles.receiptValue}>{feedback.time}</Text>
                </View>

                {feedback.confidence !== undefined && (
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Biometric Match</Text>
                    <Text style={[styles.receiptValue, { color: '#0D9488', fontWeight: '700' }]}>
                      {feedback.confidence.toFixed(0)}%
                    </Text>
                  </View>
                )}

                {feedback.location && (
                  <View style={styles.receiptLocationRow}>
                    <MapPin size={12} color="#64748B" style={{ marginRight: 4, marginTop: 2 }} />
                    <Text style={styles.receiptLocationText} numberOfLines={2}>
                      {feedback.location}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Mismatch Details */}
            {feedback?.type === 'mismatch' && feedback.confidence !== undefined && (
              <View style={styles.mismatchPill}>
                <Text style={styles.mismatchPillText}>
                  Match Score: {feedback.confidence.toFixed(0)}% (Threshold: 70%)
                </Text>
              </View>
            )}

            <TouchableOpacity 
              style={[
                styles.modalActionBtn,
                feedback?.type === 'mismatch' ? styles.modalActionBtnWarning : styles.modalActionBtnPrimary
              ]}
              onPress={() => setFeedback(null)}
              activeOpacity={0.85}
            >
              <Text style={styles.modalActionBtnText}>
                {feedback?.type === 'mismatch' ? 'Try Again' : 'Done'}
              </Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

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
    padding: Spacing.md,
    borderWidth: 1.5,
    ...Shadows.sm,
  },
  checkInCard: {
    borderColor: '#CCFBF1',
  },
  checkOutCard: {
    borderColor: '#E0F2FE',
  },
  punchIconCircleCheckIn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0FDFA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  punchIconCircleCheckOut: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  punchTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  punchSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 3,
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
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    padding: Spacing.xl,
  },
  processingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    width: '85%',
    ...Shadows.lg,
  },
  processingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: Spacing.md,
  },
  processingSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: '90%',
    maxWidth: 380,
    alignItems: 'center',
    ...Shadows.lg,
  },
  modalIconCircleSuccess: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#CCFBF1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalIconCircleMismatch: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FFE4E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalIconCircleWarning: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.4,
    textAlign: 'center',
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: Spacing.md,
  },
  receiptBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: Spacing.lg,
    gap: 8,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiptLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  receiptValue: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  receiptLocationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
    marginTop: 2,
  },
  receiptLocationText: {
    fontSize: 11,
    color: '#64748B',
    flex: 1,
    lineHeight: 16,
  },
  mismatchPill: {
    backgroundColor: '#FFF1F2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFE4E6',
    marginBottom: Spacing.lg,
  },
  mismatchPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E11D48',
  },
  modalActionBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  modalActionBtnPrimary: {
    backgroundColor: Colors.primary,
  },
  modalActionBtnWarning: {
    backgroundColor: '#0F172A',
  },
  modalActionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

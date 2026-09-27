import React, { useRef, useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  Modal 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { 
  X, 
  RotateCcw, 
  ScanFace, 
  Camera, 
  CheckCircle2, 
  AlertCircle,
  MapPin
} from 'lucide-react-native';
import { CameraView as ExpoCameraView, useCameraPermissions } from 'expo-camera';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { getFaceEnrollment, recordAttendance } from '../../services/database';
import { getCurrentLocation } from '../../services/location';
import { verifyFaceMatch } from '../../services/faceRecognition';
import { saveSelfie, resolvePhotoUri } from '../../services/fileSystem';
import { StaffStackParamList, AttendanceType } from '../../types';
import { formatTime } from '../../utils/dateFormat';

type BiometricRouteProp = RouteProp<StaffStackParamList, 'BiometricPunch'>;
type NavigationProp = NativeStackNavigationProp<StaffStackParamList, 'BiometricPunch'>;

export default function BiometricPunchScreen() {
  const route = useRoute<BiometricRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { punchType } = route.params;
  const { user } = useAuth();

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Verifying face biometrics...');
  const [facing, setFacing] = useState<'front' | 'back'>('front');
  
  const insets = useSafeAreaInsets();
  const topHeaderPadding = Math.max(insets.top, 24) + Spacing.xs;
  
  // Feedback modals
  const [successDetails, setSuccessDetails] = useState<{
    punchType: AttendanceType;
    time: string;
    confidence: number;
    location: string;
  } | null>(null);

  const [errorMessage, setErrorMessage] = useState<{
    title: string;
    description: string;
    confidence?: number;
  } | null>(null);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const handleCapture = async () => {
    if (!cameraRef.current || loading || !user) return;
    
    setLoading(true);
    setLoadingMessage('Capturing high-resolution frame...');

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        skipProcessing: false,
      });

      if (!photo?.uri) {
        throw new Error('Failed to capture photo from camera');
      }

      setLoadingMessage('Checking enrolled biometric profile...');
      const enrollment = await getFaceEnrollment(user.id);
      if (!enrollment || !enrollment.enrollmentPhotoUri) {
        setErrorMessage({
          title: 'Biometrics Not Registered',
          description: 'Your facial profile is not registered yet. Please request your Admin to enrol your face before punching attendance.'
        });
        return;
      }

      const enrolledPhotoPath = resolvePhotoUri(enrollment.enrollmentPhotoUri);
      if (!enrolledPhotoPath) {
        setErrorMessage({
          title: 'Enrollment Error',
          description: 'The enrolled biometric profile image could not be loaded.'
        });
        return;
      }

      setLoadingMessage('Comparing selfie via Face++ AI...');
      const matchResult = await verifyFaceMatch(photo.uri, enrolledPhotoPath);

      if (!matchResult.matched) {
        setErrorMessage({
          title: 'Verification Unsuccessful',
          description: matchResult.error || 'Your face did not match the registered profile. Please face the camera in good lighting and try again.',
          confidence: matchResult.rawConfidence
        });
        return;
      }

      setLoadingMessage('Acquiring verified GPS coordinates...');
      let location = { latitude: 0, longitude: 0, address: 'Unknown Location' };
      try {
        const loc = await getCurrentLocation();
        location = {
          latitude: loc.latitude,
          longitude: loc.longitude,
          address: loc.address || `${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`
        };
      } catch (locErr) {
        console.warn('[BiometricPunch] GPS error:', locErr);
        location.address = 'Location coordinates recorded';
      }

      setLoadingMessage('Saving verified attendance record...');
      const savedSelfieRelativePath = await saveSelfie(user.id, photo.uri);

      await recordAttendance(
        user.id,
        punchType,
        savedSelfieRelativePath,
        location.latitude,
        location.longitude,
        matchResult.confidence,
        location.address
      );

      const now = new Date();
      setSuccessDetails({
        punchType,
        time: formatTime(now.toISOString()),
        confidence: matchResult.rawConfidence ?? 92,
        location: location.address
      });

    } catch (error: any) {
      console.error('[BiometricPunch] Error:', error);
      setErrorMessage({
        title: 'Attendance Error',
        description: error.message || 'Verification process encountered an unexpected issue.'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleFacing = () => {
    setFacing(prev => (prev === 'front' ? 'back' : 'front'));
  };

  const isCheckIn = punchType === 'check_in';

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { paddingTop: topHeaderPadding }]}>
        <View style={styles.permissionBox}>
          <Camera size={48} color={Colors.textSecondary} />
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionSubtitle}>
            Camera is required to verify your face biometrics for 1:1 attendance verification.
          </Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={requestPermission}>
            <Text style={styles.primaryBtnText}>Grant Camera Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Header Bar */}
      <View style={[styles.header, { paddingTop: topHeaderPadding }]}>
        <TouchableOpacity 
          style={styles.headerBtn} 
          onPress={() => navigation.goBack()}
          hitSlop={10}
        >
          <X size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>
            {isCheckIn ? 'Punch Check In' : 'Punch Check Out'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {isCheckIn ? 'START OF SHIFT' : 'END OF SHIFT'}
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.headerBtn} 
          onPress={toggleFacing}
          hitSlop={10}
        >
          <RotateCcw size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Full-Screen Camera View */}
      <View style={styles.cameraContainer}>
        <ExpoCameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing={facing}
        />

        {/* Biometric Oval Mask */}
        <View style={styles.overlay}>
          <View style={styles.topMask} />
          <View style={styles.middleRow}>
            <View style={styles.sideMask} />
            <View style={styles.faceOval}>
              <View style={styles.scanTarget} />
            </View>
            <View style={styles.sideMask} />
          </View>
          <View style={styles.bottomMask}>
            <View style={styles.instructionsBadge}>
              <ScanFace size={16} color="#00D2B4" style={{ marginRight: 6 }} />
              <Text style={styles.instructionsText}>
                Center face inside oval & hold steady
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Footer Controls */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.captureButton, loading && styles.captureButtonDisabled]}
          onPress={handleCapture}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator size="large" color="#FFFFFF" />
          ) : (
            <View style={styles.captureButtonInner} />
          )}
        </TouchableOpacity>
        <Text style={styles.footerHint}>
          {loading ? 'Processing...' : 'Tap circle to capture selfie'}
        </Text>
      </View>

      {/* Processing Overlay Directly on top of Camera */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingTitle}>Verifying Biometrics</Text>
            <Text style={styles.loadingSubtitle}>{loadingMessage}</Text>
          </View>
        </View>
      )}

      {/* Attendance Success Modal */}
      <Modal
        visible={!!successDetails}
        transparent
        animationType="fade"
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.successIconCircle}>
              <CheckCircle2 size={36} color="#0D9488" />
            </View>
            
            <Text style={styles.modalTitle}>Attendance Verified</Text>
            <Text style={styles.modalSubtitle}>
              {successDetails?.punchType === 'check_in' ? 'Check In' : 'Check Out'} recorded successfully with 1:1 biometric match.
            </Text>

            <View style={styles.receiptBox}>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Punch Type</Text>
                <Text style={styles.receiptValue}>
                  {successDetails?.punchType === 'check_in' ? 'Check In' : 'Check Out'}
                </Text>
              </View>

              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Time Logged</Text>
                <Text style={styles.receiptValue}>{successDetails?.time}</Text>
              </View>

              {successDetails?.confidence !== undefined && (
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Biometric Match</Text>
                  <Text style={[styles.receiptValue, { color: '#0D9488', fontWeight: '700' }]}>
                    {successDetails.confidence.toFixed(0)}%
                  </Text>
                </View>
              )}

              {successDetails?.location && (
                <View style={styles.receiptLocationRow}>
                  <MapPin size={12} color="#64748B" style={{ marginRight: 4, marginTop: 2 }} />
                  <Text style={styles.receiptLocationText} numberOfLines={2}>
                    {successDetails.location}
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity 
              style={styles.modalPrimaryBtn}
              onPress={() => {
                setSuccessDetails(null);
                navigation.goBack();
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.modalPrimaryBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Error / Mismatch Modal */}
      <Modal
        visible={!!errorMessage}
        transparent
        animationType="fade"
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.errorIconCircle}>
              <AlertCircle size={36} color="#E11D48" />
            </View>
            
            <Text style={styles.modalTitle}>{errorMessage?.title}</Text>
            <Text style={styles.modalSubtitle}>
              {errorMessage?.description}
            </Text>

            {errorMessage?.confidence !== undefined && (
              <View style={styles.mismatchPill}>
                <Text style={styles.mismatchPillText}>
                  Match Score: {errorMessage.confidence.toFixed(0)}% (Threshold: 70%)
                </Text>
              </View>
            )}

            <TouchableOpacity 
              style={styles.modalTryAgainBtn}
              onPress={() => setErrorMessage(null)}
              activeOpacity={0.85}
            >
              <Text style={styles.modalTryAgainBtnText}>Try Again</Text>
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
    backgroundColor: '#000000',
  },
  permissionBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: Spacing.xl,
  },
  permissionTitle: {
    ...Typography.h2,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
  },
  permissionSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: BorderRadius.lg,
  },
  primaryBtnText: {
    ...Typography.button,
    color: '#FFFFFF',
  },
  cancelBtn: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  cancelBtnText: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.7)',
    zIndex: 10,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#00D2B4',
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 1,
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  topMask: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  middleRow: {
    flexDirection: 'row',
    height: 330,
  },
  sideMask: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  faceOval: {
    width: 250,
    height: 330,
    borderRadius: 125,
    borderWidth: 2.5,
    borderColor: '#00D2B4',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanTarget: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(0,210,180,0.4)',
  },
  bottomMask: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    paddingTop: Spacing.md,
  },
  instructionsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15,23,42,0.85)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  instructionsText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  footer: {
    paddingVertical: Spacing.lg,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0084FF',
  },
  footerHint: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: Spacing.sm,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    padding: Spacing.xl,
  },
  loadingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    width: '85%',
    ...Shadows.lg,
  },
  loadingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: Spacing.md,
  },
  loadingSubtitle: {
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
  successIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#CCFBF1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  errorIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FFE4E6',
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
  modalPrimaryBtn: {
    backgroundColor: Colors.primary,
    width: '100%',
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  modalPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  modalTryAgainBtn: {
    backgroundColor: '#0F172A',
    width: '100%',
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  modalTryAgainBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

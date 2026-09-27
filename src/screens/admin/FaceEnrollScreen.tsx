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
  ArrowLeft, 
  RotateCcw, 
  ScanFace, 
  Camera, 
  CheckCircle2, 
  AlertCircle,
  ShieldCheck 
} from 'lucide-react-native';
import { CameraView as ExpoCameraView, useCameraPermissions } from 'expo-camera';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { enrollFace } from '../../services/database';
import { saveFacePhoto } from '../../services/fileSystem';
import { validateEnrollmentPhoto, checkDuplicateFace } from '../../services/faceRecognition';
import { AdminStackParamList } from '../../types';

type EnrollRouteProp = RouteProp<AdminStackParamList, 'FaceEnroll'>;
type NavigationProp = NativeStackNavigationProp<AdminStackParamList, 'FaceEnroll'>;

export default function FaceEnrollScreen() {
  const route = useRoute<EnrollRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { staffId, staffName } = route.params;

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Verifying face biometrics...');
  const [facing, setFacing] = useState<'front' | 'back'>('front');
  
  const insets = useSafeAreaInsets();
  const topHeaderPadding = Math.max(insets.top, 24) + Spacing.xs;
  
  // Minimal success & error modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const handleCapture = async () => {
    if (!cameraRef.current || loading) return;
    
    setLoading(true);
    setLoadingMessage('Capturing & analyzing face quality...');
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        skipProcessing: false,
      });

      if (!photo?.uri) {
        throw new Error('Failed to capture photo');
      }

      setLoadingMessage('Validating face via Face++ AI...');
      const validation = await validateEnrollmentPhoto(photo.uri);

      if (!validation.valid) {
        setErrorMessage(validation.error || 'Please center face directly inside the oval and ensure good lighting.');
        return;
      }

      setLoadingMessage('Checking for duplicate faces across all staff...');
      const duplicateCheck = await checkDuplicateFace(photo.uri, staffId);

      if (duplicateCheck.isDuplicate) {
        setErrorMessage(
          `Biometric Duplicate Detected: This face is already enrolled for ${duplicateCheck.matchedStaffName} (ID: ${duplicateCheck.matchedEmployeeId}) with a ${duplicateCheck.confidence?.toFixed(0)}% match. Each employee must have a unique facial identity.`
        );
        return;
      }

      // Save photo to permanent local storage
      const relativePhotoPath = await saveFacePhoto(staffId, photo.uri);

      // Save to SQLite
      const embeddingToken = validation.faceToken ? [validation.faceToken] : [1.0];
      await enrollFace(staffId, embeddingToken as any, relativePhotoPath);

      // Trigger minimal elegant success modal
      setShowSuccessModal(true);

    } catch (error: any) {
      console.error('[FaceEnroll] Error:', error);
      setErrorMessage(error.message || 'Network error or unable to contact Face++ service. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleFacing = () => {
    setFacing(prev => (prev === 'front' ? 'back' : 'front'));
  };

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
            Camera is required to capture and enrol staff face biometrics for 1:1 attendance verification.
          </Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={requestPermission}>
            <Text style={styles.primaryBtnText}>Grant Camera Permission</Text>
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
          <ArrowLeft size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Face Enrolment</Text>
          <Text style={styles.headerSubtitle}>{staffName}</Text>
        </View>

        <TouchableOpacity 
          style={styles.headerBtn} 
          onPress={toggleFacing}
          hitSlop={10}
        >
          <RotateCcw size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Camera View */}
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
          {loading ? 'Analyzing face...' : 'Tap circle to capture and enrol'}
        </Text>
      </View>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>{loadingMessage}</Text>
          </View>
        </View>
      )}

      {/* Minimal Elegant Success Modal (Zero Raw Data Dump) */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.successIconCircle}>
              <CheckCircle2 size={36} color="#0D9488" />
            </View>
            
            <Text style={styles.modalTitle}>Face Enrolled Successfully</Text>
            <Text style={styles.modalDescription}>
              Biometric profile registered for {staffName}. They can now use 1:1 facial verification to punch attendance.
            </Text>

            <TouchableOpacity 
              style={styles.modalPrimaryBtn}
              onPress={() => {
                setShowSuccessModal(false);
                navigation.goBack();
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.modalPrimaryBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Subtle Error Modal */}
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
            
            <Text style={styles.modalTitle}>Face Check Failed</Text>
            <Text style={styles.modalDescription}>
              {errorMessage}
            </Text>

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
    fontSize: 13,
    color: '#00D2B4',
    fontWeight: '600',
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
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: Spacing.md,
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
  modalDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.lg,
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
    backgroundColor: '#F1F5F9',
    width: '100%',
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  modalTryAgainBtnText: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
});

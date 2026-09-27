import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { CameraView as ExpoCameraView, useCameraPermissions } from 'expo-camera';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import { enrollFace } from '../../services/database';
import { saveFacePhoto } from '../../services/fileSystem';
import { validateEnrollmentPhoto } from '../../services/faceRecognition';
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
  const [loadingMessage, setLoadingMessage] = useState('Verifying face with Face++ AI...');
  const [facing, setFacing] = useState<'front' | 'back'>('front');

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
      // Real Face++ API quality check
      const validation = await validateEnrollmentPhoto(photo.uri);

      if (!validation.valid) {
        Alert.alert(
          'Face Quality Check Failed',
          validation.error || 'Please align your face directly inside the oval and ensure good lighting.',
          [{ text: 'Try Again' }]
        );
        return;
      }

      // Save photo to permanent local storage
      const relativePhotoPath = await saveFacePhoto(staffId, photo.uri);

      // Save to SQLite (store faceToken or identifier in embedding field)
      const embeddingToken = validation.faceToken ? [validation.faceToken] : [1.0];
      await enrollFace(staffId, embeddingToken as any, relativePhotoPath);

      Alert.alert(
        'Face Enrolled Successfully! 🎉',
        `Biometric profile has been registered for ${staffName}. They can now use selfie face verification for attendance.`,
        [{ text: 'Done', onPress: () => navigation.goBack() }]
      );

    } catch (error: any) {
      console.error('[FaceEnroll] Error:', error);
      Alert.alert(
        'Enrollment Failed', 
        error.message || 'Network error or unable to contact Face++ service. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleFacing = () => {
    setFacing(prev => (prev === 'front' ? 'back' : 'front'));
  };

  if (!permission) {
    return <SafeAreaView style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionBox}>
          <Ionicons name="camera-outline" size={48} color={Colors.textSecondary} />
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionSubtitle}>
            Camera is required to capture and enrol staff face biometrics.
          </Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={requestPermission}>
            <Text style={styles.primaryBtnText}>Grant Camera Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Face Enrolment</Text>
          <Text style={styles.headerSubtitle}>{staffName}</Text>
        </View>
        <TouchableOpacity style={styles.headerBtn} onPress={toggleFacing}>
          <Ionicons name="camera-reverse-outline" size={24} color="white" />
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
              <Ionicons name="scan-outline" size={16} color="#00D2B4" style={{ marginRight: 6 }} />
              <Text style={styles.instructionsText}>
                Center face inside the oval and hold steady
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
            <ActivityIndicator size="large" color="white" />
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
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
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
  },
  primaryBtnText: {
    ...Typography.button,
    color: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.6)',
    zIndex: 10,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    ...Typography.h3,
    color: 'white',
  },
  headerSubtitle: {
    ...Typography.smallMedium,
    color: '#00D2B4',
    marginTop: 2,
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
    height: 340,
  },
  sideMask: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  faceOval: {
    width: 250,
    height: 340,
    borderRadius: 125,
    borderWidth: 3,
    borderColor: '#00D2B4',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanTarget: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,210,180,0.4)',
  },
  bottomMask: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    paddingTop: Spacing.lg,
  },
  instructionsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  instructionsText: {
    ...Typography.captionMedium,
    color: 'white',
  },
  footer: {
    paddingVertical: Spacing.lg,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0084FF',
  },
  footerHint: {
    ...Typography.small,
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
    backgroundColor: 'white',
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    width: '85%',
  },
  loadingText: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
});

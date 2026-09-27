import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, SafeAreaView } from 'react-native';
import { CameraView as ExpoCameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { FaceOverlay } from './FaceOverlay';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';

interface CameraViewProps {
  onCapture: (photoUri: string) => void;
  onClose?: () => void;
  mode?: 'enroll' | 'verify';
  promptMessage?: string;
}

export function CameraView({ onCapture, onClose, mode = 'verify', promptMessage }: CameraViewProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [facing, setFacing] = useState<'front' | 'back'>('front');
  const [faceStatus, setFaceStatus] = useState<'scanning' | 'detected' | 'error'>('scanning');

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="camera-outline" size={48} color={Colors.textSecondary} />
        <Text style={styles.textTitle}>Camera Permission Required</Text>
        <Text style={styles.textSubtitle}>
          SalaryBox FacePass requires camera access to {mode === 'enroll' ? 'enrol your face' : 'verify your identity'}.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Camera Permission</Text>
        </TouchableOpacity>
        {onClose && (
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  const handleCapture = async () => {
    if (cameraRef.current && !isProcessing) {
      try {
        setIsProcessing(true);
        setFaceStatus('scanning');
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          skipProcessing: false,
        });
        if (photo?.uri) {
          onCapture(photo.uri);
        }
      } catch (error) {
        console.error('Camera capture failed:', error);
        setFaceStatus('error');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const toggleFacing = () => {
    setFacing(prev => (prev === 'front' ? 'back' : 'front'));
  };

  const defaultMessage = mode === 'enroll' 
    ? 'Center face in oval to enrol' 
    : 'Align face in oval to verify';

  return (
    <View style={styles.container}>
      <ExpoCameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
      />
      
      <FaceOverlay status={faceStatus} message={promptMessage || defaultMessage} />

      {/* Top Controls Header */}
      <SafeAreaView style={styles.topBar}>
        {onClose ? (
          <TouchableOpacity style={styles.iconButton} onPress={onClose}>
            <Ionicons name="close" size={26} color="white" />
          </TouchableOpacity>
        ) : <View style={{ width: 44 }} />}

        <View style={styles.modeBadge}>
          <Text style={styles.modeBadgeText}>
            {mode === 'enroll' ? 'FACE ENROLMENT' : 'BIOMETRIC PUNCH'}
          </Text>
        </View>

        <TouchableOpacity style={styles.iconButton} onPress={toggleFacing}>
          <Ionicons name="camera-reverse-outline" size={24} color="white" />
        </TouchableOpacity>
      </SafeAreaView>
      
      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        <TouchableOpacity 
          style={[styles.captureBtn, isProcessing && styles.captureBtnDisabled]} 
          onPress={handleCapture}
          disabled={isProcessing}
          activeOpacity={0.8}
        >
          {isProcessing ? (
            <ActivityIndicator color={Colors.primary} size="large" />
          ) : (
            <View style={styles.captureBtnInner} />
          )}
        </TouchableOpacity>
        <Text style={styles.hintText}>
          {isProcessing ? 'Processing image...' : 'Tap circle to capture'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: Spacing.xl,
  },
  textTitle: {
    ...Typography.h2,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  textSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  permissionButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    width: '100%',
    alignItems: 'center',
  },
  permissionButtonText: {
    ...Typography.button,
    color: 'white',
  },
  cancelButton: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  cancelButtonText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  topBar: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    zIndex: 10,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeBadge: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  modeBadgeText: {
    ...Typography.smallMedium,
    color: '#00D2B4',
    letterSpacing: 1,
  },
  bottomControls: {
    position: 'absolute',
    bottom: Spacing.xl,
    width: '100%',
    alignItems: 'center',
    zIndex: 10,
  },
  captureBtn: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'white',
  },
  captureBtnDisabled: {
    opacity: 0.5,
  },
  captureBtnInner: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: 'white',
  },
  hintText: {
    ...Typography.smallMedium,
    color: 'rgba(255,255,255,0.8)',
    marginTop: Spacing.sm,
  },
});

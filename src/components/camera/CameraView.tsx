import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView as ExpoCameraView, useCameraPermissions } from 'expo-camera';
import { X, RotateCcw, Camera } from 'lucide-react-native';
import { FaceOverlay } from './FaceOverlay';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';

interface CameraViewProps {
  onCapture: (photoUri: string) => void;
  onClose?: () => void;
  mode?: 'enroll' | 'verify';
  promptMessage?: string;
}

export function CameraView({ onCapture, onClose, mode = 'verify', promptMessage }: CameraViewProps) {
  const insets = useSafeAreaInsets();
  const topBarPadding = Math.max(insets.top, 24) + 10;
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
        <Camera size={48} color={Colors.textSecondary} />
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
          quality: 0.85,
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
      <View style={[styles.topBar, { top: topBarPadding }]}>
        {onClose ? (
          <TouchableOpacity style={styles.iconButton} onPress={onClose} hitSlop={10}>
            <X size={22} color="#FFFFFF" />
          </TouchableOpacity>
        ) : <View style={{ width: 40 }} />}

        <View style={styles.modeBadge}>
          <Text style={styles.modeBadgeText}>
            {mode === 'enroll' ? 'FACE ENROLMENT' : 'BIOMETRIC PUNCH'}
          </Text>
        </View>

        <TouchableOpacity style={styles.iconButton} onPress={toggleFacing} hitSlop={10}>
          <RotateCcw size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      
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
    backgroundColor: '#000000',
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
    textAlign: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  permissionButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: BorderRadius.lg,
  },
  permissionButtonText: {
    ...Typography.button,
    color: '#FFFFFF',
  },
  cancelButton: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  cancelButtonText: {
    ...Typography.bodyMedium,
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
    paddingHorizontal: Spacing.md,
    zIndex: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeBadge: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  modeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00D2B4',
    letterSpacing: 0.5,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureBtnDisabled: {
    opacity: 0.5,
  },
  captureBtnInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0084FF',
  },
  hintText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: Spacing.sm,
  },
});

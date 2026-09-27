import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';

interface FaceOverlayProps {
  status: 'scanning' | 'detected' | 'error';
  message?: string;
}

export function FaceOverlay({ status, message }: FaceOverlayProps) {
  let borderColor = 'white';
  let defaultMessage = 'Position your face in the oval';

  if (status === 'detected') {
    borderColor = Colors.secondary;
    defaultMessage = 'Face detected ✓';
  } else if (status === 'error') {
    borderColor = Colors.error;
    defaultMessage = 'Face not detected or poorly lit';
  }

  const displayMessage = message || defaultMessage;

  return (
    <View style={styles.overlay}>
      <View style={styles.topMask} />
      <View style={styles.middleContainer}>
        <View style={styles.sideMask} />
        <View style={[styles.cutout, { borderColor }]} />
        <View style={styles.sideMask} />
      </View>
      <View style={styles.bottomMask}>
        <Text style={styles.statusText}>{displayMessage}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topMask: {
    flex: 1,
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  middleContainer: {
    flexDirection: 'row',
    height: 350,
  },
  sideMask: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  cutout: {
    width: 250,
    height: 350,
    borderRadius: 125,
    borderWidth: 3,
    backgroundColor: 'transparent',
  },
  bottomMask: {
    flex: 1,
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    paddingTop: Spacing.lg,
  },
  statusText: {
    ...Typography.bodySemiBold,
    color: 'white',
    textAlign: 'center',
  }
});

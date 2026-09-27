import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, BorderRadius, Spacing } from '../../constants/theme';

export interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'neutral', size = 'sm' }) => {
  const getBackgroundColor = () => {
    switch (variant) {
      case 'success': return Colors.secondary + '20';
      case 'warning': return '#F59E0B20'; // Amber transparent
      case 'error': return Colors.error + '20';
      case 'info': return Colors.primary + '20';
      case 'neutral': default: return Colors.text + '10';
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'success': return Colors.secondary;
      case 'warning': return '#D97706'; // Amber darker
      case 'error': return Colors.error;
      case 'info': return Colors.primary;
      case 'neutral': default: return Colors.text;
    }
  };

  return (
    <View style={[
      styles.container, 
      { backgroundColor: getBackgroundColor() },
      size === 'sm' ? styles.smContainer : styles.mdContainer
    ]}>
      <Text style={[
        size === 'sm' ? Typography.smallMedium : Typography.captionMedium,
        { color: getTextColor() }
      ]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
  smContainer: {
    paddingVertical: 2,
    paddingHorizontal: Spacing.sm,
  },
  mdContainer: {
    paddingVertical: 4,
    paddingHorizontal: Spacing.md,
  },
});

import React from 'react';
import { View, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { Colors, BorderRadius, Shadows, Spacing } from '../../constants/theme';

export interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'default' | 'elevated';
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({ children, onPress, variant = 'default', style }) => {
  const containerStyle = [
    styles.card,
    variant === 'elevated' ? Shadows.md : Shadows.sm,
    style,
  ];

  if (onPress) {
    return (
      <Pressable 
        onPress={onPress} 
        style={({ pressed }) => [containerStyle, pressed && { opacity: 0.9 }]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={containerStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginVertical: Spacing.xs,
  },
});

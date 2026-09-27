import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface HeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightAction?: {
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
  };
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, onBack, rightAction }) => {
  // Try to use safe area insets if provider exists, fallback to 0
  let topInset = 0;
  try {
    const insets = useSafeAreaInsets();
    topInset = insets.top;
  } catch (e) {
    // Ignore error if useSafeAreaInsets is used outside SafeAreaProvider
    topInset = 40; // reasonable fallback
  }

  return (
    <View style={[styles.container, { paddingTop: topInset + Spacing.sm }]}>
      <View style={styles.content}>
        {onBack ? (
          <Pressable onPress={onBack} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.surface} />
          </Pressable>
        ) : (
          <View style={styles.placeholder} />
        )}

        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          {subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}
        </View>

        {rightAction ? (
          <Pressable onPress={rightAction.onPress} style={styles.iconButton}>
            <Ionicons name={rightAction.icon} size={24} color={Colors.surface} />
          </Pressable>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.primary,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
  },
  title: {
    ...Typography.h2,
    color: Colors.surface,
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.surface,
    opacity: 0.8,
    marginTop: 2,
  },
  iconButton: {
    padding: Spacing.xs,
  },
  placeholder: {
    width: 32, // approximately the width of the icon button
  },
});

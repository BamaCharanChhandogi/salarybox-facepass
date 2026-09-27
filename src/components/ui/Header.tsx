import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { Colors, Typography, Spacing } from '../../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface HeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightAction?: {
    icon: React.ReactNode;
    onPress: () => void;
  };
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, onBack, rightAction }) => {
  let topInset = 0;
  try {
    const insets = useSafeAreaInsets();
    topInset = insets.top;
  } catch (e) {
    topInset = 40;
  }

  return (
    <View style={[styles.container, { paddingTop: topInset + Spacing.sm }]}>
      <View style={styles.content}>
        {onBack ? (
          <Pressable onPress={onBack} style={styles.iconButton} hitSlop={10}>
            <ArrowLeft size={22} color="#FFFFFF" />
          </Pressable>
        ) : (
          <View style={styles.placeholder} />
        )}

        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          {subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}
        </View>

        {rightAction ? (
          <Pressable onPress={rightAction.onPress} style={styles.iconButton} hitSlop={10}>
            {rightAction.icon}
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
    ...Typography.h3,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  subtitle: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  iconButton: {
    padding: Spacing.xs,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    width: 36,
  },
});

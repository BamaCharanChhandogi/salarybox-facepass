import React from 'react';
import { Pressable, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  fullWidth = true,
  style,
  textStyle,
}) => {
  const getContainerStyle = (pressed: boolean) => {
    const baseStyle = [styles.container, styles[`${size}Container`], fullWidth && styles.fullWidth];
    
    if (disabled || loading) {
      if (variant === 'outline' || variant === 'ghost') {
        return [...baseStyle, { opacity: 0.5 }];
      }
      return [...baseStyle, styles.disabledContainer];
    }
    
    if (pressed) {
      baseStyle.push({ opacity: 0.8 } as any);
    }

    return [...baseStyle, styles[`${variant}Container`]];
  };

  const getTextStyle = () => {
    const baseStyle = [styles.text, styles[`${size}Text`]];
    if (disabled || loading) {
      if (variant === 'outline' || variant === 'ghost') {
        return [...baseStyle, styles[`${variant}Text`]];
      }
      return [...baseStyle, styles.disabledText];
    }
    return [...baseStyle, styles[`${variant}Text`]];
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [getContainerStyle(pressed), style]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator 
            color={variant === 'outline' || variant === 'ghost' ? Colors.primary : Colors.surface} 
            size="small" 
          />
        ) : (
          <>
            {icon && (
              <Ionicons
                name={icon}
                size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20}
                color={(StyleSheet.flatten(getTextStyle()) as any)?.color || Colors.primary}
                style={styles.icon}
              />
            )}
            <Text style={[getTextStyle(), textStyle]}>{title}</Text>
          </>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  // Sizes
  smContainer: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  mdContainer: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  lgContainer: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  // Variants (Containers)
  primaryContainer: {
    backgroundColor: Colors.primary,
  },
  secondaryContainer: {
    backgroundColor: Colors.secondary,
  },
  dangerContainer: {
    backgroundColor: Colors.error,
  },
  outlineContainer: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  ghostContainer: {
    backgroundColor: 'transparent',
  },
  disabledContainer: {
    backgroundColor: Colors.text + '40', // light grey
  },
  // Typography
  text: {
    ...Typography.button,
    textAlign: 'center',
  },
  smText: {
    fontSize: 14,
  },
  mdText: {
    fontSize: 16,
  },
  lgText: {
    fontSize: 18,
  },
  // Variants (Text)
  primaryText: {
    color: Colors.surface,
  },
  secondaryText: {
    color: Colors.surface,
  },
  dangerText: {
    color: Colors.surface,
  },
  outlineText: {
    color: Colors.primary,
  },
  ghostText: {
    color: Colors.primary,
  },
  disabledText: {
    color: Colors.surface,
  },
  icon: {
    marginRight: Spacing.xs,
  },
});

import React from 'react';
import { Pressable, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle, View } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
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
  const { colors } = useTheme();

  const getContainerStyle = (pressed: boolean) => {
    const baseStyle: any[] = [styles.container, styles[`${size}Container`], fullWidth && styles.fullWidth];
    
    if (disabled || loading) {
      if (variant === 'outline' || variant === 'ghost') {
        return [...baseStyle, { opacity: 0.5 }];
      }
      return [...baseStyle, { backgroundColor: colors.textMuted }];
    }
    
    if (pressed) {
      baseStyle.push({ opacity: 0.85 });
    }

    return [...baseStyle, styles[`${variant}Container`]];
  };

  const getTextStyle = () => {
    const baseStyle: any[] = [styles.text, styles[`${size}Text`]];
    if (disabled || loading) {
      if (variant === 'outline' || variant === 'ghost') {
        return [...baseStyle, styles[`${variant}Text`]];
      }
      return [...baseStyle, { color: colors.textTertiary }];
    }
    if (variant === 'secondary') {
      return [...baseStyle, { color: colors.textPrimary }];
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
            color={variant === 'outline' || variant === 'ghost' ? Colors.primary : '#FFFFFF'} 
            size="small" 
          />
        ) : (
          <>
            {icon && <View style={styles.iconContainer}>{icon}</View>}
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
    borderRadius: BorderRadius.lg,
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
  smContainer: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  mdContainer: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  lgContainer: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  primaryContainer: {
    backgroundColor: Colors.primary,
  },
  secondaryContainer: {
    backgroundColor: Colors.secondary,
  },
  outlineContainer: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  ghostContainer: {
    backgroundColor: 'transparent',
  },
  dangerContainer: {
    backgroundColor: Colors.error,
  },
  text: {
    ...Typography.button,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  smText: {
    fontSize: 13,
  },
  mdText: {
    fontSize: 15,
  },
  lgText: {
    fontSize: 16,
  },
  primaryText: {
    color: '#FFFFFF',
  },
  outlineText: {
    color: Colors.primary,
  },
  ghostText: {
    color: Colors.primary,
  },
  dangerText: {
    color: '#FFFFFF',
  },
  iconContainer: {
    marginRight: 8,
  },
});

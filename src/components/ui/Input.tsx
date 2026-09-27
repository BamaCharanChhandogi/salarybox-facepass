import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ 
  label, 
  error, 
  leftIcon, 
  rightIcon,
  style, 
  onFocus, 
  onBlur, 
  ...props 
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus && onFocus(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur && onBlur(e);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={[
        styles.inputContainer,
        isFocused && styles.inputFocused,
        error ? styles.inputError : null
      ]}>
        {leftIcon && <View style={styles.icon}>{leftIcon}</View>}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor="#94A3B8"
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
    width: '100%',
  },
  label: {
    ...Typography.bodyMedium,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    height: 50,
  },
  inputFocused: {
    borderColor: Colors.primary,
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: Colors.error,
  },
  icon: {
    marginRight: 10,
  },
  rightIcon: {
    marginLeft: 10,
  },
  input: {
    flex: 1,
    ...Typography.body,
    fontSize: 14,
    color: Colors.textPrimary,
    height: '100%',
  },
  errorText: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.error,
    marginTop: 4,
  },
});

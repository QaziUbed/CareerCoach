import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps, ViewStyle, Platform } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../utils/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  containerStyle?: ViewStyle;
}

export default function Input({
  label,
  error,
  helperText,
  containerStyle,
  style,
  onFocus,
  onBlur,
  ...textInputProps
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={styles.label}>{label}</Text>
      )}
      <TextInput
        style={[
          styles.input,
          isFocused && styles.inputFocused,
          error && styles.inputError,
          style,
        ]}
        placeholderTextColor={COLORS.textMuted}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...textInputProps}
      />
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}
      {helperText && !error ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
    color: '#334155', // Slate 700
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: '#CBD5E1', // Slate 300
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: Platform.OS === 'ios' ? SPACING.md : SPACING.sm + 2,
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.textPrimary,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
        transitionProperty: 'border-color, box-shadow',
        transitionDuration: '150ms',
      } as any
    })
  },
  inputFocused: {
    borderColor: COLORS.primary,
    ...Platform.select({
      web: {
        boxShadow: `0 0 0 3px ${COLORS.primaryLight}`,
      } as any
    })
  },
  inputError: {
    borderColor: COLORS.danger,
    ...Platform.select({
      web: {
        boxShadow: `0 0 0 3px ${COLORS.dangerLight}`,
      } as any
    })
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    color: COLORS.danger,
    marginTop: SPACING.xs,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
  },
  helperText: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
});

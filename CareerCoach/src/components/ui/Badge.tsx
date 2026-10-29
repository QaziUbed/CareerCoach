import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../utils/theme';

type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'neutral';
type BadgeSize = 'small' | 'medium' | 'large';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function Badge({
  label,
  variant = 'primary',
  size = 'medium',
  style,
  textStyle,
}: BadgeProps) {
  const variantStyles: Record<BadgeVariant, { backgroundColor: string; color: string }> = {
    primary: {
      backgroundColor: COLORS.primaryLight,
      color: COLORS.primary,
    },
    secondary: {
      backgroundColor: COLORS.secondaryLight,
      color: COLORS.secondary,
    },
    success: {
      backgroundColor: COLORS.successLight,
      color: COLORS.success,
    },
    warning: {
      backgroundColor: COLORS.warningLight,
      color: COLORS.warning,
    },
    danger: {
      backgroundColor: COLORS.dangerLight,
      color: COLORS.danger,
    },
    neutral: {
      backgroundColor: COLORS.surface,
      color: COLORS.textSecondary,
    },
  };

  const sizeStyles: Record<BadgeSize, { paddingVertical: number; paddingHorizontal: number; fontSize: number }> = {
    small: {
      paddingVertical: SPACING.xs,
      paddingHorizontal: SPACING.sm,
      fontSize: TYPOGRAPHY.fontSizes.xs,
    },
    medium: {
      paddingVertical: SPACING.xs,
      paddingHorizontal: SPACING.md,
      fontSize: TYPOGRAPHY.fontSizes.sm,
    },
    large: {
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.lg,
      fontSize: TYPOGRAPHY.fontSizes.md,
    },
  };

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: variantStyles[variant].backgroundColor,
          paddingVertical: sizeStyles[size].paddingVertical,
          paddingHorizontal: sizeStyles[size].paddingHorizontal,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: variantStyles[variant].color,
            fontSize: sizeStyles[size].fontSize,
          },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
  },
});

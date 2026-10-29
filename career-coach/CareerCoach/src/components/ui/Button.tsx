import React, { useState } from 'react';
import { Pressable, Text, ActivityIndicator, ViewStyle, TextStyle, Platform, Animated } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../utils/theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
  icon,
}: ButtonProps) {
  const [scale] = useState(new Animated.Value(1));

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: Platform.OS !== 'web',
      speed: 50,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: Platform.OS !== 'web',
      speed: 50,
      bounciness: 0,
    }).start();
  };

  const getButtonStyle = (pressed: boolean, hovered: boolean): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: RADIUS.lg, // more modern shape
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      transitionDuration: '150ms', // For web
    } as ViewStyle;

    const sizeStyles: Record<ButtonSize, ViewStyle> = {
      small: {
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
      },
      medium: {
        paddingVertical: SPACING.md + 2, // Slightly taller for modern look
        paddingHorizontal: SPACING.xl,
      },
      large: {
        paddingVertical: SPACING.lg,
        paddingHorizontal: SPACING.xxl,
      },
    };

    const variantStyles: Record<ButtonVariant, ViewStyle> = {
      primary: {
        backgroundColor: hovered ? '#1E293B' : COLORS.primary, // Lighter slate on hover
        ...(Platform.OS !== 'web' ? SHADOWS.small : {}),
      },
      secondary: {
        backgroundColor: hovered ? '#0F766E' : COLORS.secondary, // Darker teal on hover
        ...(Platform.OS !== 'web' ? SHADOWS.small : {}),
      },
      outline: {
        backgroundColor: hovered ? COLORS.background : COLORS.transparent,
        borderWidth: 1.5,
        borderColor: COLORS.primary,
      },
      ghost: {
        backgroundColor: hovered ? COLORS.primaryLight : COLORS.transparent,
      },
      danger: {
        backgroundColor: hovered ? '#BE123C' : COLORS.danger, // Darker rose on hover
      },
    };

    const disabledStyle: ViewStyle = disabled || loading ? { opacity: 0.5 } : {};
    const widthStyle: ViewStyle = fullWidth ? { width: '100%' } : {};
    const pressedStyle: ViewStyle = pressed ? { opacity: 0.8 } : {};

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...disabledStyle,
      ...widthStyle,
      ...pressedStyle,
      // @ts-ignore - style merging ignores web specific keys safely
      ...(Platform.OS === 'web' && variant === 'primary' && !disabled ? {
        boxShadow: hovered 
          ? '0 10px 15px -3px rgba(15, 23, 42, 0.2), 0 4px 6px -4px rgba(15, 23, 42, 0.1)' 
          : '0 4px 6px -1px rgba(15, 23, 42, 0.1), 0 2px 4px -2px rgba(15, 23, 42, 0.1)'
      } : {})
    };
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontWeight: TYPOGRAPHY.fontWeights.semibold,
      letterSpacing: 0.2,
      marginLeft: icon ? SPACING.sm : 0,
    };

    const sizeStyles: Record<ButtonSize, TextStyle> = {
      small: { fontSize: TYPOGRAPHY.fontSizes.sm },
      medium: { fontSize: TYPOGRAPHY.fontSizes.md },
      large: { fontSize: TYPOGRAPHY.fontSizes.lg },
    };

    const variantTextColors: Record<ButtonVariant, TextStyle> = {
      primary: { color: COLORS.white },
      secondary: { color: COLORS.white },
      outline: { color: COLORS.primary },
      ghost: { color: COLORS.primary },
      danger: { color: COLORS.white },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantTextColors[variant],
    };
  };

  return (
    <Animated.View style={{ transform: [{ scale }], width: fullWidth ? '100%' : undefined }}>
      <Pressable
        style={({ pressed, hovered }: any) => [getButtonStyle(pressed, hovered), style]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
      >
        {loading ? (
          <ActivityIndicator 
            color={variant === 'outline' || variant === 'ghost' ? COLORS.primary : COLORS.white} 
            size="small"
          />
        ) : (
          <>
            {icon}
            {title && <Text style={[getTextStyle(), textStyle]}>{title}</Text>}
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}

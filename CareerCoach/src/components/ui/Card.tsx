import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: keyof typeof SPACING;
  noPadding?: boolean;
  noShadow?: boolean;
}

export default function Card({ 
  children, 
  style, 
  padding = 'lg',
  noPadding = false,
  noShadow = false,
}: CardProps) {
  return (
    <View
      style={[
        styles.card,
        !noPadding && { padding: SPACING[padding] },
        !noShadow && SHADOWS.small, // Use small shadow for a cleaner, modern look
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});

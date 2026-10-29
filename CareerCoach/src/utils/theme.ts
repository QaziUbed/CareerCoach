import { Platform } from 'react-native';

export const COLORS = {
  // Brand Colors - Premium Slate & Teal
  primary: '#0F172A',
  primaryDark: '#020617',
  secondary: '#0D9488',
  secondaryLight: '#CCFBF1',
  accent: '#6366F1',
  
  // Status Colors
  danger: '#E11D48',
  dangerLight: '#FFE4E6',
  warning: '#EA580C',
  warningLight: '#FFEDD5',
  success: '#10B981',
  successLight: '#D1FAE5',
  
  // Background Colors
  background: '#F8FAFC',
  surface: '#FFFFFF',
  border: '#E2E8F0',
  
  // Text Colors
  text: '#0F172A',          // Alias for backward compat
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  
  // Score Colors
  scoreHigh: '#10B981',   // 70+
  scoreMid: '#F59E0B',    // 40-69
  scoreLow: '#E11D48',    // <40
  
  // Additional Utility Colors
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  
  // Opacity Variants
  primaryLight: '#0F172A0D',
};

const _fontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  xxxl: 36,
};

const _fontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

const _lineHeights = {
  tight: 1.25,
  normal: 1.5,
  relaxed: 1.75,
};

export const TYPOGRAPHY = {
  fontSizes: _fontSizes,
  sizes: _fontSizes,       // Alias for backward compat
  fontWeights: _fontWeights,
  weights: _fontWeights,   // Alias for backward compat
  lineHeights: _lineHeights,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const SHADOWS = {
  small: Platform.select({
    ios: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
    },
    android: {
      elevation: 2,
    },
    web: {
      boxShadow: '0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.05)',
    } as any
  }),
  medium: Platform.select({
    ios: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
    },
    android: {
      elevation: 4,
    },
    web: {
      boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.1), 0 2px 4px -2px rgba(15, 23, 42, 0.1)',
    } as any
  }),
  large: Platform.select({
    ios: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.15,
      shadowRadius: 24,
    },
    android: {
      elevation: 8,
    },
    web: {
      boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.1), 0 4px 6px -4px rgba(15, 23, 42, 0.1)',
    } as any
  }),
};

// Helper function to get score color
export const getScoreColor = (score: number): string => {
  if (score >= 70) return COLORS.scoreHigh;
  if (score >= 40) return COLORS.scoreMid;
  return COLORS.scoreLow;
};

// Helper function to get score background color
export const getScoreBackgroundColor = (score: number): string => {
  if (score >= 70) return COLORS.successLight;
  if (score >= 40) return COLORS.warningLight;
  return COLORS.dangerLight;
};

export default {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  RADIUS,
  SHADOWS,
  getScoreColor,
  getScoreBackgroundColor,
};

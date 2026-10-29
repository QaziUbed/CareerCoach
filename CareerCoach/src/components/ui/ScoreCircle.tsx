import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { COLORS, TYPOGRAPHY, RADIUS, getScoreColor, getScoreBackgroundColor } from '../../utils/theme';

interface ScoreCircleProps {
  score: number;
  size?: number;
  showLabel?: boolean;
  label?: string;
  style?: ViewStyle;
}

export default function ScoreCircle({
  score,
  size = 100,
  showLabel = true,
  label = 'ATS Score',
  style,
}: ScoreCircleProps) {
  const scoreColor = getScoreColor(score);
  const backgroundColor = getScoreBackgroundColor(score);

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor,
            borderColor: scoreColor,
          },
        ]}
      >
        <Text
          style={[
            styles.score,
            {
              fontSize: size * 0.35,
              color: scoreColor,
            },
          ]}
        >
          {Math.round(score)}
        </Text>
      </View>
      {showLabel && (
        <Text style={styles.label}>{label}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  circle: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
  },
  score: {
    fontWeight: TYPOGRAPHY.fontWeights.bold,
  },
  label: {
    marginTop: 8,
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
  },
});

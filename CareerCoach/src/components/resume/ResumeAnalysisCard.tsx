import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Animated, Text as RNText } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../../utils/theme';
import { Card } from '../ui';
import type { ResumeAnalysis } from '../../store/useResumeStore';

interface ResumeAnalysisCardProps {
  analysis: ResumeAnalysis;
  actionType?: 'ats' | 'gap' | 'role';
}

interface ScoreBarProps {
  label: string;
  score: number;
  delay: number;
}

const ScoreBar: React.FC<ScoreBarProps> = ({ label, score, delay }) => {
  const [animatedWidth] = useState(new Animated.Value(0));

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(animatedWidth, {
        toValue: score,
        duration: 800,
        useNativeDriver: false,
      }).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [score, delay]);

  const getScoreColor = (score: number) => {
    if (score < 50) return '#EF4444'; // red
    if (score <= 70) return '#F59E0B'; // amber
    return '#10B981'; // green
  };

  return (
    <View style={styles.scoreBarContainer}>
      <View style={styles.scoreBarHeader}>
        <Text style={styles.scoreBarLabel}>{label}</Text>
        <Text style={[styles.scoreBarValue, { color: getScoreColor(score) }]}>{score}%</Text>
      </View>
      <View style={styles.scoreBarTrack}>
        <Animated.View
          style={[
            styles.scoreBarFill,
            {
              backgroundColor: getScoreColor(score),
              width: animatedWidth.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
                extrapolate: 'clamp',
              })
            }
          ]}
        />
      </View>
    </View>
  );
};

interface ScoreCircleProps {
  score: number;
}

const ScoreCircle: React.FC<ScoreCircleProps> = ({ score }) => {
  const [animatedScore] = useState(new Animated.Value(0));
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    const listener = animatedScore.addListener(({ value }) => {
      setDisplayScore(Math.round(value));
    });

    Animated.timing(animatedScore, {
      toValue: score,
      duration: 1200,
      useNativeDriver: false,
    }).start();

    return () => {
      animatedScore.removeListener(listener);
    };
  }, [score]);

  const getScoreColor = (score: number) => {
    if (score < 50) return '#EF4444';
    if (score <= 70) return '#F59E0B';
    return '#10B981';
  };

  return (
    <View style={[styles.scoreCircle, { borderColor: getScoreColor(score) }]}>
      <Text style={[styles.scoreNumber, { color: getScoreColor(score) }]}>
        {displayScore}
      </Text>
      <Text style={styles.scoreLabel}>OVERALL</Text>
    </View>
  );
};

export default function ResumeAnalysisCard({ analysis, actionType = 'ats' }: ResumeAnalysisCardProps) {
  const scoreBreakdown = analysis.score_breakdown;

  return (
    <Card style={styles.card} noPadding>
      {/* ALWAYS SHOW OVERALL SCORE HEADER */}
      <View style={styles.header}>
        <Text variant="titleLarge" style={styles.title}>
          {actionType === 'ats' && "General ATS Scoring"}
          {actionType === 'gap' && "Skills & Gaps Overview"}
          {actionType === 'role' && "Role Matches Overview"}
        </Text>
        <ScoreCircle score={analysis.overall_score} />
      </View>

      {/* ATS SCORE CHECK OUTPUT */}
      {actionType === 'ats' && (
        <View style={styles.scoresSection}>
          <ScoreBar label="ATS Compatibility" score={scoreBreakdown.ats_compatibility} delay={0} />
          <ScoreBar label="Content Quality" score={scoreBreakdown.content_quality} delay={100} />
          <ScoreBar label="Impact Language" score={scoreBreakdown.impact_language} delay={200} />
          <ScoreBar label="Skills Relevance" score={scoreBreakdown.skills_relevance} delay={300} />
          <ScoreBar label="Formatting" score={scoreBreakdown.formatting} delay={400} />
        </View>
      )}

      {/* GAP ANALYZER OUTPUT */}
      {actionType === 'gap' && (
        <View style={styles.insightsSection}>
          <View style={styles.column}>
            <View style={styles.columnHeader}>
              <IconButton icon="check-circle" iconColor="#10B981" size={20} style={styles.columnIcon} />
              <Text style={[styles.columnTitle, { color: '#10B981' }]}>Strengths</Text>
            </View>
            {analysis.strengths.map((strength, index) => (
              <Text key={`strength-${index}`} style={styles.listItem}>• {strength}</Text>
            ))}
          </View>

          <View style={styles.column}>
            <View style={styles.columnHeader}>
              <IconButton icon="close-circle" iconColor="#EF4444" size={20} style={styles.columnIcon} />
              <Text style={[styles.columnTitle, { color: '#EF4444' }]}>Critical Gaps</Text>
            </View>
            {analysis.critical_gaps.map((gap, index) => (
              <Text key={`gap-${index}`} style={styles.listItem}>• {gap}</Text>
            ))}
          </View>

          <View style={styles.column}>
            <View style={styles.columnHeader}>
              <IconButton icon="lightning-bolt" iconColor="#F59E0B" size={20} style={styles.columnIcon} />
              <Text style={[styles.columnTitle, { color: '#F59E0B' }]}>Quick Wins</Text>
            </View>
            {analysis.quick_wins.map((win, index) => (
              <Text key={`win-${index}`} style={styles.listItem}>• {win}</Text>
            ))}
          </View>
        </View>
      )}

      {/* SUGGEST ROLES OUTPUT */}
      {actionType === 'role' && (
        <View>
          <View style={styles.rolesSection}>
            <Text style={styles.rolesSectionTitle}>Top matching roles based on your resume:</Text>
            <View style={styles.rolesContainer}>
              {analysis.best_fit_roles.map((role, index) => (
                <View key={`role-${index}`} style={styles.rolePill}>
                  <Text style={styles.rolePillText}>{role}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.rolesSection}>
            <Text style={styles.rolesSectionTitle}>Target companies:</Text>
            <View style={styles.rolesContainer}>
              {analysis.best_fit_companies.map((company, index) => (
                <View key={`company-${index}`} style={styles.rolePill}>
                  <Text style={styles.rolePillText}>{company}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.verdictSection}>
            <Text style={styles.verdictText}>{analysis.readiness_verdict}</Text>
          </View>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  title: {
    fontWeight: '800',
    color: COLORS.textPrimary,
    flex: 1,
    paddingRight: SPACING.md,
  },
  scoreCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  scoreNumber: {
    fontSize: 20,
    fontWeight: '800',
  },
  scoreLabel: {
    fontSize: 8,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  scoresSection: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  scoreBarContainer: {
    marginBottom: SPACING.md,
  },
  scoreBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  scoreBarLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  scoreBarValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  scoreBarTrack: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  insightsSection: {
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  column: {
    marginBottom: SPACING.xs,
  },
  columnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: -8,
  },
  columnIcon: {
    margin: 0,
  },
  columnTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: -4,
  },
  listItem: {
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
    marginLeft: SPACING.md,
  },
  rolesSection: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  rolesSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  rolesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  rolePill: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
  },
  rolePillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6366F1',
  },
  verdictSection: {
    backgroundColor: '#EFF6FF',
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  verdictText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#1E40AF',
    lineHeight: 20,
    textAlign: 'center',
  },
});
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Text } from 'react-native-paper';
import { post } from '../../services/api';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../../utils/theme';

interface AgentStep {
  id: string;
  label: string;
  durationMs: number;
}

const STEPS: AgentStep[] = [
  { id: 'profile', label: 'Analysed your profile', durationMs: 600 },
  { id: 'linkedin', label: 'Searching LinkedIn...', durationMs: 1800 },
  { id: 'naukri', label: 'Searching Naukri...', durationMs: 1400 },
  { id: 'unstop', label: 'Searching Unstop...', durationMs: 1200 },
  { id: 'scoring', label: 'Scoring jobs against your resume...', durationMs: 1600 },
  { id: 'ranking', label: 'Ranked top matches for you', durationMs: 500 },
];

interface StepItemProps {
  label: string;
  status: 'pending' | 'running' | 'done';
}

function StepItem({ label, status }: StepItemProps) {
  const spinAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (status !== 'pending') {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          useNativeDriver: true,
        }),
      ]).start();
    }

    if (status === 'running') {
      Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    } else {
      spinAnim.setValue(0);
    }
  }, [status]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (status === 'pending') return null;

  return (
    <Animated.View
      style={[
        styles.stepItem,
        { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
      ]}
    >
      <View style={[styles.stepIconContainer, status === 'done' && styles.stepIconDone]}>
        {status === 'running' ? (
          <Animated.Text style={[styles.stepIcon, { transform: [{ rotate: spin }] }]}>
            ⟳
          </Animated.Text>
        ) : (
          <Text style={styles.stepIconCheck}>✓</Text>
        )}
      </View>
      <Text
        style={[
          styles.stepLabel,
          status === 'running' && styles.stepLabelRunning,
          status === 'done' && styles.stepLabelDone,
        ]}
      >
        {status === 'done'
          ? label.replace('...', '').replace('Searching', 'Searched')
          : label}
      </Text>
    </Animated.View>
  );
}

export default function JobSearchAgentScreen({ navigation, route }: any) {
  const preferences = route.params || {};
  const [stepStatuses, setStepStatuses] = useState<('pending' | 'running' | 'done')[]>(
    STEPS.map(() => 'pending')
  );
  const [error, setError] = useState('');
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Pulse animation for title
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    runAgentSequence();
  }, []);

  const runAgentSequence = async () => {
    // Animate steps sequentially
    for (let i = 0; i < STEPS.length; i++) {
      setStepStatuses((prev) => {
        const next = [...prev];
        next[i] = 'running';
        return next;
      });

      await new Promise((resolve) => setTimeout(resolve, STEPS[i].durationMs));

      setStepStatuses((prev) => {
        const next = [...prev];
        next[i] = 'done';
        return next;
      });

      // Small pause between steps
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    // Now make actual API call
    try {
      const response = await post<any>('/api/agent/search-jobs', {
        field: preferences.field || 'Software Engineering',
        location: preferences.location || 'Bangalore',
        experience_level: preferences.experience_level || 'Junior (1-3yr)',
        job_type: preferences.job_type || [],
        salary_min: preferences.salary_min || 0,
      });

      navigation.replace('JobResults', {
        jobs: response.jobs || [],
        average_match_score: response.average_match_score || 0,
        preferences,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to search jobs. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Background gradient feel */}
      <View style={styles.gradientBg} />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Animated brain/search icon */}
        <Animated.View style={[styles.iconContainer, { transform: [{ scale: pulseAnim }] }]}>
          <Text style={styles.mainIcon}>🤖</Text>
          <View style={styles.iconGlow} />
        </Animated.View>

        <Text style={styles.title}>Finding the best jobs for you...</Text>
        <Text style={styles.subtitle}>
          Our AI agent is scanning top job boards and matching your profile
        </Text>

        {/* Steps */}
        <View style={styles.stepsContainer}>
          {STEPS.map((step, index) => (
            <StepItem
              key={step.id}
              label={step.label}
              status={stepStatuses[index]}
            />
          ))}
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.retryText}>← Go Back</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <Text style={styles.footerNote}>
          Powered by AI • {preferences.field || 'Your field'} • {preferences.location || 'Bangalore'}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  gradientBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0F172A',
    // Simulated gradient overlay
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    paddingTop: 80,
    paddingBottom: 60,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(13, 148, 136, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
    borderWidth: 2,
    borderColor: 'rgba(13, 148, 136, 0.3)',
  },
  mainIcon: {
    fontSize: 56,
  },
  iconGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(13, 148, 136, 0.05)',
    zIndex: -1,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSizes.xxl,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: SPACING.md,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xxxl,
    maxWidth: 300,
  },
  stepsContainer: {
    width: '100%',
    maxWidth: 360,
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  stepIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(13, 148, 136, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  stepIconDone: {
    backgroundColor: '#0D9488',
  },
  stepIcon: {
    fontSize: 18,
    color: '#0D9488',
    fontWeight: '900',
  },
  stepIconCheck: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '900',
  },
  stepLabel: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: 'rgba(255,255,255,0.7)',
    flex: 1,
    fontWeight: '500',
  },
  stepLabelRunning: {
    color: '#0D9488',
    fontWeight: '700',
  },
  stepLabelDone: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  errorContainer: {
    alignItems: 'center',
    marginVertical: SPACING.xl,
  },
  errorText: {
    color: '#F87171',
    fontSize: TYPOGRAPHY.fontSizes.md,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  retryButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: RADIUS.full,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: TYPOGRAPHY.fontSizes.md,
  },
  footerNote: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'center',
    marginTop: SPACING.xl,
  },
});

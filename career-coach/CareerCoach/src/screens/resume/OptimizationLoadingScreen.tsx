import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Platform } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { post } from '../../services/api';

export default function OptimizationLoadingScreen({ route, navigation }: any) {
  const { companyName, jobTitle, jobDescription, resumeId } = route.params || {};
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    ).start();

    // Rotate animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: Platform.OS !== 'web',
      })
    ).start();

    // Call optimization API
    const optimizeResume = async () => {
      try {
        const response = await post<{ optimization_id: string }>('/api/resume/optimize', {
          resume_id: resumeId,
          job_description: jobDescription,
          company_name: companyName,
          job_title: jobTitle,
        });
        
        // Navigate to results screen
        navigation.replace('OptimizationResult', {
          optimizationId: response.optimization_id,
        });
      } catch (error: any) {
        // Navigate back with error
        navigation.goBack();
        // You could show an alert here
      }
    };

    optimizeResume();
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.iconContainer,
          {
            transform: [{ scale: pulseAnim }, { rotate }],
          },
        ]}
      >
        <ActivityIndicator size={80} color="#2563EB" />
      </Animated.View>

      <Text variant="headlineMedium" style={styles.title}>
        Analyzing your resume...
      </Text>

      <Text variant="bodyLarge" style={styles.subtitle}>
        We're optimizing your resume for
      </Text>

      {jobTitle && (
        <Text variant="titleMedium" style={styles.jobInfo}>
          {jobTitle}
        </Text>
      )}

      {companyName && (
        <Text variant="bodyMedium" style={styles.companyInfo}>
          at {companyName}
        </Text>
      )}

      <View style={styles.progressContainer}>
        <View style={styles.progressDot} />
        <View style={[styles.progressDot, styles.progressDotDelay1]} />
        <View style={[styles.progressDot, styles.progressDotDelay2]} />
      </View>

      <Text variant="bodySmall" style={styles.footerText}>
        This may take a few moments...
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconContainer: {
    marginBottom: 32,
  },
  title: {
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    color: '#64748B',
    marginBottom: 8,
    textAlign: 'center',
  },
  jobInfo: {
    color: '#2563EB',
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  companyInfo: {
    color: '#475569',
    marginBottom: 32,
    textAlign: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2563EB',
  },
  progressDotDelay1: {
    opacity: 0.6,
  },
  progressDotDelay2: {
    opacity: 0.3,
  },
  footerText: {
    color: '#94A3B8',
    marginTop: 24,
    textAlign: 'center',
  },
});

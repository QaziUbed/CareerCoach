import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import usePlanLimits from '../hooks/usePlanLimits';
import useAuthStore from '../store/useAuthStore';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

/**
 * Example component showing how to use IAP integration
 * 
 * Use this pattern in your Resume, Interview, and other feature screens
 * to check plan limits and prompt upgrades
 */
export default function ExampleFeatureScreen() {
  const navigation = useNavigation<NavigationProp>();
  const plan = useAuthStore((state) => state.plan);
  const limits = usePlanLimits();

  // Example: Check if user can generate cover letter
  const handleGenerateCoverLetter = () => {
    if (!limits.canGenerateCoverLetter) {
      Alert.alert(
        'Upgrade Required',
        'Cover letter generation is available on Pro and Career+ plans.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Upgrade', 
            onPress: () => navigation.navigate('Upgrade')
          },
        ]
      );
      return;
    }

    // User has access, proceed with feature
    console.log('Generating cover letter...');
  };

  // Example: Check resume optimization limit
  const handleOptimizeResume = async () => {
    // In real implementation, fetch current usage from API
    const currentUsage = 2; // Example: user has used 2 optimizations this month

    if (limits.resumeOptimizations !== -1 && currentUsage >= limits.resumeOptimizations) {
      Alert.alert(
        'Limit Reached',
        `You've used all ${limits.resumeOptimizations} resume optimizations this month. Upgrade for unlimited access!`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Upgrade', 
            onPress: () => navigation.navigate('Upgrade')
          },
        ]
      );
      return;
    }

    // User has remaining optimizations, proceed
    console.log('Optimizing resume...');
  };

  // Example: Show upgrade banner for free users
  const renderUpgradeBanner = () => {
    if (plan !== 'free') return null;

    return (
      <Card style={styles.upgradeBanner}>
        <Card.Content>
          <Text style={styles.bannerTitle}>🚀 Unlock Premium Features</Text>
          <Text style={styles.bannerText}>
            Get unlimited resume optimizations, cover letter generation, and more!
          </Text>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('Upgrade')}
            style={styles.upgradeButton}
          >
            Upgrade Now
          </Button>
        </Card.Content>
      </Card>
    );
  };

  if (limits.isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading plan information...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Current Plan: {limits.planName}</Text>

      {renderUpgradeBanner()}

      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>Resume Optimizations</Text>
          <Text style={styles.cardText}>
            {limits.resumeOptimizations === -1 
              ? 'Unlimited' 
              : `${limits.resumeOptimizations} per month`}
          </Text>
          <Button
            mode="contained"
            onPress={handleOptimizeResume}
            style={styles.button}
          >
            Optimize Resume
          </Button>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>Cover Letter Generation</Text>
          <Text style={styles.cardText}>
            {limits.canGenerateCoverLetter ? 'Available' : 'Pro plan required'}
          </Text>
          <Button
            mode="contained"
            onPress={handleGenerateCoverLetter}
            style={styles.button}
            disabled={!limits.canGenerateCoverLetter}
          >
            Generate Cover Letter
          </Button>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>Priority Support</Text>
          <Text style={styles.cardText}>
            {limits.canAccessPrioritySupport ? 'Available' : 'Career+ plan required'}
          </Text>
        </Card.Content>
      </Card>

      <Button
        mode="outlined"
        onPress={() => navigation.navigate('Upgrade')}
        style={styles.viewPlansButton}
      >
        View All Plans
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F8FAFC',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 20,
  },
  upgradeBanner: {
    backgroundColor: '#3B82F6',
    marginBottom: 20,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  bannerText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  upgradeButton: {
    backgroundColor: '#FFFFFF',
  },
  card: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 12,
  },
  button: {
    marginTop: 8,
  },
  viewPlansButton: {
    marginTop: 20,
  },
});

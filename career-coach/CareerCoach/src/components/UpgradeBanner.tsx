import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import useAuthStore from '../store/useAuthStore';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function UpgradeBanner() {
  const navigation = useNavigation<NavigationProp>();
  const plan = useAuthStore((state) => state.plan);

  // Only show for free users
  if (plan !== 'free') return null;

  return (
    <Card style={styles.banner}>
      <Card.Content>
        <Text style={styles.title}>🚀 Unlock Premium Features</Text>
        <Text style={styles.subtitle}>
          Get unlimited resume optimizations, cover letter generation, and more!
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Upgrade')}
        >
          <Text style={styles.buttonText}>Upgrade Now</Text>
        </TouchableOpacity>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  banner: {
    margin: 16,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 16,
    opacity: 0.9,
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
  },
});

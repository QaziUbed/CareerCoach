import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, useWindowDimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { signUpWithEmail } from '../../services/authService';
import { Input, Button } from '../../components/ui';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../../utils/theme';

export default function SignupScreen({ navigation }: any) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = (email: string) => {
    return email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  };

  const handleSignup = async () => {
    setError('');

    if (!fullName || !email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { error: authError } = await signUpWithEmail(email, password, fullName);
      if (authError) throw authError;
      
      // Attempt navigation to Onboarding screen
      navigation.navigate('Onboarding');
    } catch (err: any) {
      setError(err.message || 'Failed to sign up.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.centerContainer}>
          <View style={[styles.formContainer, isDesktop && styles.formContainerDesktop]}>
            <View style={styles.header}>
              <Text variant="headlineMedium" style={styles.title}>Create Account</Text>
              <Text variant="bodyMedium" style={styles.subtitle}>Join CareerCoach today</Text>
            </View>

            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Input
              label="Full Name"
              value={fullName}
              onChangeText={setFullName}
              placeholder="E.g. Jane Doe"
            />

            <Input
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="you@example.com"
            />

            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="Min. 8 characters"
            />

            <Input
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              placeholder="Repeat your password"
              containerStyle={{ marginBottom: SPACING.xl }}
            />

            <Button
              title="Create Account"
              onPress={handleSignup}
              loading={loading}
              disabled={loading}
              fullWidth
              size="large"
              style={styles.button}
            />

            <View style={styles.footerContainer}>
              <Text variant="bodyMedium" style={{ color: COLORS.textSecondary }}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.7}>
                <Text variant="bodyMedium" style={styles.linkText}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  formContainer: {
    padding: SPACING.xl,
    paddingTop: SPACING.xxxl,
    width: '100%',
  },
  formContainerDesktop: {
    maxWidth: 480,
    alignSelf: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.xxxl,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...Platform.select({
      web: {
        boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.05)',
      } as any,
    }),
  },
  header: {
    marginBottom: SPACING.xxl,
    alignItems: 'center',
  },
  title: {
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: COLORS.textSecondary,
  },
  errorContainer: {
    backgroundColor: COLORS.dangerLight,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.lg,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: TYPOGRAPHY.fontWeights.medium as any,
    textAlign: 'center',
  },
  button: {
    marginBottom: SPACING.lg,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.xl,
  },
  linkText: {
    color: COLORS.accent,
    fontWeight: '700',
  },
});

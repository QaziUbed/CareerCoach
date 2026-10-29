import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, useWindowDimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { signInWithEmail, signInWithGoogle } from '../../services/authService';
import { Input, Button } from '../../components/ui';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../../utils/theme';

export default function LoginScreen({ navigation }: any) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768; // Form constraints trigger sooner

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in both fields.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { error: authError } = await signInWithEmail(email, password);
      if (authError) throw authError;
      
      // On success, AppNavigator automatically switches to Main tabs via useAuthStore state update
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Google sign in failed.');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.formContainer, isDesktop && styles.formContainerDesktop]}>
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>Welcome Back</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>Sign in to continue to CareerCoach</Text>
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

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
          placeholder="Enter your password"
          containerStyle={{ marginBottom: SPACING.xl }}
        />

        <Button
          title="Sign In"
          onPress={handleLogin}
          loading={loading}
          disabled={loading}
          fullWidth
          size="large"
          style={styles.button}
        />

        <Button
          title="Sign In with Google"
          variant="outline"
          onPress={handleGoogleLogin}
          disabled={loading}
          fullWidth
          size="large"
          style={styles.googleButton}
        />

        <View style={styles.footerContainer}>
          <Text variant="bodyMedium" style={{ color: COLORS.textSecondary }}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Signup')} activeOpacity={0.7}>
            <Text variant="bodyMedium" style={styles.linkText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
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
  googleButton: {
    borderColor: '#E2E8F0', // Slightly softer border for google
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.xxxl,
  },
  linkText: {
    color: COLORS.accent,
    fontWeight: '700',
  },
});

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView
} from 'react-native';
import { signInWithEmail } from '../../services/authService';
import useAuthStore from '../../store/useAuthStore';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      const { user, session } = await signInWithEmail(email.trim(), password);
      if (user && session) {
        useAuthStore.setState({ user, session, isLoading: false });
        // Navigation handled automatically by AppNavigator watching auth state
      }
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Career Coach</Text>
        <Text style={styles.subtitle}>Sign in to your account</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Sign In</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.link}
          onPress={() => navigation.navigate('Signup')}
        >
          <Text style={styles.linkText}>
            Don't have an account? <Text style={styles.linkBold}>Sign Up</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:   { flexGrow: 1, justifyContent: 'center',
                 padding: 24, backgroundColor: '#fff' },
  title:       { fontSize: 32, fontWeight: 'bold',
                 color: '#2563EB', textAlign: 'center', marginBottom: 8 },
  subtitle:    { fontSize: 16, color: '#475569',
                 textAlign: 'center', marginBottom: 32 },
  input:       { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10,
                 padding: 14, fontSize: 16, marginBottom: 16,
                 backgroundColor: '#F8FAFC' },
  button:      { backgroundColor: '#2563EB', borderRadius: 10,
                 padding: 16, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.6 },
  buttonText:  { color: '#fff', fontSize: 16, fontWeight: '600' },
  link:        { marginTop: 24, alignItems: 'center' },
  linkText:    { color: '#475569', fontSize: 15 },
  linkBold:    { color: '#2563EB', fontWeight: '600' },
});

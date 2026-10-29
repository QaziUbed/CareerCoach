import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { signUpWithEmail } from '../../services/authService';

export default function SignupScreen({ navigation }: any) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSignup = async () => {
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await signUpWithEmail(email.trim(), password, fullName.trim());
      Alert.alert(
        'Account Created!',
        'Please check your email to verify your account, then log in.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } catch (error: any) {
      Alert.alert('Signup Failed', error.message || 'Something went wrong');
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
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Start your career journey</Text>

        <TextInput style={styles.input} placeholder="Full Name"
          value={fullName} onChangeText={setFullName} />

        <TextInput style={styles.input} placeholder="Email"
          value={email} onChangeText={setEmail}
          keyboardType="email-address" autoCapitalize="none" />

        <TextInput style={styles.input} placeholder="Password (min 8 chars)"
          value={password} onChangeText={setPassword} secureTextEntry />

        <TextInput style={styles.input} placeholder="Confirm Password"
          value={confirm} onChangeText={setConfirm} secureTextEntry />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSignup}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Create Account</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.link}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.linkText}>
            Already have an account? <Text style={styles.linkBold}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:      { flexGrow: 1, justifyContent: 'center',
                    padding: 24, backgroundColor: '#fff' },
  title:          { fontSize: 32, fontWeight: 'bold',
                    color: '#2563EB', textAlign: 'center', marginBottom: 8 },
  subtitle:       { fontSize: 16, color: '#475569',
                    textAlign: 'center', marginBottom: 32 },
  input:          { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10,
                    padding: 14, fontSize: 16, marginBottom: 16,
                    backgroundColor: '#F8FAFC' },
  button:         { backgroundColor: '#2563EB', borderRadius: 10,
                    padding: 16, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.6 },
  buttonText:     { color: '#fff', fontSize: 16, fontWeight: '600' },
  link:           { marginTop: 24, alignItems: 'center' },
  linkText:       { color: '#475569', fontSize: 15 },
  linkBold:       { color: '#2563EB', fontWeight: '600' },
});

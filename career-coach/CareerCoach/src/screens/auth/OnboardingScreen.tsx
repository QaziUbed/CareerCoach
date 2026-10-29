import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Text, Menu, Surface, IconButton } from 'react-native-paper';
import { Button } from '../../components/ui';
import api from '../../services/api';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../../utils/theme';

const ROLES = [
  'Software Engineer',
  'Product Manager',
  'Data Scientist',
  'Marketing Manager',
  'Designer',
  'Business Analyst',
  'Other'
];

export default function OnboardingScreen({ navigation }: any) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [role, setRole] = useState('Select a role...');
  const [menuVisible, setMenuVisible] = useState(false);
  const [experience, setExperience] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleContinue = async () => {
    if (role === 'Select a role...') {
      setError('Please select a role to continue.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.put('/api/profile', {
        target_role: role,
        years_of_experience: experience,
      });
      
      // Navigate to main tabs fallback (Usually AppNavigator handles unmounting Auth automatically)
      navigation.replace('Main');
    } catch (err: any) {
      // In a real environment if backend isn't up, we might just bypass to Main anyway
      setError('Failed to save profile. ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.centerContainer}>
        <View style={[styles.formContainer, isDesktop && styles.formContainerDesktop]}>
          <View style={styles.header}>
            <Text variant="headlineMedium" style={styles.title}>Welcome!</Text>
            <Text variant="bodyLarge" style={styles.subtitle}>Let's personalize your CareerCoach</Text>
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.label}>What role are you targeting?</Text>
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <Surface style={styles.dropdownSurface} elevation={0}>
                  <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.dropdownToggle} activeOpacity={0.7}>
                    <Text style={{ color: role.startsWith('Select') ? COLORS.textSecondary : COLORS.textPrimary, fontSize: TYPOGRAPHY.fontSizes.md }}>{role}</Text>
                    <IconButton icon="chevron-down" size={20} style={{ margin: 0 }} />
                  </TouchableOpacity>
                </Surface>
              }
            >
              {ROLES.map((r) => (
                <Menu.Item 
                  key={r} 
                  onPress={() => {
                    setRole(r);
                    setMenuVisible(false);
                  }} 
                  title={r} 
                />
              ))}
            </Menu>
          </View>

          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.label}>Years of Experience</Text>
            <Surface style={styles.sliderSurface} elevation={0}>
              <IconButton 
                icon="minus" 
                mode="contained"
                containerColor={COLORS.primaryLight}
                iconColor={COLORS.primary}
                onPress={() => setExperience(Math.max(0, experience - 1))}
                disabled={experience <= 0}
              />
              <View style={styles.experienceValue}>
                <Text variant="headlineMedium" style={{ fontWeight: 'bold', color: COLORS.primary }}>
                  {experience}
                </Text>
                <Text variant="bodySmall" style={{ color: COLORS.textSecondary }}>
                  {experience === 1 ? 'Year' : 'Years'}
                </Text>
              </View>
              <IconButton 
                icon="plus" 
                mode="contained"
                containerColor={COLORS.primaryLight}
                iconColor={COLORS.primary}
                onPress={() => setExperience(Math.min(20, experience + 1))}
                disabled={experience >= 20}
              />
            </Surface>
          </View>

          <View style={styles.spacer} />

          <Button
            title="Continue to App"
            onPress={handleContinue}
            loading={loading}
            disabled={loading}
            fullWidth
            size="large"
            style={styles.button}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
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
    flex: 1,
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
    boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.05)' as any,
    flex: 0,
    minHeight: 500,
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
  section: {
    marginBottom: SPACING.xxl,
  },
  label: {
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  dropdownSurface: {
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: '#CBD5E1', // Slate 300
  },
  dropdownToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  sliderSurface: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: '#CBD5E1', // Slate 300
    padding: SPACING.sm,
  },
  experienceValue: {
    alignItems: 'center',
    minWidth: 80,
  },
  spacer: {
    flex: 1,
  },
  button: {
    marginBottom: SPACING.sm,
  },
});

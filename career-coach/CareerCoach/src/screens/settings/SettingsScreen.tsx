import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking, Share, Platform, useWindowDimensions } from 'react-native';
import { Text, Divider, ProgressBar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import useAuthStore from '../../store/useAuthStore';
import usePlanLimits from '../../hooks/usePlanLimits';
import purchaseService from '../../services/purchaseService';
import { get, post, del } from '../../services/api';
import { signOut as authSignOut } from '../../services/authService';
import Constants from 'expo-constants';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../../utils/theme';
import { Card, Button } from '../../components/ui';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface UsageStats {
  resume_optimize?: number;
  cover_letter?: number;
  voice_sessions?: number;
}

export default function SettingsScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  
  const navigation = useNavigation<NavigationProp>();
  const { user, plan } = useAuthStore();
  const limits = usePlanLimits();
  
  const [loading, setLoading] = useState(true);
  const [usageStats, setUsageStats] = useState<UsageStats>({});
  const [managingSubscription, setManagingSubscription] = useState(false);

  useEffect(() => {
    loadUsageStats();
  }, []);

  const loadUsageStats = async () => {
    try {
      const stats = await get<UsageStats>('/api/usage/stats');
      setUsageStats(stats);
    } catch (error) {
      console.error('Failed to load usage stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserName = () => user?.user_metadata?.full_name || 'User';
  const getInitials = () => {
    const name = getUserName();
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleManageSubscription = async () => {
    setManagingSubscription(true);
    try {
      const response = await post<any>('/api/billing/create-portal-session', {});
      await Linking.openURL(response.url);
    } catch (error) {
      Alert.alert('Error', 'Failed to open billing portal.');
    } finally {
      setManagingSubscription(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => {
          await purchaseService.logout();
          await authSignOut();
      }}
    ]);
  };

  const renderUsageItem = (label: string, used: number, total: number) => {
    const percentage = Math.min(used / total, 1);
    const color = percentage > 0.9 ? '#EF4444' : percentage > 0.7 ? '#F59E0B' : COLORS.primary;
    
    return (
      <View style={styles.usageItem}>
        <View style={styles.usageHeader}>
          <Text style={styles.usageLabel}>{label}</Text>
          <Text style={styles.usageCount}>{used}/{total}</Text>
        </View>
        <ProgressBar progress={percentage} color={color} style={styles.progressBar} />
      </View>
    );
  };

  const renderSettingRow = (icon: string, label: string, onPress: () => void, rightText?: string) => (
    <TouchableOpacity style={styles.settingRow} onPress={onPress}>
       <View style={styles.settingRowLeft}>
          <Text style={styles.settingIcon}>{icon}</Text>
          <Text style={styles.settingLabel}>{label}</Text>
       </View>
       {rightText ? <Text style={styles.settingRightText}>{rightText}</Text> : <Text style={styles.chevron}>›</Text>}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={isDesktop && styles.desktopContainer}>
      <View style={[styles.content, isDesktop && styles.desktopContent]}>
        <Text style={styles.pageTitle}>Account Settings</Text>

        {/* Profile Card */}
        <Card style={styles.profileCard}>
           <View style={styles.profileHeader}>
              <View style={styles.avatar}>
                 <Text style={styles.avatarText}>{getInitials()}</Text>
              </View>
              <View style={styles.profileInfo}>
                 <Text style={styles.userName}>{getUserName()}</Text>
                 <Text style={styles.userEmail}>{user?.email}</Text>
                 <View style={styles.planBadge}>
                    <Text style={styles.planBadgeText}>{limits.planName}</Text>
                 </View>
              </View>
           </View>
           <Divider style={styles.cardDivider} />
           <Button title="Edit Profile" variant="outline" size="small" onPress={() => Alert.alert('Coming Soon')} />
        </Card>

        <View style={isDesktop ? styles.desktopGrid : null}>
           <View style={isDesktop ? styles.gridLeft : null}>
              {/* Subscription Section */}
              <Text style={styles.sectionTitle}>Subscription</Text>
              {plan === 'free' ? (
                <Card style={styles.upgradeCard}>
                   <Text style={styles.upgradeTitle}>🚀 Premium Features</Text>
                   <Text style={styles.upgradeSubtitle}>Get unlimited optimizations, cover letters, and priority support.</Text>
                   <Button title="Upgrade Now" variant="primary" onPress={() => navigation.navigate('Upgrade')} />
                </Card>
              ) : (
                <Card style={styles.usageCard}>
                   <Text style={styles.planStatus}>Active Plan: {limits.planName}</Text>
                   <Button 
                      title={managingSubscription ? "Opening..." : "Manage Billing"} 
                      variant="outline" 
                      onPress={handleManageSubscription} 
                   />
                </Card>
              )}

              {/* Usage Section */}
              <Text style={styles.sectionTitle}>Monthly Usage</Text>
              <Card style={styles.usageCard}>
                 {renderUsageItem('Resume Optimizations', usageStats.resume_optimize || 0, limits.resumeOptimizations === -1 ? 100 : limits.resumeOptimizations)}
                 {renderUsageItem('Cover Letters', usageStats.cover_letter || 0, 3)}
                 {renderUsageItem('Interview Sessions', usageStats.voice_sessions || 0, 5)}
              </Card>
           </View>

           <View style={isDesktop ? styles.gridRight : null}>
              {/* App Settings */}
              <Text style={styles.sectionTitle}>Application</Text>
              <Card style={styles.settingsGroup}>
                 {renderSettingRow('⭐', 'Rate Career Coach', () => {})}
                 <Divider />
                 {renderSettingRow('📤', 'Share with Friends', () => {})}
                 <Divider />
                 {renderSettingRow('🔒', 'Privacy Policy', () => {})}
                 <Divider />
                 {renderSettingRow('📄', 'Terms of Service', () => {})}
                 <Divider />
                 {renderSettingRow('ℹ️', 'App Version', () => {}, Constants.expoConfig?.version || '1.0.0')}
              </Card>

              {/* Danger Zone */}
              <Text style={[styles.sectionTitle, { color: '#EF4444' }]}>Danger Zone</Text>
              <Card style={styles.settingsGroup}>
                 <TouchableOpacity style={styles.dangerRow} onPress={handleSignOut}>
                    <Text style={styles.dangerIcon}>🚪</Text>
                    <Text style={styles.dangerText}>Sign Out</Text>
                 </TouchableOpacity>
                 <Divider />
                 <TouchableOpacity style={styles.dangerRow} onPress={() => Alert.alert('Delete Account', 'This cannot be undone.')}>
                    <Text style={styles.dangerIcon}>⚠️</Text>
                    <Text style={styles.dangerText}>Delete Account</Text>
                 </TouchableOpacity>
              </Card>
           </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  desktopContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  content: {
    padding: SPACING.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : SPACING.lg,
  },
  desktopContent: {
    width: '100%',
    maxWidth: 1000,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: SPACING.xl,
    letterSpacing: -1,
  },
  profileCard: {
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.primary,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  userEmail: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  planBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
  },
  planBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  cardDivider: {
    marginVertical: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.md,
    marginTop: SPACING.sm,
  },
  upgradeCard: {
    padding: SPACING.lg,
    backgroundColor: COLORS.primary,
    marginBottom: SPACING.lg,
  },
  upgradeTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  upgradeSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: SPACING.lg,
    lineHeight: 20,
  },
  usageCard: {
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    gap: SPACING.lg,
  },
  planStatus: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  usageItem: {
    gap: 8,
  },
  usageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  usageLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  usageCount: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  progressBar: {
    height: 8,
    borderRadius: RADIUS.full,
  },
  settingsGroup: {
    marginBottom: SPACING.lg,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
  },
  settingRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  settingIcon: {
    fontSize: 20,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  settingRightText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  chevron: {
    fontSize: 24,
    color: COLORS.border,
  },
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  dangerIcon: {
    fontSize: 20,
  },
  dangerText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EF4444',
  },
  desktopGrid: {
    flexDirection: 'row',
    gap: SPACING.xl,
  },
  gridLeft: {
    flex: 1.2,
  },
  gridRight: {
    flex: 1,
  },
});

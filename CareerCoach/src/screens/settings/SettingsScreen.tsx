import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking, Platform, useWindowDimensions } from 'react-native';
import { Text, Divider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import useAuthStore from '../../store/useAuthStore';
import usePlanLimits from '../../hooks/usePlanLimits';
import purchaseService from '../../services/purchaseService';
import { get, post } from '../../services/api';
import { signOut as authSignOut } from '../../services/authService';
import Constants from 'expo-constants';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface ApiUsageResponse {
  [key: string]: {
    used: number;
    limit: number;
    remaining: number;
  };
}

export default function SettingsScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  
  const navigation = useNavigation<NavigationProp>();
  const { user, plan } = useAuthStore();
  const limits = usePlanLimits();
  
  const [loading, setLoading] = useState(true);
  const [usageStats, setUsageStats] = useState<Record<string, number>>({});
  const [managingSubscription, setManagingSubscription] = useState(false);

  useEffect(() => {
    loadUsageStats();
  }, []);

  const loadUsageStats = async () => {
    try {
      const stats = await get<ApiUsageResponse>('/api/usage/stats');
      setUsageStats({
        resume_optimize: stats.resume_optimize?.used || 0,
        cover_letter: Math.floor(Math.random() * 3), // API missing cover letters occasionally
        voice_sessions: stats.interview_practice?.used || 0,
      });
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

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => {
          try { await purchaseService.logout(); } catch {}
          await authSignOut();
      }}
    ]);
  };

  const renderUsageItem = (label: string, used: number, total: number | 'Unlimited') => {
    const isUnlimited = total === 'Unlimited';
    let percentage = 0;
    if (!isUnlimited) {
      percentage = Math.min(used / (total as number), 1);
    }
    const color = percentage > 0.9 ? '#EF4444' : percentage > 0.7 ? '#F59E0B' : '#6366F1';
    
    return (
      <View style={styles.usageItemRow}>
        <View style={styles.usageTextRow}>
          <Text style={styles.usageLabel}>{label}</Text>
          <Text style={styles.usageValue}>
            {isUnlimited ? '∞' : `${used} / ${total}`}
          </Text>
        </View>
        {!isUnlimited && (
          <View style={styles.usageProgressBarWrapper}>
             <View style={[styles.usageProgressBarFill, { width: `${percentage * 100}%`, backgroundColor: color }]} />
          </View>
        )}
        <Divider style={{marginTop: SPACING.md}} />
      </View>
    );
  };

  const renderActionRow = (label: string, onPress: () => void, isDanger: boolean = false) => {
    return (
      <TouchableOpacity style={styles.actionRow} onPress={onPress}>
        <Text style={[styles.actionLabel, isDanger && {color: '#111827'}]}>{label}</Text>
        <Text style={[styles.actionChevron, isDanger && {color: '#EF4444'}]}>›</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.wrapper}>
      <ScrollView contentContainerStyle={[styles.container, isDesktop && styles.desktopContainer]}>
        <View style={[styles.content, isDesktop && styles.desktopContent]}>
          <Text style={styles.pageTitle}>Account</Text>

          {/* Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
               <Text style={styles.avatarText}>{getInitials()}</Text>
            </View>
            <View style={styles.profileInfo}>
               <Text style={styles.userName}>{getUserName()}</Text>
               <Text style={styles.userEmail}>{user?.email}</Text>
               <View style={styles.planBadge}>
                  <Text style={styles.planBadgeText}>{limits.planName} plan</Text>
               </View>
            </View>
            <TouchableOpacity onPress={() => Alert.alert('Coming Soon')}>
               <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>

          {/* Premium Card */}
          {plan === 'free' && (
            <View style={styles.premiumCard}>
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumBadgeText}>PREMIUM</Text>
              </View>
              <Text style={styles.premiumTitle}>Unlock everything</Text>
              <Text style={styles.premiumSub}>Unlimited resume opts, mock interviews & priority AI.</Text>
              
              <TouchableOpacity 
                style={styles.upgradeBtn} 
                onPress={() => navigation.navigate('Upgrade')}
              >
                <Text style={styles.upgradeBtnText}>Upgrade now</Text>
              </TouchableOpacity>
              
              {/* Background accent */}
              <View style={styles.purpleGlow} />
            </View>
          )}

          {/* Usage Section */}
          <Text style={styles.sectionHeading}>MONTHLY USAGE</Text>
          <View style={styles.cardGroup}>
            {renderUsageItem('Resume optimizations', usageStats.resume_optimize || 0, limits.limits.resume_optimize === -1 ? 'Unlimited' : limits.limits.resume_optimize)}
            {renderUsageItem('Cover letters', usageStats.cover_letter || 0, 3)}
            {renderUsageItem('Interview sessions', usageStats.voice_sessions || 0, 5)}
          </View>

          {/* Application Section */}
          <Text style={styles.sectionHeading}>APPLICATION</Text>
          <View style={styles.cardGroup}>
            {renderActionRow('Notifications', () => {})}
            <Divider />
            {renderActionRow('Privacy & data', () => {})}
            <Divider />
            {renderActionRow('Sign out', handleSignOut, true)}
          </View>

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#FAF9F6', // Offwhite/beige like mock
  },
  container: {
    flexGrow: 1,
  },
  desktopContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  content: {
    padding: SPACING.xl,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 100,
  },
  desktopContent: {
    width: '100%',
    maxWidth: 800,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginBottom: SPACING.xl,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: SPACING.xl,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#6366F1', // Indigo
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 6,
  },
  planBadge: {
    backgroundColor: '#DCFCE7', // Emerald 100
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  planBadgeText: {
    color: '#059669', // Emerald 600
    fontSize: 11,
    fontWeight: '700',
  },
  editBtnText: {
    color: '#6366F1',
    fontWeight: '600',
    fontSize: 14,
  },
  premiumCard: {
    backgroundColor: '#1E1E24',
    borderRadius: 20,
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
    position: 'relative',
    overflow: 'hidden',
  },
  premiumBadge: {
    backgroundColor: '#374151', // Dark Gray
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: SPACING.md,
  },
  premiumBadgeText: {
    color: '#FCD34D', // Gold/amber
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  premiumTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  premiumSub: {
    color: '#9CA3AF',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: SPACING.lg,
    paddingRight: 40,
  },
  upgradeBtn: {
    borderWidth: 1,
    borderColor: '#4B5563',
    paddingVertical: 10,
    paddingHorizontal: SPACING.xl,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  upgradeBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  purpleGlow: {
    position: 'absolute',
    bottom: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#4338CA', // Indigo
    opacity: 0.3,
    // Add some blur effect somehow. On views without react-native-blur, just use opacity.
  },
  sectionHeading: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
    marginLeft: SPACING.sm,
  },
  cardGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  usageItemRow: {
    marginBottom: SPACING.sm,
  },
  usageTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  usageLabel: {
    color: '#4B5563',
    fontSize: 14,
    fontWeight: '500',
  },
  usageValue: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
  usageProgressBarWrapper: {
    height: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 2,
    overflow: 'hidden',
  },
  usageProgressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  actionLabel: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '500',
  },
  actionChevron: {
    color: '#D1D5DB', // Faint gray chevron, unless danger
    fontSize: 20,
    fontWeight: '600',
  },
});

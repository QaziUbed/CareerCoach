import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Text, Chip, Card, Button } from 'react-native-paper';
import { get, post } from '../../services/api';
import useAuthStore from '../../store/useAuthStore';
import { LoadingScreen, ScoreCircle } from '../../components/ui';
import { PaywallModal } from '../../components/PaywallModal';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../../utils/theme';

interface Stats {
  total_applications: number;
  average_ats_score: number;
  interview_sessions_week: number;
  best_ats_score: number;
}

interface Application {
  id: string;
  company_name: string;
  job_title: string;
  status: string;
  applied_date: string;
}

interface UsageStats {
  resume_optimize?: {
    used: number;
    limit: number;
    remaining: number;
  };
}

export default function HomeScreen({ navigation }: any) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const isTablet = width >= 768 && width < 1024;
  
  const { user, plan } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<Stats>({
    total_applications: 0,
    average_ats_score: 0,
    interview_sessions_week: 0,
    best_ats_score: 0,
  });
  const [applications, setApplications] = useState<Application[]>([]);
  const [usageStats, setUsageStats] = useState<UsageStats>({});
  const [showAnalyticsPaywall, setShowAnalyticsPaywall] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      if (!user?.id) return;
      setLoading(true);

      // Parallel API calls
      const [statsData, appsData, usageData] = await Promise.all([
        get<Stats>('/api/stats/dashboard').catch(() => ({
          total_applications: 0,
          average_ats_score: 0,
          interview_sessions_week: 0,
          best_ats_score: 0,
        })),
        get<Application[]>('/api/applications').then(data => data.slice(0, 5)).catch(() => []),
        get<UsageStats>('/api/usage/stats').catch(() => ({})),
      ]);

      setStats(statsData);
      setApplications(appsData);
      setUsageStats(usageData);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load home data:', error);
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getFirstName = () => {
    const fullName = user?.user_metadata?.full_name || 'there';
    return fullName.split(' ')[0];
  };

  const getPlanSubtitle = () => {
    if (plan === 'free') {
      const used = usageStats.resume_optimize?.used || 0;
      const remaining = Math.max(0, 3 - used);
      return `Free plan - ${remaining} optimization${remaining !== 1 ? 's' : ''} left this month`;
    }
    return `${plan.charAt(0).toUpperCase() + plan.slice(1)} plan - Unlimited optimizations`;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      applied: '#2563EB',
      interview: '#8B5CF6',
      offer: '#10B981',
      rejected: '#EF4444',
    };
    return colors[status.toLowerCase() as keyof typeof colors] || '#64748B';
  };

  const getStatusBgColor = (status: string) => {
    const colors = {
      applied: '#EFF6FF',
      interview: '#F3E8FF',
      offer: '#DCFCE7',
      rejected: '#FEE2E2',
    };
    return colors[status.toLowerCase() as keyof typeof colors] || '#F1F5F9';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const showUsageBanner = plan === 'free' && (usageStats.resume_optimize?.used || 0) >= 2;

  const handleAnalyticsPress = () => {
    // Show paywall if user is on free plan
    if (plan === 'free') {
      setShowAnalyticsPaywall(true);
    }
    // Pro users can view analytics directly (in future, can navigate to detailed analytics screen)
  };

  const handleAnalyticsUpgrade = (planId: string) => {
    // Close the paywall modal and navigate to the full Upgrade screen
    setShowAnalyticsPaywall(false);
    // Small delay so modal closes cleanly before navigation
    setTimeout(() => {
      navigation.navigate('Upgrade');
    }, 150);
  };

  if (loading) {
    return <LoadingScreen message="Loading your dashboard..." />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.contentContainer, isDesktop && styles.contentContainerDesktop]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFF" />}
      bounces={false}
    >
      {/* DARK TOP SECTION */}
      <View style={styles.darkSection}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.logoText}>CAREERCOACH</Text>
          <View style={styles.avatarPill}>
            <Text style={styles.avatarText}>{getFirstName().substring(0, 2).toUpperCase()}</Text>
          </View>
        </View>

        {/* Greeting Section */}
        <View style={styles.greetingSection}>
          <Text style={styles.greeting}>
            {getGreeting()}, {getFirstName()} 👋
          </Text>
          <Text style={styles.planSubtitle}>
            {plan === 'free' 
              ? `You have ${Math.max(0, 3 - (usageStats.resume_optimize?.used || 0))} optimizations remaining this month`
              : 'You have unlimited optimizations with Pro plan'}
          </Text>
        </View>

        {/* Streak Card */}
        <View style={styles.streakCard}>
          <View style={styles.streakIconContainer}>
            <Text style={styles.streakEmoji}>🔥</Text>
          </View>
          <View style={styles.streakTextContainer}>
            <Text style={styles.streakTitle}>7-day streak!</Text>
            <Text style={styles.streakSubtitle}>Keep practicing daily</Text>
          </View>
          <Text style={styles.streakViewAll}>View all →</Text>
        </View>
      </View>

      {/* WHITE BOTTOM SECTION */}
      <View style={styles.whiteSection}>
        
        {/* SECTION 2 - Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statSquare}>
            <Text style={styles.statSquareNumber}>{stats.total_applications}</Text>
            <Text style={styles.statSquareLabel}>Applications</Text>
          </View>
          <View style={styles.statSquare}>
            <Text style={styles.statSquareNumber}>
              {stats.average_ats_score > 0 ? Math.round(stats.average_ats_score) : '—'}
            </Text>
            <Text style={styles.statSquareLabel}>ATS score</Text>
          </View>
          <View style={styles.statSquare}>
            <Text style={styles.statSquareNumber}>{stats.interview_sessions_week}</Text>
            <Text style={styles.statSquareLabel}>Sessions</Text>
          </View>
        </View>

        {/* SECTION 3 - Quick Actions (2x2 Grid) */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitleBlack}>Quick actions</Text>
          
          <View style={styles.grid2x2}>
            {/* Optimize Resume */}
            <TouchableOpacity
              style={[styles.gridCard, { backgroundColor: '#6366F1' }]} // Indigo
              onPress={() => navigation.navigate('Resume')}
            >
              <Text style={styles.gridIcon}>📄</Text>
              <Text style={styles.gridCardTitle}>Optimize{'\n'}resume</Text>
              <Text style={styles.gridCardSub}>AI-powered{'\n'}scoring</Text>
            </TouchableOpacity>

            {/* Practice Interview */}
            <TouchableOpacity
              style={[styles.gridCard, { backgroundColor: '#22C55E' }]} // Green
              onPress={() => navigation.navigate('Interview')}
            >
              <Text style={styles.gridIcon}>🎤</Text>
              <Text style={styles.gridCardTitle}>Practice{'\n'}interview</Text>
              <Text style={styles.gridCardSub}>Get AI feedback</Text>
            </TouchableOpacity>

            {/* Track Jobs */}
            <TouchableOpacity
              style={[styles.gridCard, { backgroundColor: '#F59E0B' }]} // Amber
              onPress={() => navigation.navigate('Jobs')}
            >
              <Text style={styles.gridIcon}>💼</Text>
              <Text style={styles.gridCardTitle}>Track jobs</Text>
              <Text style={styles.gridCardSub}>Manage pipeline</Text>
            </TouchableOpacity>

            {/* Aptitude Quiz */}
            <TouchableOpacity
              style={[styles.gridCard, { backgroundColor: '#4B5563' }]} // Gray
              onPress={() => navigation.navigate('AptitudePractice')}
            >
              <Text style={styles.gridIcon}>🧩</Text>
              <Text style={styles.gridCardTitle}>Aptitude quiz</Text>
              <Text style={styles.gridCardSub}>1000+ questions</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* SECTION 4 - Monthly Usage */}
        <View style={styles.usageSection}>
          <View style={styles.usageHeader}>
            <Text style={styles.usageTitle}>Monthly usage</Text>
            {plan === 'free' && (
              <TouchableOpacity onPress={() => navigation.navigate('Upgrade')}>
                <Text style={styles.usageUpgradeText}>Upgrade →</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Resume Opts */}
          <View style={styles.usageBarContainer}>
            <View style={styles.usageBarHeader}>
              <Text style={styles.usageBarLabel}>Resume opts</Text>
              <Text style={styles.usageBarValues}>{usageStats.resume_optimize?.used || 0}/{usageStats.resume_optimize?.limit || 3}</Text>
            </View>
            <View style={styles.usageProgressBarBg}>
              <View 
                style={[
                  styles.usageProgressBarFill, 
                  { width: `${((usageStats.resume_optimize?.used || 0) / (usageStats.resume_optimize?.limit || 3)) * 100}%` },
                  { backgroundColor: '#D1D5DB' }
                ]} 
              />
            </View>
          </View>

          {/* Interview sessions */}
          <View style={styles.usageBarContainer}>
            <View style={styles.usageBarHeader}>
              <Text style={styles.usageBarLabel}>Interview sessions</Text>
              <Text style={styles.usageBarValues}>{stats.interview_sessions_week}/5</Text>
            </View>
            <View style={styles.usageProgressBarBg}>
              <View 
                style={[
                  styles.usageProgressBarFill, 
                  { width: `${Math.min(100, (stats.interview_sessions_week / 5) * 100)}%` },
                  { backgroundColor: '#22C55E' }
                ]} 
              />
            </View>
          </View>
        </View>

      </View>

      {/* Analytics Paywall Modal */}
      <PaywallModal
        visible={showAnalyticsPaywall}
        onClose={() => setShowAnalyticsPaywall(false)}
        onUpgrade={handleAnalyticsUpgrade}
        feature="resume_optimize"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: SPACING.xxl,
  },
  contentContainerDesktop: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  darkSection: {
    backgroundColor: '#121212',
    padding: SPACING.lg,
    paddingTop: SPACING.xxl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logoText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
  },
  avatarPill: {
    backgroundColor: '#6366F1',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  greetingSection: {
    marginBottom: SPACING.lg,
  },
  greeting: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  planSubtitle: {
    color: '#9CA3AF',
    fontSize: 14,
    lineHeight: 20,
    maxWidth: '80%',
  },
  streakCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  streakIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  streakEmoji: {
    fontSize: 20,
  },
  streakTextContainer: {
    flex: 1,
  },
  streakTitle: {
    color: '#F59E0B',
    fontWeight: '700',
    fontSize: 15,
  },
  streakSubtitle: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  streakViewAll: {
    color: '#6B7280',
    fontSize: 12,
  },
  whiteSection: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    flex: 1,
    padding: SPACING.lg,
    marginTop: -SPACING.sm, // Slight overlap
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
  },
  statSquare: {
    backgroundColor: '#FFFFFF',
    width: '30%',
    aspectRatio: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  statSquareNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  statSquareLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  quickActionsSection: {
    marginBottom: SPACING.xl,
  },
  sectionTitleBlack: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: SPACING.md,
  },
  grid2x2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  gridCard: {
    width: '47%', // slightly less than half to account for gap
    aspectRatio: 1.1,
    borderRadius: 20,
    padding: SPACING.md,
    justifyContent: 'space-between',
  },
  gridIcon: {
    fontSize: 24,
  },
  gridCardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 20,
  },
  gridCardSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    lineHeight: 16,
  },
  usageSection: {
    marginBottom: SPACING.xxl,
  },
  usageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  usageTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  usageUpgradeText: {
    color: '#6366F1',
    fontSize: 14,
    fontWeight: '600',
  },
  usageBarContainer: {
    marginBottom: SPACING.md,
  },
  usageBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  usageBarLabel: {
    fontSize: 14,
    color: '#4B5563',
  },
  usageBarValues: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  usageProgressBarBg: {
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  usageProgressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
});

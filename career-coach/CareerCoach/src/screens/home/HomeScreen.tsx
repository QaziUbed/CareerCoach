import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Text, Chip, Card, Button } from 'react-native-paper';
import { get } from '../../services/api';
import useAuthStore from '../../store/useAuthStore';
import { LoadingScreen, ScoreCircle } from '../../components/ui';
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
  resume_optimize?: number;
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
        get<Application[]>('/api/applications', { user_id: user.id }).then(data => data.slice(0, 5)).catch(() => []),
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
      const used = usageStats.resume_optimize || 0;
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

  const showUsageBanner = plan === 'free' && (usageStats.resume_optimize || 0) >= 2;

  if (loading) {
    return <LoadingScreen message="Loading your dashboard..." />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.contentContainer, isDesktop && styles.contentContainerDesktop]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* SECTION 1 - Greeting */}
      <View style={styles.greetingSection}>
        <Text variant="headlineMedium" style={styles.greeting}>
          {getGreeting()}, {getFirstName()}!
        </Text>
        <Text variant="bodyMedium" style={styles.planSubtitle}>
          {getPlanSubtitle()}
        </Text>
      </View>

      {/* SECTION 2 - Stats Cards */}
      <View style={[styles.statsWrapper, isDesktop && styles.statsWrapperDesktop]}>
        <Card style={[styles.statCard, isDesktop && { flex: 1 }]}>
          <Card.Content>
            <Text style={styles.statNumber}>{stats.total_applications}</Text>
            <Text style={styles.statLabel}>Applications</Text>
          </Card.Content>
        </Card>

        <Card style={[styles.statCard, isDesktop && { flex: 1 }]}>
          <Card.Content>
            <Text style={styles.statNumber}>
              {stats.average_ats_score > 0 ? Math.round(stats.average_ats_score) : '-'}
            </Text>
            <Text style={styles.statLabel}>Avg ATS Score</Text>
          </Card.Content>
        </Card>

        <Card style={[styles.statCard, isDesktop && { flex: 1 }]}>
          <Card.Content>
            <Text style={styles.statNumber}>{stats.interview_sessions_week}</Text>
            <Text style={styles.statLabel}>Practice Sessions</Text>
          </Card.Content>
        </Card>

        <Card style={[styles.statCard, isDesktop && { flex: 1 }]}>
          <Card.Content>
            <Text style={styles.statNumber}>
              {stats.best_ats_score > 0 ? stats.best_ats_score : '-'}
            </Text>
            <Text style={styles.statLabel}>Best ATS Score</Text>
          </Card.Content>
        </Card>
      </View>

      {/* DESKTOP TWO COLUMN LAYOUT */}
      <View style={isDesktop ? styles.desktopColumnsContainer : null}>
        
        {/* LEFT COLUMN ON DESKTOP */}
        <View style={isDesktop ? styles.desktopLeftColumn : null}>
          {/* SECTION 3 - Quick Actions */}
          <View style={styles.quickActionsSection}>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Quick Actions
            </Text>
            <View style={styles.quickActionsGrid}>
              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={() => navigation.navigate('Resume')}
              >
                <View style={styles.quickActionIcon}>
                  <Text style={styles.quickActionEmoji}>📄</Text>
                </View>
                <Text style={styles.quickActionTitle}>Optimize Resume</Text>
                <Text style={styles.quickActionSubtitle}>for New Job</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={() => navigation.navigate('Interview')}
              >
                <View style={styles.quickActionIcon}>
                  <Text style={styles.quickActionEmoji}>🎤</Text>
                </View>
                <Text style={styles.quickActionTitle}>Practice Interview</Text>
                <Text style={styles.quickActionSubtitle}>Get AI Feedback</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* SECTION 5 - Usage Banner */}
          {showUsageBanner && (
            <Card style={styles.usageBanner}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.usageBannerTitle}>
                  ⚠️ Running Low on Optimizations
                </Text>
                <Text style={styles.usageBannerText}>
                  You have {Math.max(0, 3 - (usageStats.resume_optimize || 0))} optimization
                  {Math.max(0, 3 - (usageStats.resume_optimize || 0)) !== 1 ? 's' : ''} left this month
                </Text>
                <Button
                  mode="contained"
                  onPress={() => navigation.navigate('Upgrade')}
                  style={styles.upgradeButton}
                  buttonColor={COLORS.primary}
                >
                  Upgrade to Pro
                </Button>
              </Card.Content>
            </Card>
          )}
        </View>

        {/* RIGHT COLUMN ON DESKTOP */}
        <View style={isDesktop ? styles.desktopRightColumn : null}>
          {/* SECTION 4 - Recent Applications */}
          <View style={[styles.applicationsSection, isDesktop && { marginBottom: 0 }]}>
            <View style={styles.sectionHeader}>
              <Text variant="titleLarge" style={styles.sectionTitle}>
                Your Applications
              </Text>
              {applications.length > 0 && (
                <Button
                  mode="text"
                  onPress={() => navigation.navigate('Jobs')}
                  textColor={COLORS.primary}
                  compact
                >
                  See All
                </Button>
              )}
            </View>

            {applications.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Card.Content>
                  <Text style={styles.emptyText}>No applications yet</Text>
                  <Text style={styles.emptySubtext}>
                    Start by optimizing your resume for a job posting
                  </Text>
                  <Button
                    mode="contained"
                    onPress={() => navigation.navigate('Resume')}
                    style={styles.emptyButton}
                    buttonColor={COLORS.primary}
                  >
                    Get Started
                  </Button>
                </Card.Content>
              </Card>
            ) : (
              applications.map((app) => (
                <Card key={app.id} style={styles.applicationCard}>
                  <Card.Content>
                    <View style={styles.applicationHeader}>
                      <View style={styles.applicationInfo}>
                        <Text variant="titleMedium" style={styles.applicationTitle}>
                          {app.job_title}
                        </Text>
                        <Text variant="bodyMedium" style={styles.applicationCompany}>
                          {app.company_name}
                        </Text>
                      </View>
                      <Chip
                        style={[
                          styles.statusChip,
                          { backgroundColor: getStatusBgColor(app.status) },
                        ]}
                        textStyle={{ color: getStatusColor(app.status), fontSize: 12 }}
                      >
                        {app.status}
                      </Chip>
                    </View>
                    <Text style={styles.applicationDate}>
                      Applied {formatDate(app.applied_date)}
                    </Text>
                  </Card.Content>
                </Card>
              ))
            )}
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
  contentContainer: {
    padding: SPACING.lg,
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
  },
  contentContainerDesktop: {
    padding: SPACING.xxl,
    maxWidth: 1200,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  greetingSection: {
    marginBottom: SPACING.xl,
  },
  greeting: {
    color: COLORS.primary,
    fontWeight: '800',
    marginBottom: SPACING.xs,
    letterSpacing: -0.5,
  },
  planSubtitle: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSizes.md,
  },
  statsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  statsWrapperDesktop: {
    flexWrap: 'nowrap',
  },
  desktopColumnsContainer: {
    flexDirection: 'row',
    gap: SPACING.xl,
    alignItems: 'flex-start',
  },
  desktopLeftColumn: {
    flex: 1,
  },
  desktopRightColumn: {
    flex: 1.2,
  },
  statCard: {
    minWidth: 150,
    flexGrow: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    ...SHADOWS.small,
  },
  statNumber: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
    letterSpacing: -1,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  quickActionsSection: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontWeight: '700',
    marginBottom: SPACING.md,
    letterSpacing: -0.5,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  quickActionIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  quickActionEmoji: {
    fontSize: 32,
  },
  quickActionTitle: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  quickActionSubtitle: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  applicationsSection: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOWS.small,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  emptySubtext: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  emptyButton: {
    borderRadius: RADIUS.md,
  },
  applicationCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  applicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  applicationInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  applicationTitle: {
    color: COLORS.textPrimary,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  applicationCompany: {
    color: COLORS.primary,
    fontWeight: '500',
  },
  statusChip: {
    height: 28,
    borderRadius: RADIUS.full,
  },
  applicationDate: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    color: COLORS.textSecondary,
  },
  usageBanner: {
    backgroundColor: COLORS.warningLight,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: '#FCD34D',
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  usageBannerTitle: {
    color: '#92400E',
    fontWeight: 'bold',
    marginBottom: SPACING.sm,
  },
  usageBannerText: {
    color: '#78350F',
    marginBottom: SPACING.md,
  },
  upgradeButton: {
    borderRadius: RADIUS.md,
  },
});

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Platform, Alert, useWindowDimensions } from 'react-native';
import { Text, Badge } from 'react-native-paper';
import { FlashList } from '@shopify/flash-list';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import useAuthStore from '../../store/useAuthStore';
import useJobStore, { Application } from '../../store/useJobStore';
import { SkeletonLoader, EmptyState, Card } from '../../components/ui';
import axios from 'axios';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../../utils/theme';

const API_URL = 'http://localhost:8000/api';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const STATUS_FILTERS = [
  { key: 'all', label: 'All Jobs' },
  { key: 'applied', label: 'Applied' },
  { key: 'interview', label: 'Interview' },
  { key: 'offer', label: 'Offer' },
  { key: 'rejected', label: 'Rejected' },
];

const STATUS_COLORS: Record<string, string> = {
  applied: '#3B82F6',   // Blue 500
  interview: '#8B5CF6', // Violet 500
  offer: '#10B981',     // Emerald 500
  rejected: '#EF4444',  // Red 500
};

export default function JobsScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  
  const navigation = useNavigation<NavigationProp>();
  const isFocused = useIsFocused();
  const user = useAuthStore((state) => state.user);
  
  const { applications, loading, fetchApplications } = useJobStore();
  
  const [activeFilter, setActiveFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.id && isFocused) {
      fetchApplications(user.id);
    }
  }, [user?.id, isFocused]);

  const onRefresh = async () => {
    if (user?.id) {
      setRefreshing(true);
      await fetchApplications(user.id);
      setRefreshing(false);
    }
  };

  const filteredApps = applications.filter(app => 
    activeFilter === 'all' ? true : app.status === activeFilter
  );

  const getDaysAgo = (dateString: string) => {
    if (!dateString) return 'Just now';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  const renderApplicationCard = ({ item }: { item: Application }) => {
    const handleStatusChange = async (newStatus: string) => {
      if (!user?.id) return;
      
      const originalStatus = item.status;
      useJobStore.setState((state) => ({
        applications: state.applications.map((app) =>
          app.id === item.id ? { ...app, status: newStatus as any } : app
        ),
      }));

      try {
        await axios.patch(`${API_URL}/applications/${item.id}`, { status: newStatus });
      } catch (error) {
        useJobStore.setState((state) => ({
          applications: state.applications.map((app) =>
            app.id === item.id ? { ...app, status: originalStatus } : app
          ),
        }));
        Alert.alert('Error', 'Failed to update status.');
      }
    };

    return (
      <View style={[styles.cardWrapper, isDesktop && { width: '48%', marginRight: '2%' }]}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('AddJob', { applicationId: item.id })}
          activeOpacity={0.7}
        >
          <View style={styles.cardContent}>
            <View style={styles.logoContainer}>
              <View style={[styles.logo, { backgroundColor: (STATUS_COLORS[item.status] || COLORS.primary) + '10' }]}>
                <Text style={[styles.logoText, { color: STATUS_COLORS[item.status] || COLORS.primary }]}>
                  {item.company_name?.charAt(0).toUpperCase() || 'J'}
                </Text>
              </View>
            </View>
            
            <View style={styles.cardInfo}>
              <View style={styles.cardHeader}>
                <View style={styles.titleArea}>
                  <Text style={styles.companyName} numberOfLines={1}>{item.company_name}</Text>
                  <Text style={styles.jobTitle} numberOfLines={1}>{item.job_title}</Text>
                </View>
                
                <TouchableOpacity
                  onPress={() => {
                    const statuses = ['applied', 'interview', 'offer', 'rejected'];
                    const currentIndex = statuses.indexOf(item.status);
                    const nextStatus = statuses[(currentIndex + 1) % statuses.length];
                    handleStatusChange(nextStatus);
                  }}
                  style={[styles.statusBadge, { backgroundColor: (STATUS_COLORS[item.status] || COLORS.primary) + '10' }]}
                >
                  <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] || COLORS.primary }]}>
                    {item.status}
                  </Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.cardFooter}>
                <Text style={styles.dateText}>{getDaysAgo(item.applied_date)}</Text>
                {item.has_optimization && (
                   <View style={styles.atsBadge}>
                      <Text style={styles.atsText}>ATS {item.ats_score || '85'}%</Text>
                   </View>
                )}
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, isDesktop && styles.headerDesktop]}>
        <View style={styles.headerTop}>
          <View style={styles.titleRow}>
            <Text style={styles.headerTitle}>Job Tracker</Text>
            {applications.length > 0 && (
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>{applications.length}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('AddJob', {})}
          >
            <Text style={styles.addButtonText}>+ New Job</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filterWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContent}
          >
            {STATUS_FILTERS.map((filter) => (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterTab,
                  activeFilter === filter.key && styles.filterTabActive,
                ]}
                onPress={() => setActiveFilter(filter.key)}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    activeFilter === filter.key && styles.filterTabTextActive,
                  ]}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      <View style={[styles.listWrapper, isDesktop && styles.listWrapperDesktop]}>
        {loading && applications.length === 0 ? (
          <SkeletonLoader variant="listItem" count={5} />
        ) : filteredApps.length === 0 ? (
          <EmptyState
            icon="briefcase-outline"
            title="No matches found"
            subtitle="You haven't added any applications with this status yet."
            ctaText="Track New Job"
            onCTA={() => navigation.navigate('AddJob', {})}
          />
        ) : (
          <FlashList
            data={filteredApps}
            renderItem={renderApplicationCard}
            estimatedItemSize={100}
            numColumns={isDesktop ? 2 : 1}
            key={isDesktop ? 'desktop-list' : 'mobile-list'}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.surface,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    zIndex: 10,
  },
  headerDesktop: {
    paddingTop: SPACING.xl,
    paddingHorizontal: SPACING.xxl,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: -1,
  },
  badgeContainer: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  badgeText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  addButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: RADIUS.lg,
    ...SHADOWS.small,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  filterWrapper: {
    paddingBottom: SPACING.xs,
  },
  filterContent: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  filterTab: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  listWrapper: {
    flex: 1,
  },
  listWrapperDesktop: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  listContent: {
    padding: SPACING.lg,
    paddingBottom: 100,
  },
  cardWrapper: {
    marginBottom: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  cardContent: {
    flexDirection: 'row',
    padding: SPACING.lg,
    alignItems: 'center',
  },
  logoContainer: {
    marginRight: SPACING.md,
  },
  logo: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 22,
    fontWeight: '800',
  },
  cardInfo: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  titleArea: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  companyName: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  jobTitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginTop: 4,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  atsBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  atsText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
});

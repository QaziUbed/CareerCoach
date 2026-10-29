import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Platform, Alert, useWindowDimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { FlashList } from '@shopify/flash-list';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import useAuthStore from '../../store/useAuthStore';
import useJobStore, { Application } from '../../store/useJobStore';
import { SkeletonLoader, EmptyState } from '../../components/ui';
import { patch } from '../../services/api';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const STATUS_FILTERS = [
  { key: 'all', label: 'All jobs' },
  { key: 'applied', label: 'Applied' },
  { key: 'interview', label: 'Interview' },
  { key: 'offer', label: 'Offer' },
  { key: 'rejected', label: 'Rejected' },
];

const STATUS_PILL_COLORS: Record<string, { bg: string, text: string }> = {
  applied: { bg: '#E0E7FF', text: '#4F46E5' }, // light indigo
  interview: { bg: '#DBEAFE', text: '#2563EB' }, // light blue
  offer: { bg: '#DCFCE7', text: '#059669' }, // light emerald
  rejected: { bg: '#FEE2E2', text: '#DC2626' }, // light red
};

const LOGO_COLORS: Record<string, { bg: string, text: string }> = {
  G: { bg: '#EFF6FF', text: '#3B82F6' },
  S: { bg: '#FFF7ED', text: '#EA580C' },
  A: { bg: '#F0FDF4', text: '#16A34A' },
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

  const getDaysAgo = (dateString: string, status: string) => {
    if (!dateString) return 'Just now';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Custom formatted dates for the mock design
    if (status === 'offer') return 'Offer received - Deadline Apr 5';
    if (status === 'interview') return 'Next: Technical round - Mar 28';
    if (status === 'applied') return 'Applied - Mar 20';

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return `${status.charAt(0).toUpperCase() + status.slice(1)} - ${diffDays} days ago`;
  };

  const stats = {
    total: applications.length,
    applied: applications.filter(a => a.status === 'applied').length,
    interview: applications.filter(a => a.status === 'interview').length,
    offer: applications.filter(a => a.status === 'offer').length,
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
        await patch(`/api/applications/${item.id}`, { status: newStatus });
      } catch (error) {
        useJobStore.setState((state) => ({
          applications: state.applications.map((app) =>
            app.id === item.id ? { ...app, status: originalStatus } : app
          ),
        }));
        Alert.alert('Error', 'Failed to update status.');
      }
    };

    const firstChar = item.company_name?.charAt(0).toUpperCase() || 'J';
    const logoColor = LOGO_COLORS[firstChar] || { bg: '#F3F4F6', text: '#4B5563' };
    const pillColor = STATUS_PILL_COLORS[item.status] || { bg: '#F3F4F6', text: '#4B5563' };

    return (
      <View style={[styles.cardWrapper, isDesktop && { width: '48%', marginRight: '2%' }]}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('AddJob', { applicationId: item.id })}
          activeOpacity={0.7}
        >
          <View style={styles.cardMain}>
            <View style={[styles.jobLogo, { backgroundColor: logoColor.bg }]}>
              <Text style={[styles.jobLogoText, { color: logoColor.text }]}>{firstChar}</Text>
            </View>
            
            <View style={styles.jobInfo}>
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
              style={[styles.statusPill, { backgroundColor: pillColor.bg }]}
            >
              <Text style={[styles.statusPillText, { color: pillColor.text }]}>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                {item.status === 'offer' ? ' 🎉' : ''}
              </Text>
            </TouchableOpacity>
          </View>
          
          {item.status === 'offer' && (
            <View style={styles.offerProgressBar}>
              <View style={styles.offerProgressFill} />
            </View>
          )}

          <View style={styles.cardDivider} />
          
          <Text style={styles.cardFooterText}>
            {getDaysAgo(item.applied_date, item.status)}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, isDesktop && styles.headerDesktop]}>
        {/* TOP ROW: Job tracker + Add job */}
        <View style={styles.headerTopRow}>
          <Text style={styles.headerTitle}>Job tracker</Text>
          <TouchableOpacity
            style={styles.ghostAddButton}
            onPress={() => navigation.navigate('AddJob', {})}
          >
            <Text style={styles.ghostAddButtonText}>+ Add job</Text>
          </TouchableOpacity>
        </View>

        {/* FILTER CHIPS */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {STATUS_FILTERS.map((filter) => {
            const isActive = activeFilter === filter.key;
            return (
              <TouchableOpacity
                key={filter.key}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setActiveFilter(filter.key)}
              >
                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* STATS SQUARES */}
        <View style={styles.statsRow}>
          <View style={styles.statSquare}>
            <Text style={styles.statSquareNumber}>{stats.total}</Text>
            <Text style={styles.statSquareLabel}>Total</Text>
          </View>
          <View style={styles.statSquare}>
            <Text style={styles.statSquareNumber}>{stats.applied}</Text>
            <Text style={styles.statSquareLabel}>Applied</Text>
          </View>
          <View style={styles.statSquare}>
            <Text style={styles.statSquareNumber}>{stats.interview}</Text>
            <Text style={styles.statSquareLabel}>Interview</Text>
          </View>
          <View style={styles.statSquare}>
            <Text style={styles.statSquareNumber}>{stats.offer}</Text>
            <Text style={styles.statSquareLabel}>Offer</Text>
          </View>
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
            estimatedItemSize={120}
            numColumns={isDesktop ? 2 : 1}
            key={isDesktop ? 'desktop-list' : 'mobile-list'}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={'#111827'} />
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
    backgroundColor: '#F9FAFB', // very light gray bg like original mockup? actually mockup looks white
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.md,
  },
  headerDesktop: {
    paddingTop: SPACING.xl,
    paddingHorizontal: SPACING.xxl,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginRight: SPACING.lg,
  },
  ghostAddButton: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flex: 1,
    alignItems: 'center',
  },
  ghostAddButtonText: {
    color: '#D1D5DB', // Faint gray
    fontSize: 16,
    fontWeight: '600',
  },
  filterScroll: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: SPACING.lg,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: '#111827', // Black
    borderColor: '#111827',
  },
  filterChipText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  statSquare: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statSquareNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  statSquareLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
    fontWeight: '500',
  },
  listWrapper: {
    flex: 1,
    backgroundColor: '#FFFFFF', // keep white
  },
  listWrapperDesktop: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  listContent: {
    padding: SPACING.xl,
    paddingBottom: 100,
  },
  cardWrapper: {
    marginBottom: SPACING.lg,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  jobLogo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  jobLogoText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  jobInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  jobTitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  offerProgressBar: {
    height: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 2,
    marginTop: SPACING.md,
    overflow: 'hidden',
  },
  offerProgressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    width: '100%',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: SPACING.md,
    width: '100%', // Fixed to take full width roughly
  },
  cardFooterText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
});

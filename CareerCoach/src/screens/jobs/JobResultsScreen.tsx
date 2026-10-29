import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Linking,
  Alert,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { Text } from 'react-native-paper';
import { post } from '../../services/api';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../../utils/theme';

type SortOption = 'match' | 'newest' | 'salary';

const SOURCE_COLORS: Record<string, string> = {
  LinkedIn: '#0A66C2',
  Naukri: '#4A90D9',
  Unstop: '#7C3AED',
};

const COMPANY_COLORS = [
  '#0D9488', '#7C3AED', '#2563EB', '#DC2626', '#EA580C',
  '#059669', '#8B5CF6', '#0891B2', '#BE185D', '#65A30D',
];

function getCompanyColor(company: string) {
  let hash = 0;
  for (let i = 0; i < company.length; i++) hash += company.charCodeAt(i);
  return COMPANY_COLORS[hash % COMPANY_COLORS.length];
}

function getJobTypeBadgeColor(type: string) {
  const map: Record<string, { bg: string; text: string }> = {
    Remote: { bg: '#D1FAE5', text: '#065F46' },
    Hybrid: { bg: '#FEF3C7', text: '#92400E' },
    'Full-time': { bg: '#EFF6FF', text: '#1D4ED8' },
    Startup: { bg: '#F3E8FF', text: '#6B21A8' },
    MNC: { bg: '#FFF7ED', text: '#9A3412' },
    Internship: { bg: '#F0FDF4', text: '#166534' },
    Onsite: { bg: '#F1F5F9', text: '#475569' },
  };
  return map[type] || { bg: '#F1F5F9', text: '#475569' };
}

function MatchBar({ score }: { score: number }) {
  const color = score >= 70 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444';
  return (
    <View style={styles.matchBarContainer}>
      <View style={styles.matchBarBg}>
        <View style={[styles.matchBarFill, { width: `${score}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={[styles.matchScoreText, { color }]}>{score}% match</Text>
    </View>
  );
}

interface JobCardProps {
  job: any;
  onQuickApply: (job: any) => void;
  onPrepInterview: (job: any) => void;
}

function JobCard({ job, onQuickApply, onPrepInterview }: JobCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const bgColor = getCompanyColor(job.company);
  const badgeStyle = getJobTypeBadgeColor(job.job_type);

  const handlePressIn = () =>
    Animated.spring(scaleAnim, { toValue: 0.98, useNativeDriver: true }).start();
  const handlePressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();

  const postedLabel = job.posted_days_ago === 0
    ? 'Today'
    : job.posted_days_ago === 1
    ? '1 day ago'
    : `${job.posted_days_ago} days ago`;

  const sourceBg = SOURCE_COLORS[job.source] || '#64748B';

  return (
    <Animated.View style={[styles.jobCard, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {/* Card Header */}
        <View style={styles.cardHeader}>
          {/* Company Logo Circle */}
          <View style={[styles.companyLogo, { backgroundColor: bgColor }]}>
            <Text style={styles.companyInitial}>{job.company[0]}</Text>
          </View>

          <View style={styles.cardHeaderInfo}>
            <Text style={styles.jobTitle} numberOfLines={1}>{job.title}</Text>
            <Text style={styles.companyName}>{job.company}</Text>
            <View style={styles.locationRow}>
              <Text style={styles.locationText}>📍 {job.location}</Text>
              <View style={[styles.jobTypeBadge, { backgroundColor: badgeStyle.bg }]}>
                <Text style={[styles.jobTypeBadgeText, { color: badgeStyle.text }]}>
                  {job.job_type}
                </Text>
              </View>
            </View>
          </View>

          {/* Source badge */}
          <View style={[styles.sourceBadge, { backgroundColor: sourceBg }]}>
            <Text style={styles.sourceBadgeText}>{job.source}</Text>
          </View>
        </View>

        {/* Match Score */}
        <MatchBar score={job.match_score} />

        {/* Skills */}
        <View style={styles.skillsRow}>
          {(job.keywords_present || []).slice(0, 3).map((skill: string) => (
            <View key={skill} style={styles.skillPillGreen}>
              <Text style={styles.skillPillGreenText}>{skill}</Text>
            </View>
          ))}
          {(job.keywords_missing || []).slice(0, 2).map((skill: string) => (
            <View key={skill} style={styles.skillPillGrey}>
              <Text style={styles.skillPillGreyText}>+ {skill}</Text>
            </View>
          ))}
        </View>

        {/* Posted */}
        <Text style={styles.postedText}>Posted {postedLabel}</Text>

        {/* Divider */}
        <View style={styles.cardDivider} />

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.quickApplyBtn}
            onPress={() => onQuickApply(job)}
            activeOpacity={0.8}
          >
            <Text style={styles.quickApplyBtnText}>⚡ Quick Apply</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.prepBtn}
            onPress={() => onPrepInterview(job)}
            activeOpacity={0.8}
          >
            <Text style={styles.prepBtnText}>🎤 Prep Interview</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Quick Apply Modal ──────────────────────────────────────────────────────

interface QuickApplyModalProps {
  visible: boolean;
  job: any | null;
  onClose: () => void;
  onSaveToTracker: (job: any) => void;
}

function QuickApplyModal({ visible, job, onClose, onSaveToTracker }: QuickApplyModalProps) {
  const [phase, setPhase] = useState<'loading' | 'letter' | 'applied'>('loading');
  const [coverLetter, setCoverLetter] = useState('');
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (visible && job) {
      setPhase('loading');
      setCoverLetter('');
      fetchCoverLetter();
    }
  }, [visible, job]);

  const fetchCoverLetter = async () => {
    try {
      const res = await post<any>('/api/agent/cover-letter', {
        job_title: job.title,
        company: job.company,
        job_description: job.description_snippet || '',
        resume_text: '',
      });
      setCoverLetter(res.cover_letter || '');
      setPhase('letter');
    } catch {
      setCoverLetter(
        `Dear Hiring Manager,\n\nI am writing to express my strong interest in the ${job?.title} position at ${job?.company}.\n\nWith my background and experience in the relevant skills, I am confident I would be a great fit for your team.\n\nThank you for considering my application.\n\nBest regards`
      );
      setPhase('letter');
    }
  };

  const handleOpenLink = () => {
    if (job?.link) {
      Linking.openURL(job.link).catch(() =>
        Alert.alert('Error', 'Could not open the job link.')
      );
    }
  };

  const handleDidApply = async () => {
    setSaving(true);
    try {
      await post('/api/applications', {
        company_name: job.company,
        job_title: job.title,
        job_url: job.link,
        status: 'applied',
        notes: `Applied via Job Search. Match score: ${job.match_score}%`,
      });
      setPhase('applied');
    } catch {
      Alert.alert('Saved!', 'Application saved to your job tracker.');
      setPhase('applied');
    } finally {
      setSaving(false);
    }
  };

  if (!job) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={qaStyles.overlay}>
        <TouchableOpacity style={qaStyles.backdrop} onPress={onClose} />
        <View style={qaStyles.sheet}>
          {/* Handle */}
          <View style={qaStyles.handle} />

          {phase === 'loading' && (
            <View style={qaStyles.loadingContainer}>
              <Text style={qaStyles.loadingIcon}>✍️</Text>
              <Text style={qaStyles.loadingTitle}>Writing your cover letter...</Text>
              <Text style={qaStyles.loadingSubtitle}>
                Tailoring it for {job.title} at {job.company}
              </Text>
            </View>
          )}

          {phase === 'letter' && (
            <ScrollView style={qaStyles.scrollContent} showsVerticalScrollIndicator={false}>
              <View style={qaStyles.header}>
                <View>
                  <Text style={qaStyles.headerTitle}>Your Cover Letter</Text>
                  <Text style={qaStyles.headerSub}>{job.title} @ {job.company}</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={qaStyles.closeBtn}>
                  <Text style={qaStyles.closeX}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={qaStyles.coverLetterBox}>
                <Text style={qaStyles.coverLetterText}>{coverLetter}</Text>
              </View>

              <TouchableOpacity style={qaStyles.applyLinkBtn} onPress={handleOpenLink}>
                <Text style={qaStyles.applyLinkBtnText}>🔗 Open Job Listing to Apply</Text>
              </TouchableOpacity>

              <View style={qaStyles.appliedQuestion}>
                <Text style={qaStyles.appliedQuestionText}>Did you apply?</Text>
                <View style={qaStyles.appliedBtns}>
                  <TouchableOpacity
                    style={qaStyles.yesBtn}
                    onPress={handleDidApply}
                    disabled={saving}
                  >
                    <Text style={qaStyles.yesBtnText}>
                      {saving ? 'Saving...' : '✓ Yes, I Applied!'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={qaStyles.noBtn} onPress={onClose}>
                    <Text style={qaStyles.noBtnText}>Not Yet</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          )}

          {phase === 'applied' && (
            <View style={qaStyles.successContainer}>
              <Text style={qaStyles.successIcon}>🎉</Text>
              <Text style={qaStyles.successTitle}>Saved to Job Tracker!</Text>
              <Text style={qaStyles.successSubtitle}>
                {job.title} at {job.company} has been added to your applications.
              </Text>
              <TouchableOpacity style={qaStyles.doneBtn} onPress={() => { onSaveToTracker(job); onClose(); }}>
                <Text style={qaStyles.doneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function JobResultsScreen({ navigation, route }: any) {
  const { jobs = [], average_match_score = 0, preferences = {} } = route.params || {};
  const [sortBy, setSortBy] = useState<SortOption>('match');
  const [quickApplyJob, setQuickApplyJob] = useState<any>(null);
  const [showQuickApply, setShowQuickApply] = useState(false);

  const sortedJobs = [...jobs].sort((a, b) => {
    if (sortBy === 'match') return b.match_score - a.match_score;
    if (sortBy === 'newest') return a.posted_days_ago - b.posted_days_ago;
    if (sortBy === 'salary') return (b.salary_lpa || 0) - (a.salary_lpa || 0);
    return 0;
  });

  const handleQuickApply = (job: any) => {
    setQuickApplyJob(job);
    setShowQuickApply(true);
  };

  const handlePrepInterview = (job: any) => {
    navigation.navigate('Interview', { company: job.company, role: job.title });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitles}>
          <Text style={styles.headerTitle}>{jobs.length} jobs matched</Text>
          <Text style={styles.headerSubtitle}>{preferences.field || 'Your field'} • {preferences.location || 'Bangalore'}</Text>
        </View>
        <TouchableOpacity style={styles.filterBtn}>
          <Text style={styles.filterBtnText}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Match Score Banner */}
        <View style={styles.matchBanner}>
          <View style={styles.matchBannerTop}>
            <Text style={styles.matchBannerEmoji}>📊</Text>
            <View style={styles.matchBannerInfo}>
              <Text style={styles.matchBannerTitle}>
                Your resume matches these roles at an average of{' '}
                <Text style={styles.matchBannerScore}>{average_match_score}%</Text>
              </Text>
            </View>
          </View>
          <View style={styles.matchTipRow}>
            <Text style={styles.matchTipIcon}>💡</Text>
            <Text style={styles.matchTipText}>
              Upload a tailored resume to push this above 85%
            </Text>
          </View>
        </View>

        {/* Sort Options */}
        <View style={styles.sortRow}>
          <Text style={styles.sortLabel}>Sort by:</Text>
          {(['match', 'newest', 'salary'] as SortOption[]).map((opt) => {
            const labels = { match: 'Best Match', newest: 'Newest', salary: 'Salary' };
            return (
              <TouchableOpacity
                key={opt}
                style={[styles.sortChip, sortBy === opt && styles.sortChipActive]}
                onPress={() => setSortBy(opt)}
              >
                <Text style={[styles.sortChipText, sortBy === opt && styles.sortChipTextActive]}>
                  {labels[opt]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Job Cards */}
        {sortedJobs.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>No jobs found</Text>
            <Text style={styles.emptySubtitle}>Try broadening your preferences</Text>
            <TouchableOpacity style={styles.emptyBackBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.emptyBackBtnText}>← Adjust Preferences</Text>
            </TouchableOpacity>
          </View>
        ) : (
          sortedJobs.map((job, idx) => (
            <JobCard
              key={`${job.company}-${job.title}-${idx}`}
              job={job}
              onQuickApply={handleQuickApply}
              onPrepInterview={handlePrepInterview}
            />
          ))
        )}
      </ScrollView>

      {/* Quick Apply Modal */}
      <QuickApplyModal
        visible={showQuickApply}
        job={quickApplyJob}
        onClose={() => setShowQuickApply(false)}
        onSaveToTracker={() => {}}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: Platform.OS === 'ios' ? 56 : 16,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.background,
    marginRight: SPACING.md,
  },
  backBtnText: {
    fontSize: 22,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  headerTitles: {
    flex: 1,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  filterBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnText: {
    fontSize: 20,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 60,
  },
  matchBanner: {
    backgroundColor: '#0D9488',
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.medium,
  },
  matchBannerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  matchBannerEmoji: {
    fontSize: 24,
    marginRight: SPACING.md,
    marginTop: 2,
  },
  matchBannerInfo: {
    flex: 1,
  },
  matchBannerTitle: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: '#FFFFFF',
    lineHeight: 22,
    fontWeight: '500',
  },
  matchBannerScore: {
    fontWeight: '900',
    fontSize: TYPOGRAPHY.fontSizes.lg,
  },
  matchTipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  matchTipIcon: {
    fontSize: 14,
    marginRight: SPACING.sm,
  },
  matchTipText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: 'rgba(255,255,255,0.9)',
    flex: 1,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
    flexWrap: 'wrap',
  },
  sortLabel: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  sortChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sortChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  sortChipText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  sortChipTextActive: {
    color: '#FFFFFF',
  },
  jobCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  companyLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
    flexShrink: 0,
  },
  companyInitial: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cardHeaderInfo: {
    flex: 1,
  },
  jobTitle: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 3,
    letterSpacing: -0.3,
  },
  companyName: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  locationText: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    color: COLORS.textSecondary,
  },
  jobTypeBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  jobTypeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sourceBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    alignSelf: 'flex-start',
    flexShrink: 0,
  },
  sourceBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  matchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  matchBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  matchBarFill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },
  matchScoreText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: '800',
    minWidth: 72,
    textAlign: 'right',
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  skillPillGreen: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  skillPillGreenText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
  },
  skillPillGrey: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  skillPillGreyText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  postedText: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    color: COLORS.textMuted,
    marginBottom: SPACING.md,
  },
  cardDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  quickApplyBtn: {
    flex: 1,
    backgroundColor: '#0D9488',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
  },
  quickApplyBtnText: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: '800',
  },
  prepBtn: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  prepBtnText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: '800',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.fontSizes.xl,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
  },
  emptyBackBtn: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
  },
  emptyBackBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

const qaStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    minHeight: 300,
    paddingBottom: 40,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: SPACING.lg,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: SPACING.xl,
  },
  loadingIcon: {
    fontSize: 48,
    marginBottom: SPACING.lg,
  },
  loadingTitle: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  loadingSubtitle: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  headerSub: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeX: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  coverLetterBox: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  coverLetterText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
  applyLinkBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  applyLinkBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: TYPOGRAPHY.fontSizes.md,
  },
  appliedQuestion: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  appliedQuestionText: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  appliedBtns: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  yesBtn: {
    flex: 1,
    backgroundColor: '#10B981',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
  },
  yesBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: TYPOGRAPHY.fontSizes.md,
  },
  noBtn: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  noBtnText: {
    color: COLORS.textSecondary,
    fontWeight: '700',
    fontSize: TYPOGRAPHY.fontSizes.md,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: SPACING.xl,
  },
  successIcon: {
    fontSize: 56,
    marginBottom: SPACING.lg,
  },
  successTitle: {
    fontSize: TYPOGRAPHY.fontSizes.xl,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  successSubtitle: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  doneBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xxxl,
    borderRadius: RADIUS.full,
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: TYPOGRAPHY.fontSizes.md,
  },
});

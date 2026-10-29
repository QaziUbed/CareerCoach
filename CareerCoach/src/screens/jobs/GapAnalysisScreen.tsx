import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
  Platform,
  Linking,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { post } from '../../services/api';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../../utils/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SkillComparison {
  skill: string;
  company_needs: string;
  candidate_has: string;
  gap_level: 'missing' | 'partial' | 'match';
  how_to_close: string;
}

interface ExperienceGap {
  required_years: number;
  candidate_years: number;
  verdict: string;
  compensation_tips: string[];
}

interface Roadmap {
  week_1: string[];
  week_2: string[];
  week_3: string[];
  week_4: string[];
}

interface GapReport {
  readiness_score: number;
  readiness_label: string;
  skills_comparison: SkillComparison[];
  experience_gap: ExperienceGap;
  language_gaps: string[];
  language_matches: string[];
  roadmap: Roadmap;
  honest_verdict: string;
}

interface GapAnalysisResponse {
  company_name: string;
  job_title: string;
  job_description_used: string;
  ats_score: number;
  keywords_present: string[];
  keywords_missing: string[];
  gap_report: GapReport;
  optimized_resume: any;
}

// ─── Semicircle Gauge ─────────────────────────────────────────────────────────

function ReadinessGauge({ score, label, company, role }: {
  score: number;
  label: string;
  company: string;
  role: string;
}) {
  const animScore = useRef(new Animated.Value(0)).current;
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    const listener = animScore.addListener(({ value }) => setDisplayScore(Math.round(value)));
    Animated.timing(animScore, {
      toValue: score,
      duration: 1500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    return () => animScore.removeListener(listener);
  }, [score]);

  const getColor = (s: number) => {
    if (s >= 70) return '#10B981';
    if (s >= 40) return '#F59E0B';
    return '#EF4444';
  };

  const color = getColor(score);

  return (
    <View style={gaugeStyles.container}>
      <View style={[gaugeStyles.circle, { borderColor: color }]}>
        <Text style={[gaugeStyles.scoreText, { color }]}>{displayScore}%</Text>
        <Text style={gaugeStyles.readyLabel}>{label}</Text>
      </View>
      <Text style={gaugeStyles.description}>
        You are <Text style={{ fontWeight: '900', color }}>{displayScore}%</Text> ready for{' '}
        <Text style={{ fontWeight: '800' }}>{company}</Text>{' '}
        <Text style={{ fontWeight: '600' }}>{role}</Text>
      </Text>
      <Text style={gaugeStyles.subLabel}>Here's exactly what to fix:</Text>
    </View>
  );
}

const gaugeStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  circle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  scoreText: {
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: -2,
  },
  readyLabel: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textSecondary,
    fontWeight: '700',
    marginTop: 2,
  },
  description: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.textPrimary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.xs,
    paddingHorizontal: SPACING.md,
  },
  subLabel: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
});

// ─── Gap Level Styling ────────────────────────────────────────────────────────

function getGapStyle(level: string) {
  switch (level) {
    case 'missing':
      return { bg: '#FEE2E2', text: '#DC2626', emoji: '🔴' };
    case 'partial':
      return { bg: '#FEF3C7', text: '#D97706', emoji: '🟡' };
    case 'match':
      return { bg: '#D1FAE5', text: '#059669', emoji: '🟢' };
    default:
      return { bg: '#F1F5F9', text: '#64748B', emoji: '⚪' };
  }
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function GapAnalysisScreen({ navigation, route }: any) {
  const { companyName = 'Company', jobTitle = 'Role', jobDescription = '' } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<GapAnalysisResponse | null>(null);
  const [showOptimized, setShowOptimized] = useState(false);

  useEffect(() => {
    fetchGapAnalysis();
  }, []);

  const fetchGapAnalysis = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await post<GapAnalysisResponse>('/api/agent/gap-analysis', {
        company_name: companyName,
        job_title: jobTitle,
        job_description: jobDescription,
      });
      setData(response);
    } catch (err: any) {
      setError(err.message || 'Failed to perform gap analysis');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingGlow} />
        <ActivityIndicator size={64} color="#2563EB" style={{ marginBottom: SPACING.xl }} />
        <Text style={styles.loadingTitle}>Analysing your gap...</Text>
        <Text style={styles.loadingSubtitle}>
          Comparing your resume against {companyName}'s requirements for {jobTitle}
        </Text>
        <View style={styles.loadingSteps}>
          <Text style={styles.loadingStep}>⟳ Analysing job requirements...</Text>
          <Text style={styles.loadingStep}>⟳ Comparing with your skills...</Text>
          <Text style={styles.loadingStep}>⟳ Building your roadmap...</Text>
        </View>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorEmoji}>😵</Text>
        <Text style={styles.errorTitle}>Analysis Failed</Text>
        <Text style={styles.errorText}>{error || 'Something went wrong'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchGapAnalysis}>
          <Text style={styles.retryBtnText}>🔄 Try Again</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const gap = data.gap_report;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackBtn}>
          <Text style={styles.headerBackText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitles}>
          <Text style={styles.headerTitle}>Gap Analysis</Text>
          <Text style={styles.headerSubtitle}>{companyName} · {jobTitle}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── SECTION: Readiness Gauge ──────────────────────────── */}
        <ReadinessGauge
          score={gap.readiness_score}
          label={gap.readiness_label}
          company={companyName}
          role={jobTitle}
        />

        {/* ── SECTION A: Skills Gap ───────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚔️ Skills Gap</Text>
          <View style={styles.skillsTable}>
            {/* Header Row */}
            <View style={styles.skillsHeaderRow}>
              <Text style={[styles.skillsCellH, { flex: 2 }]}>Skill</Text>
              <Text style={[styles.skillsCellH, { flex: 1.5 }]}>Needs</Text>
              <Text style={[styles.skillsCellH, { flex: 1.5 }]}>You Have</Text>
              <Text style={[styles.skillsCellH, { flex: 1 }]}>Gap</Text>
            </View>
            {/* Data Rows */}
            {gap.skills_comparison.map((s, i) => {
              const gs = getGapStyle(s.gap_level);
              return (
                <View key={i} style={[styles.skillsRow, { backgroundColor: i % 2 === 0 ? COLORS.surface : COLORS.background }]}>
                  <Text style={[styles.skillsCell, { flex: 2, fontWeight: '700' }]}>{s.skill}</Text>
                  <Text style={[styles.skillsCell, { flex: 1.5 }]}>{s.company_needs}</Text>
                  <Text style={[styles.skillsCell, { flex: 1.5 }]}>{s.candidate_has}</Text>
                  <View style={[styles.gapBadge, { backgroundColor: gs.bg, flex: 1 }]}>
                    <Text style={[styles.gapBadgeText, { color: gs.text }]}>
                      {gs.emoji} {s.gap_level === 'missing' ? 'Missing' : s.gap_level === 'partial' ? 'Partial' : 'Match'}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── SECTION B: Experience Gap ──────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Experience Gap</Text>
          <View style={styles.expGapCard}>
            <View style={styles.expBarsRow}>
              <View style={styles.expBarBlock}>
                <Text style={styles.expBarLabel}>Required</Text>
                <View style={styles.expBarTrack}>
                  <View style={[styles.expBarFill, styles.expBarRequired, { width: `${Math.min(100, (gap.experience_gap.required_years / Math.max(gap.experience_gap.required_years, gap.experience_gap.candidate_years)) * 100)}%` as any }]} />
                </View>
                <Text style={styles.expBarValue}>{gap.experience_gap.required_years} yrs</Text>
              </View>
              <View style={styles.expBarBlock}>
                <Text style={styles.expBarLabel}>You Have</Text>
                <View style={styles.expBarTrack}>
                  <View style={[styles.expBarFill, styles.expBarCandidate, { width: `${Math.min(100, (gap.experience_gap.candidate_years / Math.max(gap.experience_gap.required_years, gap.experience_gap.candidate_years)) * 100)}%` as any }]} />
                </View>
                <Text style={styles.expBarValue}>{gap.experience_gap.candidate_years} yrs</Text>
              </View>
            </View>
            <Text style={styles.expVerdict}>{gap.experience_gap.verdict}</Text>
            {gap.experience_gap.compensation_tips.map((tip, i) => (
              <Text key={i} style={styles.expTip}>💡 {tip}</Text>
            ))}
          </View>
        </View>

        {/* ── SECTION C: Keywords Gap ───────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔤 Language & Keywords Gap</Text>

          <Text style={styles.kwLabel}>Keywords in JD not in your resume:</Text>
          <View style={styles.kwRow}>
            {(data.keywords_missing || []).slice(0, 8).map((kw, i) => (
              <View key={i} style={styles.kwPillRed}>
                <Text style={styles.kwPillRedText}>{kw}</Text>
              </View>
            ))}
            {gap.language_gaps.map((kw, i) => (
              <View key={`lg-${i}`} style={styles.kwPillRed}>
                <Text style={styles.kwPillRedText}>{kw}</Text>
              </View>
            ))}
          </View>

          <Text style={[styles.kwLabel, { marginTop: SPACING.md }]}>Your keywords that match JD:</Text>
          <View style={styles.kwRow}>
            {(data.keywords_present || []).slice(0, 8).map((kw, i) => (
              <View key={i} style={styles.kwPillGreen}>
                <Text style={styles.kwPillGreenText}>{kw}</Text>
              </View>
            ))}
            {gap.language_matches.map((kw, i) => (
              <View key={`lm-${i}`} style={styles.kwPillGreen}>
                <Text style={styles.kwPillGreenText}>{kw}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── SECTION D: Optimized Resume ──────────────────── */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.collapsibleHeader}
            onPress={() => setShowOptimized(!showOptimized)}
          >
            <Text style={styles.sectionTitle}>📄 Your Optimized Resume</Text>
            <Text style={styles.expandIcon}>{showOptimized ? '▼' : '▶'}</Text>
          </TouchableOpacity>

          {showOptimized && (
            data.optimized_resume ? (
              <View style={styles.optimizedContent}>
                {data.optimized_resume.summary && (
                  <View style={styles.optimizedBlock}>
                    <Text style={styles.optimizedLabel}>Summary</Text>
                    <Text style={styles.optimizedText}>{data.optimized_resume.summary}</Text>
                  </View>
                )}
                {data.optimized_resume.experience?.map((exp: any, i: number) => (
                  <View key={i} style={styles.optimizedBlock}>
                    <Text style={styles.optimizedExpTitle}>{exp.title} at {exp.company}</Text>
                    <Text style={styles.optimizedExpDates}>{exp.dates}</Text>
                    {exp.bullets?.map((b: string, j: number) => (
                      <Text key={j} style={styles.optimizedBullet}>• {b}</Text>
                    ))}
                  </View>
                ))}
                {data.optimized_resume.keywords_added?.length > 0 && (
                  <View style={styles.optimizedBlock}>
                    <Text style={styles.optimizedLabel}>Keywords Added</Text>
                    <View style={styles.kwRow}>
                      {data.optimized_resume.keywords_added.map((kw: string, i: number) => (
                        <View key={i} style={styles.kwPillGreen}>
                          <Text style={styles.kwPillGreenText}>+ {kw}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.skeletonBlock}>
                <ActivityIndicator size="small" color="#2563EB" />
                <Text style={styles.skeletonText}>Generating your tailored resume...</Text>
              </View>
            )
          )}
        </View>

        {/* ── SECTION E: 30-Day Roadmap ────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🗓️ Your 30-Day Readiness Roadmap</Text>
          {(['week_1', 'week_2', 'week_3', 'week_4'] as const).map((week, i) => {
            const weekItems = gap.roadmap[week] || [];
            if (weekItems.length === 0) return null;
            return (
              <View key={week} style={styles.roadmapWeek}>
                <View style={styles.roadmapWeekHeader}>
                  <View style={styles.roadmapDot} />
                  <Text style={styles.roadmapWeekTitle}>Week {i + 1}</Text>
                </View>
                {weekItems.map((item, j) => (
                  <Text key={j} style={styles.roadmapItem}>• {item}</Text>
                ))}
              </View>
            );
          })}
        </View>

        {/* ── Honest Verdict ───────────────────────────────── */}
        <View style={styles.verdictCard}>
          <Text style={styles.verdictTitle}>💬 Honest Verdict</Text>
          <Text style={styles.verdictText}>{gap.honest_verdict}</Text>
        </View>

        {/* ── Bottom CTA ───────────────────────────────────── */}
        <TouchableOpacity
          style={styles.interviewBtn}
          onPress={() => navigation.navigate('Interview', { company_name: companyName, job_title: jobTitle })}
        >
          <Text style={styles.interviewBtnText}>🎤  Start AI Mock Interview for {companyName}</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  // Loading
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  loadingGlow: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
  },
  loadingTitle: {
    fontSize: TYPOGRAPHY.fontSizes.xxl,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  loadingSubtitle: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
    marginBottom: SPACING.xl,
  },
  loadingSteps: {
    gap: SPACING.sm,
  },
  loadingStep: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
  },
  // Error
  errorContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorEmoji: {
    fontSize: 64,
    marginBottom: SPACING.lg,
  },
  errorTitle: {
    fontSize: TYPOGRAPHY.fontSizes.xl,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },
  retryBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.md,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: TYPOGRAPHY.fontSizes.md,
  },
  backBtn: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
  },
  backBtnText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
    fontSize: TYPOGRAPHY.fontSizes.md,
  },
  // Header
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
  headerBackBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.background,
    marginRight: SPACING.md,
  },
  headerBackText: {
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
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 60,
  },
  // Sections
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    letterSpacing: -0.3,
  },
  // Skills Table
  skillsTable: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  skillsHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  skillsCellH: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  skillsRow: {
    flexDirection: 'row',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  skillsCell: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textPrimary,
  },
  gapBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
  },
  gapBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  // Experience Gap
  expGapCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  expBarsRow: {
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  expBarBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  expBarLabel: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: '700',
    color: COLORS.textSecondary,
    width: 80,
  },
  expBarTrack: {
    flex: 1,
    height: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  expBarFill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },
  expBarRequired: {
    backgroundColor: '#6366F1',
  },
  expBarCandidate: {
    backgroundColor: '#10B981',
  },
  expBarValue: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: '800',
    color: COLORS.textPrimary,
    width: 40,
    textAlign: 'right',
  },
  expVerdict: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.textPrimary,
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: SPACING.sm,
  },
  expTip: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginTop: SPACING.xs,
  },
  // Keywords
  kwLabel: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  kwRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  kwPillRed: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  kwPillRedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  kwPillGreen: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  kwPillGreenText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  // Optimized Resume
  collapsibleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expandIcon: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  optimizedContent: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: SPACING.sm,
  },
  optimizedBlock: {
    marginBottom: SPACING.lg,
  },
  optimizedLabel: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: '800',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: SPACING.sm,
  },
  optimizedText: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
  optimizedExpTitle: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    fontWeight: '700',
    color: '#2563EB',
    marginBottom: 2,
  },
  optimizedExpDates: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  optimizedBullet: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textPrimary,
    lineHeight: 20,
    marginBottom: 4,
    paddingLeft: SPACING.sm,
  },
  skeletonBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
    gap: SPACING.md,
    marginTop: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  skeletonText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  // Roadmap
  roadmapWeek: {
    marginBottom: SPACING.lg,
    paddingLeft: SPACING.md,
    borderLeftWidth: 2,
    borderLeftColor: '#2563EB',
  },
  roadmapWeekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    marginLeft: -SPACING.md - 6,
  },
  roadmapDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2563EB',
    marginRight: SPACING.sm,
  },
  roadmapWeekTitle: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    fontWeight: '800',
    color: '#2563EB',
  },
  roadmapItem: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textPrimary,
    lineHeight: 22,
    marginBottom: SPACING.xs,
  },
  // Verdict
  verdictCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    marginBottom: SPACING.xl,
  },
  verdictTitle: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    fontWeight: '800',
    color: '#1E40AF',
    marginBottom: SPACING.sm,
  },
  verdictText: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: '#1E40AF',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  // Interview CTA
  interviewBtn: {
    backgroundColor: '#7C3AED',
    paddingVertical: 18,
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  interviewBtnText: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
});

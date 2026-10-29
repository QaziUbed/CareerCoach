import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, useWindowDimensions, Platform, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';
import { FlashList } from '@shopify/flash-list';
import { post } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../../utils/theme';
import { Button, Card, ScoreCircle } from '../../components/ui';

interface Question {
  question: string;
  category: 'behavioral' | 'technical' | 'situational' | 'company';
  why_asked: string;
  answer_framework: string;
  sample_talking_points: string[];
  practiced?: boolean;
  score?: number;
}

interface InterviewData {
  questions: Question[];
  optimization_id: string;
}

type FilterType = 'all' | 'behavioral' | 'technical' | 'situational' | 'company';

export default function InterviewScreen({ route, navigation }: any) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  
  const { optimization_id, job_title = 'this position', company_name = 'the company' } = route.params || {};
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [showPracticeTooltip, setShowPracticeTooltip] = useState(false);

  useEffect(() => {
    loadQuestions();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        setError('Taking too long. Please try again.');
        setLoading(false);
      }
    }, 15000);
    return () => clearTimeout(timeout);
  }, [loading]);

  const checkFirstTimeUser = async (hasQuestions: boolean) => {
    try {
      const hasSeenTooltip = await AsyncStorage.getItem('hasSeenPracticeTooltip');
      if (!hasSeenTooltip && hasQuestions) {
        setShowPracticeTooltip(true);
      }
    } catch (error) {
      console.error('Error checking tooltip status:', error);
    }
  };

  const dismissTooltip = async () => {
    try {
      await AsyncStorage.setItem('hasSeenPracticeTooltip', 'true');
      setShowPracticeTooltip(false);
    } catch (error) {
      console.error('Error saving tooltip status:', error);
    }
  };

  const loadQuestions = async () => {
    if (!optimization_id) {
      setError('Missing interview context. Please go back and try again.');
      return;
    }
    try {
      setLoading(true);
      const response = await post<InterviewData>('/api/interview/questions', {
        optimization_id,
      });
      setQuestions(response.questions);
      setLoading(false);
      checkFirstTimeUser(response.questions.length > 0);
    } catch (err: any) {
      setError(err.message || 'Failed to load interview questions');
      setLoading(false);
    }
  };

  const CATEGORY_COLORS = {
    behavioral: COLORS.primary,
    technical: '#10B981', // Emerald
    situational: '#F59E0B', // Amber
    company: '#8B5CF6', // Violet
  };

  const filteredQuestions = questions.filter((q) => {
    if (activeFilter === 'all') return true;
    return q.category === activeFilter;
  });

  const practicedCount = questions.filter((q) => q.practiced).length;
  const averageScore = questions.reduce((acc, q) => acc + (q.score || 0), 0) / (practicedCount || 1);

  const handlePractice = (question: Question, index: number) => {
    dismissTooltip();
    navigation.navigate('Practice', {
      optimization_id,
      question: question.question,
      question_index: index,
      category: question.category,
      answer_framework: question.answer_framework,
      sample_talking_points: question.sample_talking_points,
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Tailoring your interview prep...</Text>
      </View>
    );
  }

  const renderHeader = () => (
    <View style={[styles.header, isDesktop && styles.headerDesktop]}>
       <View style={isDesktop ? styles.headerTextColumn : null}>
          <Text style={styles.headerSubtitle}>Interview Prep for</Text>
          <Text style={styles.headerTitle}>{job_title}</Text>
          <Text style={styles.companyName}>at {company_name}</Text>
       </View>

       <View style={[styles.statsCardContainer, isDesktop && styles.headerStatsColumn]}>
          <Card style={styles.statsCard}>
             <View style={styles.statsRow}>
                <View style={styles.statItem}>
                   <Text style={styles.statValue}>{practicedCount}/{questions.length}</Text>
                   <Text style={styles.statLabel}>Practiced</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.statItem}>
                   <ScoreCircle score={Math.round(averageScore * 10)} size={50} showLabel={false} />
                   <Text style={styles.statLabel}>Avg Score</Text>
                </View>
             </View>
             <View style={styles.progressWrapper}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${(practicedCount / questions.length) * 100}%` }]} />
                </View>
             </View>
          </Card>
       </View>
    </View>
  );

  const renderQuestion = ({ item, index }: { item: Question; index: number }) => {
    const isExpanded = expandedIndex === index;
    const catColor = CATEGORY_COLORS[item.category] || COLORS.primary;

    return (
      <View style={[styles.questionWrapper, isDesktop && { width: '48%', marginRight: '2%' }]}>
        <Card style={StyleSheet.flatten([styles.questionCard, item.practiced && styles.practicedCard])}>
          <View style={styles.cardHeader}>
            <View style={[styles.categoryBadge, { backgroundColor: catColor + '15' }]}>
              <Text style={[styles.categoryText, { color: catColor }]}>{item.category.toUpperCase()}</Text>
            </View>
            {item.practiced && (
               <View style={styles.scoreBadge}>
                  <Text style={styles.scoreText}>{item.score}/10</Text>
               </View>
            )}
          </View>

          <Text style={styles.questionText}>{item.question}</Text>
          <Text style={styles.whyAsked} numberOfLines={isExpanded ? undefined : 2}>
            {item.why_asked}
          </Text>

          {isExpanded && (
            <View style={styles.expandedContent}>
               <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Answer Strategy</Text>
                  <Text style={styles.sectionText}>{item.answer_framework}</Text>
               </View>
               <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Key Talking Points</Text>
                  {item.sample_talking_points.map((pt, i) => (
                    <Text key={i} style={styles.talkingPoint}>• {pt}</Text>
                  ))}
               </View>
            </View>
          )}

          <View style={styles.cardActions}>
             <TouchableOpacity onPress={() => setExpandedIndex(isExpanded ? null : index)} style={styles.expandToggle}>
                <Text style={styles.expandToggleText}>{isExpanded ? 'Hide Strategy' : 'View Strategy'}</Text>
             </TouchableOpacity>
             <Button
                title={item.practiced ? 'Practice Again' : 'Practice Now'}
                onPress={() => handlePractice(item, index)}
                size="small"
                variant={item.practiced ? 'outline' : 'primary'}
             />
          </View>
        </Card>
        
        {index === 0 && showPracticeTooltip && (
          <View style={styles.tooltip}>
            <Text style={styles.tooltipText}>👆 Record your answer to get instant AI feedback!</Text>
            <TouchableOpacity onPress={dismissTooltip} style={styles.tooltipClose}>
              <Text style={styles.tooltipCloseText}>Got it</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderHeader()}
      
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {['all', 'behavioral', 'technical', 'situational', 'company'].map((f) => (
             <TouchableOpacity 
               key={f} 
               style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
               onPress={() => setActiveFilter(f as FilterType)}
             >
               <Text style={[styles.filterChipText, activeFilter === f && styles.filterChipTextActive]}>
                 {f === 'all' ? `All (${questions.length})` : f.charAt(0).toUpperCase() + f.slice(1)}
               </Text>
             </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={[styles.listWrapper, isDesktop && styles.listWrapperDesktop]}>
        {(() => {
          const FL = FlashList as any;
          return (
            <FL
              data={filteredQuestions}
              renderItem={renderQuestion}
              estimatedItemSize={250}
              numColumns={isDesktop ? 2 : 1}
              key={isDesktop ? 'desktop' : 'mobile'} 
              keyExtractor={(item: any, index: number) => `${item.category}-${index}`}
              contentContainerStyle={styles.listContent}
            />
          );
        })()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  header: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xxxl,
    paddingVertical: SPACING.xl,
  },
  headerTextColumn: {
    flex: 1,
  },
  headerStatsColumn: {
    width: 350,
  },
  headerSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: -1,
  },
  companyName: {
    fontSize: 18,
    color: COLORS.accent,
    fontWeight: '700',
  },
  statsCardContainer: {
    marginTop: SPACING.md,
  },
  statsCard: {
    padding: SPACING.md,
    backgroundColor: COLORS.background,
    borderWidth: 0,
    ...SHADOWS.small,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: SPACING.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.border,
  },
  progressWrapper: {
    paddingHorizontal: SPACING.xs,
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981', // Emerald
    borderRadius: RADIUS.full,
  },
  filterBar: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1, // Corrected from semicolon
    borderBottomColor: COLORS.border,
  },
  filterScroll: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  filterChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  filterChipTextActive: {
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
  questionWrapper: {
    marginBottom: SPACING.md,
  },
  questionCard: {
    padding: SPACING.lg,
  },
  practicedCard: {
    borderColor: '#DCFCE7', // Emerald 100
    borderWidth: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  scoreBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  scoreText: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '800',
  },
  questionText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    lineHeight: 24,
    marginBottom: SPACING.xs,
  },
  whyAsked: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    lineHeight: 18,
    marginBottom: SPACING.md,
  },
  expandedContent: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.md,
  },
  section: {
    gap: 4,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  talkingPoint: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  expandToggle: {
    paddingVertical: 4,
  },
  expandToggleText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  tooltip: {
    backgroundColor: COLORS.accent,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginTop: SPACING.sm,
    ...SHADOWS.medium,
  },
  tooltipText: {
    color: '#FFFFFF',
    fontWeight: '500',
    marginBottom: SPACING.xs,
  },
  tooltipClose: {
    alignSelf: 'flex-end',
  },
  tooltipCloseText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
});

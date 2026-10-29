import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, useWindowDimensions, Platform, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';
import { FlashList } from '@shopify/flash-list';
import { post } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';
import { Button } from '../../components/ui';

interface Question {
  question: string;
  category: 'behavioral' | 'technical' | 'situational' | 'company';
  why_asked: string;
  answer_framework: string;
  sample_talking_points: string[];
  practiced?: boolean;
  score?: number;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  duration?: number;
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
  const [isDemo, setIsDemo] = useState(false);

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
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const response = await post<InterviewData>('/api/interview/questions', {
        optimization_id,
      });
      // Add mock data for missing fields simply to match visual design
      const enrichedQuestions = response.questions.map((q, idx) => ({
        ...q,
        difficulty: idx % 2 === 0 ? 'Easy' : 'Medium' as any,
        duration: idx % 2 === 0 ? 2 : 3,
      }));
      setQuestions(enrichedQuestions);
      setLoading(false);
      checkFirstTimeUser(response.questions.length > 0);
    } catch (err: any) {
      setError(err.message || 'Failed to load interview questions');
      setLoading(false);
    }
  };

  const CATEGORY_COLORS: Record<string, { bg: string, text: string }> = {
    behavioral: { bg: '#E0E7FF', text: '#6366F1' }, // Indigo
    technical: { bg: '#DBEAFE', text: '#3B82F6' }, // Blue
    situational: { bg: '#FEF3C7', text: '#D97706' }, // Amber
    company: { bg: '#F3E8FF', text: '#9333EA' }, // Purple
  };

  const handleTryDemo = () => {
    setIsDemo(true);
    const demoQuestions: Question[] = [
      {
        question: "Tell me about yourself",
        category: 'behavioral',
        why_asked: "To understand your background and communication style.",
        answer_framework: "Use the Present-Past-Future framework.",
        sample_talking_points: ["Your current role", "Key past achievements", "Future aspirations at this company"],
        difficulty: 'Easy',
        duration: 2,
      },
      {
        question: "What is your greatest strength?",
        category: 'technical',
        why_asked: "Checks if your core competencies aligns with the role.",
        answer_framework: "State strength, provide evidence, and connect to role.",
        sample_talking_points: ["Specific technical skill", "Soft skill like problem solving", "Real world example of impact"],
        difficulty: 'Medium',
        duration: 3,
      },
      {
        question: "Why do you want this role?",
        category: 'company',
        why_asked: "To gauge your interest and cultural fit.",
        answer_framework: "The Why Them, Why You, Why Now approach.",
        sample_talking_points: ["Company mission", "Specific challenge the role solves", "Growth opportunities"],
        difficulty: 'Hard',
        duration: 4,
      }
    ];
    setQuestions(demoQuestions);
  };

  const filteredQuestions = questions.filter((q) => {
    if (activeFilter === 'all') return true;
    return q.category === activeFilter;
  });

  const practicedCount = questions.filter((q) => q.practiced).length;
  const averageScore = questions.reduce((acc, q) => acc + (q.score || 0), 0) / (practicedCount || 1);
  const bestScore = questions.reduce((max, q) => Math.max(max, q.score || 0), 0);

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

  const renderHeader = () => {
    if (!optimization_id && !isDemo) return null;

    return (
      <View style={[styles.header, isDesktop && styles.headerDesktop]}>
        <Text style={styles.headerSubtitle}>INTERVIEW PREP FOR</Text>
        <Text style={styles.headerTitle}>{isDemo ? 'Sample position' : job_title}</Text>
        <Text style={styles.companyName}>at {isDemo ? 'CareerCoach Demo' : company_name}</Text>
          
        {questions.length > 0 && (
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>
                {practicedCount}<Text style={{fontSize: 14, color: '#9CA3AF'}}>/{questions.length}</Text>
              </Text>
              <Text style={styles.statLabel}>Practiced</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, {color: '#EF4444'}]}>
                {averageScore > 0 ? averageScore : 0}
              </Text>
              <Text style={styles.statLabel}>Avg score</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, {color: '#10B981'}]}>
                {bestScore > 0 ? bestScore : '—'}
              </Text>
              <Text style={styles.statLabel}>Best score</Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <Text style={styles.emptyStateTitle}>No job application selected</Text>
      <Text style={styles.emptyStateSubtext}>Optimize a resume first to get personalized interview questions</Text>
      
      <Button 
        title="Go to Resume" 
        onPress={() => navigation.navigate('Resume')}
        style={styles.emptyStateButton}
        size="large"
      />
      
      <TouchableOpacity onPress={handleTryDemo} style={styles.demoLink}>
        <Text style={styles.demoLinkText}>Try Demo Questions</Text>
      </TouchableOpacity>
    </View>
  );

  const renderQuestion = ({ item, index }: { item: Question; index: number }) => {
    const isExpanded = expandedIndex === index;
    const catColors = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.behavioral;

    const diffColor = item.difficulty === 'Easy' ? '#10B981' : item.difficulty === 'Medium' ? '#F59E0B' : '#EF4444';

    return (
      <View style={[styles.questionWrapper, isDesktop && { width: '48%', marginRight: '2%' }]}>
        <View style={styles.questionCard}>
          <View style={[styles.categoryBadge, { backgroundColor: catColors.bg }]}>
            <Text style={[styles.categoryText, { color: catColors.text }]}>
              {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
            </Text>
          </View>

          <Text style={styles.questionText}>{item.question}</Text>
          <Text style={styles.whyAsked} numberOfLines={isExpanded ? undefined : 2}>
            {item.why_asked}
          </Text>

          {/* Difficulty row */}
          <View style={styles.difficultyRow}>
            <View style={[styles.diffDot, { backgroundColor: diffColor }]} />
            <Text style={styles.diffText}>{item.difficulty} - {item.duration} min</Text>
          </View>

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
             <TouchableOpacity 
                onPress={() => setExpandedIndex(isExpanded ? null : index)} 
                style={styles.viewStratBtn}
             >
                <Text style={styles.viewStratText}>{isExpanded ? 'Hide strategy' : 'View strategy'}</Text>
             </TouchableOpacity>
             
             {item.practiced ? (
                <View style={styles.practicedBtnWrapper}>
                   <Text style={{color: '#059669', fontWeight: 'bold'}}>Practiced: {item.score}/10</Text>
                </View>
             ) : (
                <TouchableOpacity
                   style={styles.practiceInlineBtn}
                   onPress={() => handlePractice(item, index)}
                >
                   <Text style={styles.practiceInlineText}>Practice now</Text>
                </TouchableOpacity>
             )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderHeader()}
      
      {questions.length === 0 && !loading ? (
        renderEmptyState()
      ) : (
        <View style={styles.whiteSection}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.filterBar} // Kept the generic styles
            style={{flexGrow: 0}}
          >
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212', // Dark background for the very top
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  loadingText: {
    marginTop: SPACING.md,
    color: '#D1D5DB',
    fontWeight: '600',
  },
  header: {
    padding: SPACING.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    backgroundColor: '#121212',
  },
  headerDesktop: {
    paddingHorizontal: SPACING.xxxl,
    paddingVertical: SPACING.xl,
  },
  headerSubtitle: {
    color: '#6B7280',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  companyName: {
    fontSize: 14,
    color: '#6366F1', // Indigo
    fontWeight: '600',
    marginBottom: SPACING.lg,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: SPACING.xs,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  whiteSection: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: SPACING.sm,
    overflow: 'hidden',
  },
  filterBar: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  filterChipActive: {
    backgroundColor: '#6366F1', // Indigo
    borderColor: '#6366F1',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
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
    paddingHorizontal: SPACING.lg,
    paddingBottom: 100,
  },
  questionWrapper: {
    marginBottom: SPACING.lg,
  },
  questionCard: {
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: SPACING.sm,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '800',
  },
  questionText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
    marginBottom: SPACING.xs,
    lineHeight: 22,
  },
  whyAsked: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  difficultyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  diffDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  diffText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  cardActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  viewStratBtn: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewStratText: {
    color: '#4B5563',
    fontWeight: '600',
    fontSize: 13,
  },
  practiceInlineBtn: {
    backgroundColor: '#6366F1',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 10,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  practiceInlineText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  practicedBtnWrapper: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 10,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandedContent: {
    backgroundColor: '#F9FAFB',
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.md,
    gap: SPACING.md,
  },
  section: {
    gap: 4,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#111827',
    textTransform: 'uppercase',
  },
  sectionText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  talkingPoint: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },
  emptyStateButton: {
    paddingHorizontal: SPACING.xxl,
    marginBottom: SPACING.lg,
  },
  demoLink: {
    padding: SPACING.md,
  },
  demoLinkText: {
    color: '#6366F1',
    fontWeight: '700',
    fontSize: 16,
  },
});

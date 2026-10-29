import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Animated, TouchableOpacity, Share, Alert, Platform } from 'react-native';
import { Text, Card, Button, ActivityIndicator, TextInput as PaperTextInput } from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { get, post } from '../../services/api';
import usePlanLimits from '../../hooks/usePlanLimits';
import { SHADOWS } from '../../utils/theme';

interface OptimizationData {
  optimization_id: string;
  before_ats_score: number;
  after_ats_score: number;
  keywords_added: string[];
  optimized: {
    summary?: string;
    experience?: Array<{
      company: string;
      title: string;
      dates: string;
      bullets: string[];
    }>;
    skills?: string[];
    improvements_summary?: string;
  };
  score_improvement: number;
}

export default function OptimizationResultScreen({ route, navigation }: any) {
  const { optimizationId, companyName = 'the company', jobTitle = 'this position' } = route.params || {};
  const limits = usePlanLimits();
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<OptimizationData | null>(null);
  const [error, setError] = useState('');
  
  const [activeTab, setActiveTab] = useState<'resume' | 'cover' | 'download'>('resume');
  const [coverLetter, setCoverLetter] = useState('');
  const [coverLetterLoading, setCoverLetterLoading] = useState(false);
  const [coverLetterLoaded, setCoverLetterLoaded] = useState(false);
  
  const scoreAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadOptimizationData();
  }, []);

  const loadOptimizationData = async () => {
    try {
      setLoading(true);
      const result = await get<OptimizationData>(`/api/resume/optimization/${optimizationId}`);
      setData(result);
      
      // Start score animation
      Animated.parallel([
        Animated.timing(scoreAnim, {
          toValue: result.after_ats_score,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start(() => {
        // Haptic feedback when animation completes
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      });
      
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to load optimization results');
      setLoading(false);
    }
  };

  const loadCoverLetter = async () => {
    if (coverLetterLoaded || !data) return;
    
    // Check if user has access to cover letter generation
    if (!limits.canGenerateCoverLetter) {
      Alert.alert(
        'Upgrade Required',
        'Cover letter generation is available on Pro and Career+ plans.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Upgrade', 
            onPress: () => navigation.navigate('Upgrade')
          },
        ]
      );
      return;
    }
    
    try {
      setCoverLetterLoading(true);
      const response = await post<{ cover_letter: string }>('/api/cover-letter/generate', {
        optimization_id: optimizationId,
      });
      setCoverLetter(response.cover_letter);
      setCoverLetterLoaded(true);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to generate cover letter');
    } finally {
      setCoverLetterLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'cover' && !coverLetterLoaded) {
      loadCoverLetter();
    }
  }, [activeTab]);

  const handleCopyToClipboard = async () => {
    await Clipboard.setStringAsync(coverLetter);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Copied', 'Cover letter copied to clipboard');
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: coverLetter,
      });
    } catch (err: any) {
      Alert.alert('Error', 'Failed to share cover letter');
    }
  };

  const handleDownloadResume = async () => {
    Alert.alert('Download', 'Resume PDF download will be implemented with file system');
  };

  const handleDownloadCoverLetter = async () => {
    Alert.alert('Download', 'Cover letter PDF download will be implemented with file system');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading results...</Text>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'No data available'}</Text>
        <Button mode="contained" onPress={() => navigation.goBack()} buttonColor="#2563EB">
          Go Back
        </Button>
      </View>
    );
  }

  const animatedScore = scoreAnim.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 100],
    extrapolate: 'clamp',
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* SECTION 1 - ATS Score Reveal */}
      <View style={styles.scoreSection}>
        <Text variant="titleLarge" style={styles.sectionTitle}>ATS Score Analysis</Text>
        
        <View style={styles.scoresContainer}>
          <View style={styles.scoreCard}>
            <View style={[styles.scoreBadge, styles.scoreBadgeBefore]}>
              <Text style={styles.scoreLabel}>BEFORE</Text>
              <Text style={styles.scoreValue}>{data.before_ats_score}</Text>
            </View>
          </View>

          <View style={styles.scoreCard}>
            <Animated.View style={[styles.scoreBadge, styles.scoreBadgeAfter, { opacity: fadeAnim }]}>
              <Text style={styles.scoreLabel}>AFTER</Text>
              <Animated.Text style={styles.scoreValue}>
                {animatedScore.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0', '100'],
                }).toString().split('.')[0]}
              </Animated.Text>
            </Animated.View>
          </View>
        </View>

        <Animated.View style={[styles.improvementContainer, { opacity: fadeAnim }]}>
          <Text style={styles.improvementText}>
            +{data.score_improvement} points improvement
          </Text>
        </Animated.View>

        {data.keywords_added && data.keywords_added.length > 0 && (
          <View style={styles.keywordsContainer}>
            <Text variant="labelMedium" style={styles.keywordsLabel}>Keywords Added:</Text>
            <View style={styles.keywordsList}>
              {data.keywords_added.map((keyword, index) => (
                <View key={index} style={styles.keywordBadge}>
                  <Text style={styles.keywordText}>{keyword}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* SECTION 2 - Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'resume' && styles.tabActive]}
          onPress={() => setActiveTab('resume')}
        >
          <Text style={[styles.tabText, activeTab === 'resume' && styles.tabTextActive]}>
            Resume
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'cover' && styles.tabActive]}
          onPress={() => setActiveTab('cover')}
        >
          <Text style={[styles.tabText, activeTab === 'cover' && styles.tabTextActive]}>
            Cover Letter
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'download' && styles.tabActive]}
          onPress={() => setActiveTab('download')}
        >
          <Text style={[styles.tabText, activeTab === 'download' && styles.tabTextActive]}>
            Download
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'resume' && (
        <View style={styles.tabContent}>
          {data.optimized.improvements_summary && (
            <Card style={styles.infoCard}>
              <Card.Content>
                <Text variant="labelMedium" style={styles.infoLabel}>💡 Improvements Made:</Text>
                <Text style={styles.infoText}>{data.optimized.improvements_summary}</Text>
              </Card.Content>
            </Card>
          )}

          {data.optimized.summary && (
            <Card style={styles.card}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.cardTitle}>Summary</Text>
                <Text style={styles.cardText}>{data.optimized.summary}</Text>
              </Card.Content>
            </Card>
          )}

          {data.optimized.experience && data.optimized.experience.length > 0 && (
            <Card style={styles.card}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.cardTitle}>Experience</Text>
                {data.optimized.experience.map((exp, index) => (
                  <View key={index} style={styles.experienceItem}>
                    <Text style={styles.expCompany}>{exp.company}</Text>
                    <Text style={styles.expTitle}>{exp.title}</Text>
                    <Text style={styles.expDates}>{exp.dates}</Text>
                    {exp.bullets && exp.bullets.map((bullet, bIndex) => (
                      <Text key={bIndex} style={styles.expBullet}>• {bullet}</Text>
                    ))}
                  </View>
                ))}
              </Card.Content>
            </Card>
          )}

          {data.optimized.skills && data.optimized.skills.length > 0 && (
            <Card style={styles.card}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.cardTitle}>Skills</Text>
                <View style={styles.skillsContainer}>
                  {data.optimized.skills.map((skill, index) => (
                    <View key={index} style={styles.skillBadge}>
                      <Text style={styles.skillText}>{skill}</Text>
                    </View>
                  ))}
                </View>
              </Card.Content>
            </Card>
          )}
        </View>
      )}

      {activeTab === 'cover' && (
        <View style={styles.tabContent}>
          {coverLetterLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2563EB" />
              <Text style={styles.loadingText}>Generating cover letter...</Text>
            </View>
          ) : (
            <>
              <Card style={styles.card}>
                <Card.Content>
                  <PaperTextInput
                    value={coverLetter}
                    onChangeText={setCoverLetter}
                    multiline
                    numberOfLines={20}
                    mode="outlined"
                    style={styles.coverLetterInput}
                    outlineColor="#E2E8F0"
                    activeOutlineColor="#2563EB"
                  />
                </Card.Content>
              </Card>

              <View style={styles.buttonRow}>
                <Button
                  mode="contained"
                  onPress={handleCopyToClipboard}
                  style={styles.actionButton}
                  buttonColor="#2563EB"
                  icon="content-copy"
                >
                  Copy
                </Button>
                <Button
                  mode="outlined"
                  onPress={handleShare}
                  style={styles.actionButton}
                  textColor="#2563EB"
                  icon="share-variant"
                >
                  Share
                </Button>
              </View>
            </>
          )}
        </View>
      )}

      {activeTab === 'download' && (
        <View style={styles.tabContent}>
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>Download Your Documents</Text>
              
              <Button
                mode="contained"
                onPress={handleDownloadResume}
                style={styles.downloadButton}
                buttonColor="#2563EB"
                icon="file-pdf-box"
              >
                Download Resume PDF
              </Button>

              <Button
                mode="contained"
                onPress={handleDownloadCoverLetter}
                style={styles.downloadButton}
                buttonColor="#2563EB"
                icon="file-document"
              >
                Download Cover Letter
              </Button>

              <Button
                mode="outlined"
                onPress={() => Alert.alert('Share', 'Share both files functionality')}
                style={styles.downloadButton}
                textColor="#2563EB"
                icon="share-variant"
              >
                Share Both Files
              </Button>
            </Card.Content>
          </Card>
        </View>
      )}

      {/* FOOTER ACTION - Prepare for Interview */}
      <View style={styles.footerAction}>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('Interview', { 
            optimization_id: optimizationId,
            job_title: jobTitle,
            company_name: companyName
          })}
          style={styles.interviewButton}
          buttonColor="#10B981"
          icon="microphone"
        >
          Prepare for Interview
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 16,
    color: '#64748B',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  scoreSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    ...SHADOWS.small,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 20,
    textAlign: 'center',
  },
  scoresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  scoreCard: {
    alignItems: 'center',
  },
  scoreBadge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
  },
  scoreBadgeBefore: {
    backgroundColor: '#FEF2F2',
    borderColor: '#F97316',
  },
  scoreBadgeAfter: {
    backgroundColor: '#F0FDF4',
    borderColor: '#10B981',
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  improvementContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  improvementText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
  },
  keywordsContainer: {
    marginTop: 12,
  },
  keywordsLabel: {
    color: '#475569',
    marginBottom: 8,
    fontWeight: '600',
  },
  keywordsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  keywordBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  keywordText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    elevation: 1,
    ...SHADOWS.small,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#2563EB',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  tabContent: {
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    elevation: 1,
    ...SHADOWS.small,
  },
  infoCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2563EB',
  },
  infoLabel: {
    color: '#1E40AF',
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    color: '#1E293B',
    lineHeight: 20,
  },
  cardTitle: {
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 12,
  },
  cardText: {
    color: '#475569',
    lineHeight: 22,
  },
  experienceItem: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  expCompany: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  expTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
    marginBottom: 2,
  },
  expDates: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
  },
  expBullet: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 4,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  skillText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
  },
  coverLetterInput: {
    backgroundColor: '#FFFFFF',
    minHeight: 400,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
  },
  downloadButton: {
    marginBottom: 12,
    borderRadius: 8,
  },
  footerAction: {
    marginTop: 8,
    marginBottom: 40,
  },
  interviewButton: {
    borderRadius: 12,
    paddingVertical: 8,
    ...SHADOWS.medium,
  },
});

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Text } from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import api, { postForm } from '../../services/api';
import useAuthStore from '../../store/useAuthStore';
import useResumeStore, { Resume } from '../../store/useResumeStore';
import { usePlanLimits } from '../../hooks';
import { PaywallModal } from '../../components/PaywallModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../../utils/theme';
import { Input, Button, Card } from '../../components/ui';
import ResumeAnalysisCard from '../../components/resume/ResumeAnalysisCard';
import JobSearchSheet from '../../components/jobs/JobSearchSheet';

export default function ResumeScreen({ navigation }: any) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  
  const { currentResume, setResume } = useResumeStore();
  const { canPerformAction, getRemainingCount, isPro, refetch } = usePlanLimits();
  const [profile, setProfile] = useState<any>(null);
  const plan = useAuthStore((state) => state.plan);
  
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  
  const [companyName, setCompanyName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [optimizing, setOptimizing] = useState(false);
  const [optimizeError, setOptimizeError] = useState('');
  
  const [showPaywall, setShowPaywall] = useState(false);
  const [showUploadTooltip, setShowUploadTooltip] = useState(false);
  const [showJobSearch, setShowJobSearch] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string | null>('target');

  useEffect(() => {
    checkFirstTimeUser();
    fetchUsageStats();
  }, []);

  const fetchUsageStats = async () => {
    try {
      const response = await api.get('/api/usage/stats');
      setProfile({ optimizations_used: response.data.resume_optimize });
    } catch (error) {
      // Silently fail as requested
    }
  };

  const checkFirstTimeUser = async () => {
    try {
      const hasSeenTooltip = await AsyncStorage.getItem('hasSeenResumeUploadTooltip');
      if (!hasSeenTooltip) {
        setShowUploadTooltip(true);
      }
    } catch (error) {
      console.error('Error checking tooltip status:', error);
    }
  };

  const dismissTooltip = async () => {
    try {
      await AsyncStorage.setItem('hasSeenResumeUploadTooltip', 'true');
      setShowUploadTooltip(false);
    } catch (error) {
      console.error('Error saving tooltip status:', error);
    }
  };

  const handleUploadResume = async () => {
    try {
      setUploadError('');
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      setUploading(true);

      const formData = new FormData();

      // Handle web vs native differently
      if (Platform.OS === 'web') {
        // On web, fetch the file as blob
        const response = await fetch(file.uri);
        const blob = await response.blob();
        formData.append('file', blob, file.name || 'resume.pdf');
      } else {
        // On native (iOS/Android), use uri format
        formData.append('file', {
          uri: file.uri,
          name: file.name || 'resume.pdf',
          type: 'application/pdf',
        } as any);
      }

      const uploadResponse = await postForm<any>('/api/resume/upload', formData);

      // Map backend response to frontend Resume interface
      const resumeData: Resume = {
        id: uploadResponse.resume_id,
        fileName: file.name || 'resume.pdf',
        characterCount: uploadResponse.character_count,
        summary: uploadResponse.structured?.summary || '',
        experience: uploadResponse.structured?.experience_text || '',
        uploadedAt: new Date().toISOString(),
        analysis: uploadResponse.analysis, // Include the AI analysis
      };

      setResume(resumeData);
      setUploading(false);
      fetchUsageStats();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      setUploadError(error.message || 'Failed to upload resume');
      setUploading(false);
    }
  };

  const handleOptimize = async () => {
    if (!currentResume || !jobDescription.trim()) return;

    if (!canPerformAction('resume_optimize')) {
      setShowPaywall(true);
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setOptimizeError('');
    setOptimizing(true);

    try {
      navigation.navigate('OptimizationLoading', {
        companyName,
        jobTitle,
        jobDescription,
        resumeId: currentResume.id,
      });
    } catch (error: any) {
      setOptimizeError(error.message || 'Failed to start optimization');
    } finally {
      setOptimizing(false);
    }
  };

  const handleUpgrade = (planId: string) => {
    setShowPaywall(false);
    setTimeout(() => {
      navigation.navigate('Upgrade');
    }, 150);
  };

  const isOptimizeDisabled = !currentResume || !jobDescription.trim() || optimizing;
  
  const optimizationsUsed = profile?.optimizations_used ?? 0;
  const optimizationsLimit = plan === 'free' ? 3 : Infinity;
  const optimizationsLeft = optimizationsLimit === Infinity
    ? 'Unlimited'
    : Math.max(0, optimizationsLimit - optimizationsUsed);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView 
        contentContainerStyle={[styles.scrollContainer, isDesktop && styles.scrollContainerDesktop]} 
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        {/* PURPLE TOP SECTION */}
        <View style={styles.purpleHeader}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerTextCol}>
              <Text style={styles.headerTitle}>Your resume</Text>
              <Text style={styles.headerSubtitle}>AI analysis powered by Claude</Text>
            </View>
            <View style={styles.scoreCircle}>
              <Text style={styles.scoreNumber}>
                {currentResume?.analysis?.overall_score 
                  ? currentResume.analysis.overall_score 
                  : '78'}
              </Text>
              <Text style={styles.scoreLabel}>ATS</Text>
            </View>
          </View>
          
          <View style={styles.chipsRow}>
            <View style={[styles.chip, styles.chipGreen]}>
              <Text style={[styles.chipText, styles.chipTextGreen]}>Python ✓</Text>
            </View>
            <View style={[styles.chip, styles.chipGreen]}>
              <Text style={[styles.chipText, styles.chipTextGreen]}>GenAI ✓</Text>
            </View>
            <View style={[styles.chip, styles.chipPink]}>
              <Text style={[styles.chipText, styles.chipTextPink]}>Leadership ✗</Text>
            </View>
            <View style={[styles.chip, styles.chipYellow]}>
              <Text style={[styles.chipText, styles.chipTextYellow]}>SQL —</Text>
            </View>
          </View>
        </View>

        {/* WHITE OVERLAPPING CONTENT VIEW */}
        <View style={styles.mainContent}>
          {/* FILE UPLOAD OVERLAP CARD */}
          <View style={styles.overlapCard}>
            {currentResume ? (
              <>
                <View style={styles.fileInfoRow}>
                  <View style={styles.pdfIconBox}>
                    <Text style={styles.pdfIconText}>PDF</Text>
                  </View>
                  <View style={styles.fileMetaCol}>
                    <Text style={styles.fileNameText} numberOfLines={1}>{currentResume.fileName}</Text>
                    <Text style={styles.fileSizeText}>
                      {currentResume.characterCount.toLocaleString()} chars · uploaded today
                    </Text>
                  </View>
                </View>
                
                {currentResume.summary && (
                  <Text style={styles.fileSummaryText} numberOfLines={2}>
                    {currentResume.summary}
                  </Text>
                )}
              </>
            ) : (
              <View style={styles.noResumeContainer}>
                <Text style={styles.noResumeText}>No resume uploaded yet</Text>
              </View>
            )}

            <TouchableOpacity 
              style={styles.uploadBox}
              onPress={() => {
                dismissTooltip();
                handleUploadResume();
              }}
              disabled={uploading}
            >
              <Text style={styles.uploadBoxMainText}>
                {uploading ? 'Uploading...' : '+ Upload new resume'}
              </Text>
              <Text style={styles.uploadBoxSubText}>PDF, DOCX up to 5 MB</Text>
            </TouchableOpacity>
            {uploadError ? <Text style={styles.errorText}>{uploadError}</Text> : null}
          </View>

          {/* 2x2 ACTION GRID */}
          <View style={styles.actionGridContainer}>
            {/* ATS Score Check */}
            <TouchableOpacity 
              style={[styles.gridCard, selectedAction === 'ats' && styles.gridCardSelected]}
              onPress={() => setSelectedAction('ats')}
            >
              <Text style={styles.gridCardIcon}>📊</Text>
              <Text style={styles.gridCardTitle}>ATS score check</Text>
              <Text style={styles.gridCardSub}>General scoring</Text>
            </TouchableOpacity>

            {/* Gap Analyzer */}
            <TouchableOpacity 
              style={[styles.gridCard, selectedAction === 'gap' && styles.gridCardSelected]}
              onPress={() => setSelectedAction('gap')}
            >
              <Text style={styles.gridCardIcon}>⚖️</Text>
              <Text style={styles.gridCardTitle}>Gap analyzer</Text>
              <Text style={styles.gridCardSub}>Missing skills</Text>
            </TouchableOpacity>

            {/* Suggest Roles */}
            <TouchableOpacity 
              style={[styles.gridCard, selectedAction === 'role' && styles.gridCardSelected]}
              onPress={() => setSelectedAction('role')}
            >
              <Text style={styles.gridCardIcon}>💡</Text>
              <Text style={styles.gridCardTitle}>Suggest roles</Text>
              <Text style={styles.gridCardSub}>Matching titles</Text>
            </TouchableOpacity>

            {/* Target Company (Purple) */}
            <TouchableOpacity 
              style={[styles.gridCardPurple, selectedAction === 'target' && styles.gridCardSelectedPurple]}
              onPress={() => setSelectedAction('target')}
            >
              <Text style={styles.gridCardIcon}>🎯</Text>
              <Text style={styles.gridCardTitlePurple}>Target company</Text>
              <Text style={styles.gridCardSubPurple}>Optimize now</Text>
            </TouchableOpacity>
          </View>


          {/* CONDITIONAL RENDER BELOW GRID */}
          {selectedAction === 'target' && (
            <View style={{ marginTop: SPACING.xl }}>
              <Text style={styles.sectionHeading}>Target a Specific Job</Text>
              <View style={styles.targetJobForm}>
                <Input label="Company Name" value={companyName} onChangeText={setCompanyName} placeholder="E.g. Google, Stripe" />
                <Input label="Job Title" value={jobTitle} onChangeText={setJobTitle} placeholder="E.g. Senior Software Engineer" />
                <Input label="Job Description" value={jobDescription} onChangeText={setJobDescription} placeholder="Paste job description..." multiline numberOfLines={4} containerStyle={styles.textAreaContainer} />
              </View>

              {optimizeError ? <Text style={styles.errorText}>{optimizeError}</Text> : null}

              <Button
                title="Optimize now"
                onPress={handleOptimize}
                loading={optimizing}
                disabled={isOptimizeDisabled}
                size="large"
                fullWidth
                style={styles.optimizeBtn}
              />
            </View>
          )}

          {selectedAction !== 'target' && (
            <View style={{ marginTop: SPACING.xl }}>
              {currentResume ? (
                <View>
                  <Text style={styles.sectionHeading}>
                    {selectedAction === 'ats' && "ATS Compatibility Score"}
                    {selectedAction === 'gap' && "Skills Gap Analysis"}
                    {selectedAction === 'role' && "Role Match Suggestions"}
                  </Text>
                  <ResumeAnalysisCard 
                    actionType={selectedAction as any}
                    analysis={currentResume.analysis || {
                      overall_score: 78,
                      score_breakdown: { ats_compatibility: 78, content_quality: 75, impact_language: 80, skills_relevance: 82, formatting: 70 },
                      candidate_level: "Mid-level",
                      years_experience: 3,
                      primary_field: "Technology",
                      top_skills: ["Python", "JavaScript", "React"],
                      missing_critical_skills: ["Docker", "Kubernetes", "Cloud Services"],
                      strengths: ["Strong technical skills", "Clear formatting", "Relevant experience"],
                      critical_gaps: ["Lack of quantified achievements", "Missing some industry standard tools"],
                      quick_wins: ["Add more numbers to bullet points", "Include a tailored summary"],
                      best_fit_roles: ["Software Engineer", "Frontend Developer", "Full Stack Developer"],
                      best_fit_companies: ["Tech Startups", "Mid-size SaaS", "Digital Agencies"],
                      salary_range_estimate: "Industry Standard",
                      readiness_verdict: "Ready for general applications. Optimize for specific roles for best results."
                    }} 
                  />
                </View>
              ) : (
                <View style={styles.targetJobForm}>
                  <Text style={{ textAlign: 'center', color: '#6B7280', padding: SPACING.xl }}>
                    {selectedAction === 'ats' && "Upload your resume above to get a comprehensive ATS score."}
                    {selectedAction === 'gap' && "Upload your resume to identify missing skills and critical gaps."}
                    {selectedAction === 'role' && "Upload your resume to see the best matching job titles for you."}
                  </Text>
                </View>
              )}
            </View>
          )}
          
        </View>
      </ScrollView>

      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onUpgrade={handleUpgrade}
        feature="resume_optimize"
      />

      <JobSearchSheet
        visible={showJobSearch}
        onClose={() => setShowJobSearch(false)}
        onSearch={(prefs) => {
          setShowJobSearch(false);
          navigation.navigate('JobSearchAgent', prefs);
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: SPACING.xxl,
  },
  scrollContainerDesktop: {
    maxWidth: 800, // Kept at 800 for single column focus
    alignSelf: 'center',
    width: '100%',
  },
  purpleHeader: {
    backgroundColor: '#6366F1',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    padding: SPACING.xl,
    paddingTop: SPACING.xxl * 1.5,
    paddingBottom: SPACING.xxl * 1.5,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  headerTextCol: {
    flex: 1,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumber: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 32,
  },
  scoreLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '600',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  chipGreen: { backgroundColor: '#D1FAE5' },
  chipPink: { backgroundColor: '#FCE7F3' },
  chipYellow: { backgroundColor: '#FEF3C7' },
  chipText: { fontSize: 12, fontWeight: '700' },
  chipTextGreen: { color: '#059669' },
  chipTextPink: { color: '#BE185D' },
  chipTextYellow: { color: '#D97706' },
  mainContent: {
    paddingHorizontal: SPACING.xl,
  },
  overlapCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: SPACING.lg,
    marginTop: -40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: SPACING.xl,
  },
  fileInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  pdfIconBox: {
    width: 48,
    height: 48,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  pdfIconText: {
    color: '#EF4444',
    fontWeight: '800',
    fontSize: 14,
  },
  fileMetaCol: {
    flex: 1,
  },
  fileNameText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  fileSizeText: {
    color: '#6B7280',
    fontSize: 12,
  },
  fileSummaryText: {
    color: '#4B5563',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  noResumeContainer: {
    alignItems: 'center',
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  noResumeText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  uploadBox: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: SPACING.md,
    alignItems: 'center',
  },
  uploadBoxMainText: {
    color: '#6366F1',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  uploadBoxSubText: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  actionGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  gridCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  gridCardSelected: {
    borderColor: '#6366F1',
    borderWidth: 2,
    backgroundColor: '#EEF2FF',
  },
  gridCardPurple: {
    width: '47%',
    backgroundColor: '#6366F1',
    borderRadius: 20,
    padding: SPACING.md,
  },
  gridCardSelectedPurple: {
    borderWidth: 2,
    borderColor: '#818CF8', // Lighter purple border
  },
  gridCardIcon: {
    fontSize: 24,
    marginBottom: SPACING.sm,
  },
  gridCardTitle: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  gridCardSub: {
    color: '#6B7280',
    fontSize: 11,
  },
  gridCardTitlePurple: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  gridCardSubPurple: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: SPACING.md,
  },
  targetJobForm: {
    backgroundColor: '#FFFFFF',
    padding: SPACING.lg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  textAreaContainer: {
    marginBottom: SPACING.sm,
  },
  optimizeBtn: {
    marginTop: SPACING.md,
    borderRadius: 16,
    paddingVertical: 8,
    backgroundColor: '#6366F1',
  },
  errorText: {
    color: COLORS.danger,
    marginTop: SPACING.sm,
    fontSize: 14,
    textAlign: 'center',
  },
});

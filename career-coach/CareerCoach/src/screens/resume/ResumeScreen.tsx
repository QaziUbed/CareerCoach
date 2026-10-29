import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Alert, useWindowDimensions } from 'react-native';
import { Text } from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import { postForm } from '../../services/api';
import useResumeStore, { Resume } from '../../store/useResumeStore';
import { usePlanLimits } from '../../hooks';
import { PaywallModal } from '../../components/PaywallModal';
import { UpgradeSuccessModal } from '../../components/UpgradeSuccessModal';
import purchaseService from '../../services/purchaseService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../../utils/theme';
import { Input, Button, Card } from '../../components/ui';

export default function ResumeScreen({ navigation }: any) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  
  const { currentResume, setResume } = useResumeStore();
  const { canPerformAction, getRemainingCount, isPro, refetch } = usePlanLimits();
  
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  
  const [companyName, setCompanyName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [optimizing, setOptimizing] = useState(false);
  const [optimizeError, setOptimizeError] = useState('');
  
  const [showPaywall, setShowPaywall] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [upgradedPlan, setUpgradedPlan] = useState('');
  const [showUploadTooltip, setShowUploadTooltip] = useState(false);

  useEffect(() => {
    checkFirstTimeUser();
  }, []);

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
      formData.append('file', {
        uri: file.uri,
        type: 'application/pdf',
        name: file.name || 'resume.pdf',
      } as any);

      const response = await postForm<Resume>('/api/resume/upload', formData);
      setResume(response);
      setUploading(false);
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

  const handleUpgrade = async (planId: string) => {
    try {
      setShowPaywall(false);
      const offerings = await purchaseService.getOfferings();
      
      if (!offerings || !offerings.current) {
        Alert.alert('Error', 'No products available currently.');
        return;
      }

      const selectedPackage = offerings.current.availablePackages.find((pkg: any) => 
        pkg.identifier.toLowerCase().includes(planId)
      );
      
      if (!selectedPackage) {
        Alert.alert('Error', 'Selected plan not found');
        return;
      }
      
      const purchaseResult = await purchaseService.purchasePackage(selectedPackage);
      
      if (purchaseResult) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setUpgradedPlan(planId === 'pro' ? 'Pro' : 'Career+');
        setShowSuccess(true);
        refetch();
      }
    } catch (error: any) {
      if (error.message !== 'USER_CANCELLED') {
        Alert.alert('Purchase Failed', error.message || 'Unable to complete purchase');
      }
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
  };

  const isOptimizeDisabled = !currentResume || !jobDescription.trim() || optimizing;
  const remainingOptimizations = getRemainingCount('resume_optimize');

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView 
        contentContainerStyle={[styles.scrollContainer, isDesktop && styles.scrollContainerDesktop]} 
        keyboardShouldPersistTaps="handled"
      >
        <View style={isDesktop ? styles.desktopGrid : null}>
          {/* LEFT COLUMN: Resume & Tooltip */}
          <View style={isDesktop ? styles.desktopLeftColumn : null}>
            <View style={styles.sectionHeader}>
              <Text variant="titleLarge" style={styles.sectionTitle}>Your Resume</Text>
            </View>
            
            <Card style={styles.resumeCard}>
              {!currentResume ? (
                <View style={styles.noResumeContainer}>
                  <Text variant="bodyMedium" style={styles.noResumeText}>No resume uploaded yet</Text>
                  <Text variant="bodySmall" style={styles.noResumeSubtext}>Upload your PDF to get started</Text>
                </View>
              ) : (
                <View style={styles.resumeInfoContainer}>
                  <View style={styles.resumeHeader}>
                    <Text variant="titleMedium" style={styles.resumeFileName}>
                      {currentResume.fileName}
                    </Text>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>PDF</Text>
                    </View>
                  </View>

                  {currentResume.summary && (
                    <View style={styles.previewSection}>
                      <Text style={styles.previewLabel}>Resume Summary</Text>
                      <Text style={styles.previewText} numberOfLines={3}>
                        {currentResume.summary}
                      </Text>
                    </View>
                  )}

                  <Text variant="bodySmall" style={styles.characterCount}>
                    {currentResume.characterCount.toLocaleString()} characters processed
                  </Text>
                </View>
              )}
            </Card>

            <View style={styles.uploadWrapper}>
              <Button
                title={uploading ? 'Uploading...' : 'Upload New Resume'}
                onPress={() => {
                  dismissTooltip();
                  handleUploadResume();
                }}
                loading={uploading}
                disabled={uploading}
                variant="outline"
                icon="file-pdf-box"
                fullWidth
              />
              
              {showUploadTooltip && (
                <View style={styles.tooltip}>
                  <Text style={styles.tooltipText}>
                    👆 Start here! Upload your resume to get personalized optimization.
                  </Text>
                  <TouchableOpacity onPress={dismissTooltip} style={styles.tooltipClose}>
                    <Text style={styles.tooltipCloseText}>Got it</Text>
                  </TouchableOpacity>
                </View>
              )}
              {uploadError ? <Text style={styles.errorText}>{uploadError}</Text> : null}
            </View>
          </View>

          {/* RIGHT COLUMN: Job Details */}
          <View style={isDesktop ? styles.desktopRightColumn : null}>
            <View style={styles.sectionHeader}>
              <Text variant="titleLarge" style={styles.sectionTitle}>Job Details</Text>
              {!isPro && (
                <View style={styles.usageBadge}>
                  <Text style={styles.usageBadgeText}>{remainingOptimizations} optimizations left</Text>
                </View>
              )}
            </View>

            <Card style={styles.jobCard}>
              <Input
                label="Company Name"
                value={companyName}
                onChangeText={setCompanyName}
                placeholder="E.g. Google, Stripe, etc."
              />

              <Input
                label="Job Title"
                value={jobTitle}
                onChangeText={setJobTitle}
                placeholder="E.g. Senior Frontend Engineer"
              />

              <Input
                label="Job Description"
                value={jobDescription}
                onChangeText={setJobDescription}
                placeholder="Paste the full job description here..."
                multiline
                numberOfLines={isDesktop ? 12 : 8}
                containerStyle={styles.textAreaContainer}
              />
            </Card>

            {optimizeError ? <Text style={styles.errorText}>{optimizeError}</Text> : null}

            <Button
              title="Analyze & Optimize Resume"
              onPress={handleOptimize}
              loading={optimizing}
              disabled={isOptimizeDisabled}
              size="large"
              fullWidth
              style={styles.optimizeButton}
            />
          </View>
        </View>
      </ScrollView>

      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onUpgrade={handleUpgrade}
        feature="resume_optimize"
      />

      <UpgradeSuccessModal
        visible={showSuccess}
        onClose={handleSuccessClose}
        planName={upgradedPlan}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    padding: SPACING.md,
  },
  scrollContainerDesktop: {
    padding: SPACING.xxl,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  desktopGrid: {
    flexDirection: 'row',
    gap: SPACING.xl,
    alignItems: 'flex-start',
  },
  desktopLeftColumn: {
    flex: 1,
  },
  desktopRightColumn: {
    flex: 1.5,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  resumeCard: {
    marginBottom: SPACING.md,
    minHeight: 200,
    justifyContent: 'center',
  },
  noResumeContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  noResumeText: {
    color: COLORS.textPrimary,
    fontWeight: '700',
    fontSize: TYPOGRAPHY.fontSizes.lg,
    marginBottom: SPACING.xs,
  },
  noResumeSubtext: {
    color: COLORS.textSecondary,
  },
  resumeInfoContainer: {
    width: '100%',
  },
  resumeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  resumeFileName: {
    color: COLORS.accent,
    fontWeight: '800',
    flex: 1,
    marginRight: SPACING.sm,
  },
  badge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  badgeText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '800',
  },
  previewSection: {
    backgroundColor: 'rgba(15, 23, 42, 0.02)',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
  },
  previewLabel: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.xs,
  },
  previewText: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSizes.sm,
    lineHeight: 20,
  },
  characterCount: {
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
  uploadWrapper: {
    marginBottom: SPACING.xl,
  },
  jobCard: {
    marginBottom: SPACING.xl,
  },
  textAreaContainer: {
    marginTop: SPACING.sm,
  },
  optimizeButton: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  usageBadge: {
    backgroundColor: '#FEF3C7', // Amber 100
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  usageBadgeText: {
    color: '#92400E', // Amber 800
    fontSize: 12,
    fontWeight: '700',
  },
  errorText: {
    color: COLORS.danger,
    marginTop: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSizes.sm,
    textAlign: 'center',
  },
  tooltip: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.accent,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    ...SHADOWS.medium,
  },
  tooltipText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: SPACING.sm,
    fontWeight: '500',
  },
  tooltipClose: {
    alignSelf: 'flex-end',
    paddingVertical: 6,
    paddingHorizontal: SPACING.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: RADIUS.md,
  },
  tooltipCloseText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});

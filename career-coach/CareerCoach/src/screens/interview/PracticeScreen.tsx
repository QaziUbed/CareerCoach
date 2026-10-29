import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, Card, Button, ActivityIndicator } from 'react-native-paper';
import VoiceRecorder from '../../components/interview/VoiceRecorder';
import { postForm } from '../../services/api';
import { usePlanLimits } from '../../hooks';
import { PaywallModal } from '../../components/PaywallModal';
import { UpgradeSuccessModal } from '../../components/UpgradeSuccessModal';
import purchaseService from '../../services/purchaseService';

export default function PracticeScreen({ route, navigation }: any) {
  const {
    question,
    category,
    answer_framework,
    sample_talking_points = [],
    optimization_id,
    question_index,
  } = route.params || {};

  const { canPerformAction, refetch } = usePlanLimits();
  
  const [showFramework, setShowFramework] = useState(false);
  const [showTalkingPoints, setShowTalkingPoints] = useState(false);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [recordedDuration, setRecordedDuration] = useState(0);
  const [uploading, setUploading] = useState(false);
  
  const [showPaywall, setShowPaywall] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [upgradedPlan, setUpgradedPlan] = useState('');

  const getCategoryColor = (cat: string) => {
    const colors = {
      behavioral: '#2563EB',
      technical: '#10B981',
      situational: '#F59E0B',
      company: '#8B5CF6',
    };
    return colors[cat as keyof typeof colors] || '#64748B';
  };

  const getCategoryBgColor = (cat: string) => {
    const colors = {
      behavioral: '#EFF6FF',
      technical: '#DCFCE7',
      situational: '#FEF3C7',
      company: '#F3E8FF',
    };
    return colors[cat as keyof typeof colors] || '#F1F5F9';
  };

  const handleRecordingComplete = (uri: string, duration: number) => {
    setRecordedUri(uri);
    setRecordedDuration(duration);
  };

  const handleSubmit = async () => {
    if (!recordedUri) {
      Alert.alert('No Recording', 'Please record your answer first.');
      return;
    }

    // Check plan limits before submitting
    if (!canPerformAction('voice_session')) {
      setShowPaywall(true);
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append('optimization_id', optimization_id);
      formData.append('question', question);
      formData.append('question_index', question_index.toString());
      
      const audioFile = {
        uri: recordedUri,
        type: 'audio/m4a',
        name: `answer_${Date.now()}.m4a`,
      } as any;
      
      formData.append('audio', audioFile);

      const response = await postForm<any>('/api/interview/feedback', formData);

      setUploading(false);

      navigation.navigate('Feedback', {
        ...response,
        question,
        category,
      });
    } catch (error: any) {
      setUploading(false);
      Alert.alert('Error', error.message || 'Failed to submit answer');
    }
  };

  const handleUpgrade = async (planId: string) => {
    try {
      setShowPaywall(false);
      
      const offerings = await purchaseService.getOfferings();
      if (!offerings || !offerings.current) return;
      
      const selectedPackage = offerings.current.availablePackages.find((pkg: any) => 
        pkg.identifier.toLowerCase().includes(planId)
      );
      
      if (!selectedPackage) {
        Alert.alert('Error', 'Selected plan not found');
        return;
      }
      
      const purchaseResult = await purchaseService.purchasePackage(selectedPackage);
      
      if (purchaseResult) {
        setUpgradedPlan(planId === 'pro' ? 'Pro' : 'Career+');
        setShowSuccess(true);
        refetch();
      }
    } catch (error: any) {
      if (!error.userCancelled) {
        Alert.alert('Purchase Failed', error.message || 'Unable to complete purchase');
      }
    }
  };

  const categoryColor = getCategoryColor(category);
  const categoryBgColor = getCategoryBgColor(category);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Question Card */}
      <Card style={styles.questionCard}>
        <Card.Content>
          <View style={[styles.categoryBadge, { backgroundColor: categoryBgColor }]}>
            <Text style={[styles.categoryText, { color: categoryColor }]}>
              {category?.toUpperCase()}
            </Text>
          </View>
          <Text variant="headlineSmall" style={styles.questionText}>
            {question}
          </Text>
        </Card.Content>
      </Card>

      {/* Answer Framework Hint */}
      <Card style={styles.hintCard}>
        <TouchableOpacity onPress={() => setShowFramework(!showFramework)}>
          <Card.Content>
            <View style={styles.hintHeader}>
              <Text variant="titleMedium" style={styles.hintTitle}>
                💡 Answer Framework
              </Text>
              <Text style={styles.expandIcon}>{showFramework ? '▼' : '▶'}</Text>
            </View>
            {showFramework && (
              <Text style={styles.hintText}>{answer_framework}</Text>
            )}
          </Card.Content>
        </TouchableOpacity>
      </Card>

      {/* Sample Talking Points */}
      {sample_talking_points.length > 0 && (
        <Card style={styles.hintCard}>
          <TouchableOpacity onPress={() => setShowTalkingPoints(!showTalkingPoints)}>
            <Card.Content>
              <View style={styles.hintHeader}>
                <Text variant="titleMedium" style={styles.hintTitle}>
                  📝 Sample Talking Points
                </Text>
                <Text style={styles.expandIcon}>{showTalkingPoints ? '▼' : '▶'}</Text>
              </View>
              {showTalkingPoints && (
                <View style={styles.talkingPointsList}>
                  {sample_talking_points.map((point: string, index: number) => (
                    <Text key={index} style={styles.talkingPoint}>
                      • {point}
                    </Text>
                  ))}
                </View>
              )}
            </Card.Content>
          </TouchableOpacity>
        </Card>
      )}

      {/* Voice Recorder */}
      <Card style={styles.recorderCard}>
        <Card.Content>
          <VoiceRecorder
            onRecordingComplete={handleRecordingComplete}
            maxDuration={180}
          />
        </Card.Content>
      </Card>

      {/* Submit Button */}
      <Button
        mode="contained"
        onPress={handleSubmit}
        disabled={!recordedUri || uploading}
        loading={uploading}
        style={styles.submitButton}
        buttonColor="#2563EB"
        contentStyle={styles.submitButtonContent}
      >
        {uploading ? 'Analyzing Answer...' : 'Submit Answer'}
      </Button>

      {/* Duration Warning */}
      {recordedUri && (
        <View style={styles.durationWarning}>
          {recordedDuration < 45 && (
            <Text style={styles.warningText}>
              ⚠️ Your answer is quite short ({recordedDuration}s). Consider adding more detail.
            </Text>
          )}
          {recordedDuration > 180 && (
            <Text style={styles.warningText}>
              ⚠️ Your answer is very long ({recordedDuration}s). Try to be more concise.
            </Text>
          )}
          {recordedDuration >= 60 && recordedDuration <= 120 && (
            <Text style={styles.successText}>
              ✓ Great length! ({recordedDuration}s)
            </Text>
          )}
        </View>
      )}

      {/* Paywall Modal */}
      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onUpgrade={handleUpgrade}
        feature="voice_session"
      />

      {/* Upgrade Success Modal */}
      <UpgradeSuccessModal
        visible={showSuccess}
        onClose={() => setShowSuccess(false)}
        planName={upgradedPlan}
      />
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
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  questionText: {
    color: '#1E293B',
    fontWeight: '600',
    lineHeight: 28,
  },
  hintCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  hintHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hintTitle: {
    color: '#1E293B',
    fontWeight: '600',
  },
  expandIcon: {
    fontSize: 16,
    color: '#64748B',
  },
  hintText: {
    marginTop: 12,
    color: '#475569',
    lineHeight: 20,
  },
  talkingPointsList: {
    marginTop: 12,
  },
  talkingPoint: {
    color: '#475569',
    lineHeight: 20,
    marginBottom: 6,
  },
  recorderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  submitButton: {
    borderRadius: 8,
    marginBottom: 16,
  },
  submitButtonContent: {
    paddingVertical: 8,
  },
  durationWarning: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  warningText: {
    color: '#F59E0B',
    fontSize: 14,
    textAlign: 'center',
  },
  successText: {
    color: '#10B981',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
  },
});

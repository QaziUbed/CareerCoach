import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Animated } from 'react-native';
import { Text, Card, Button } from 'react-native-paper';
import * as Haptics from 'expo-haptics';

export default function FeedbackScreen({ route, navigation }: any) {
  const {
    session_id,
    transcript,
    score = 0,
    grade = 'Good',
    feedback,
    strengths = [],
    improvements = [],
    better_opening,
    audio_url,
    question,
    category,
  } = route.params || {};

  const [showTranscript, setShowTranscript] = useState(false);
  const scoreAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate score counting up
    Animated.timing(scoreAnim, {
      toValue: score,
      duration: 1500,
      useNativeDriver: false,
    }).start(() => {
      // Haptic feedback when animation completes
      Haptics.notificationAsync(
        score >= 8
          ? Haptics.NotificationFeedbackType.Success
          : score >= 5
          ? Haptics.NotificationFeedbackType.Warning
          : Haptics.NotificationFeedbackType.Error
      );
    });
  }, []);

  const getScoreColor = () => {
    if (score < 5) return '#EF4444'; // Red
    if (score < 7) return '#F59E0B'; // Orange
    if (score < 8) return '#EAB308'; // Yellow
    return '#10B981'; // Green
  };

  const getScoreBgColor = () => {
    if (score < 5) return '#FEE2E2';
    if (score < 7) return '#FED7AA';
    if (score < 8) return '#FEF3C7';
    return '#D1FAE5';
  };

  const handlePracticeAgain = () => {
    navigation.goBack();
  };

  const handleNextQuestion = () => {
    navigation.navigate('Interview', {
      optimization_id: route.params.optimization_id,
    });
  };

  const animatedScore = scoreAnim.interpolate({
    inputRange: [0, 10],
    outputRange: ['0', '10'],
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Score Circle */}
      <View style={styles.scoreSection}>
        <View style={[styles.scoreCircle, { backgroundColor: getScoreBgColor() }]}>
          <Animated.Text style={[styles.scoreNumber, { color: getScoreColor() }]}>
            {animatedScore.interpolate({
              inputRange: [0, 10],
              outputRange: ['0', '10'],
            }).toString().split('.')[0]}
          </Animated.Text>
          <Text style={styles.scoreOutOf}>/10</Text>
        </View>
        <Text style={[styles.gradeLabel, { color: getScoreColor() }]}>{grade}</Text>
      </View>

      {/* Transcript Section */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              📝 Your Answer
            </Text>
            <Button
              mode="text"
              onPress={() => setShowTranscript(!showTranscript)}
              textColor="#2563EB"
              compact
            >
              {showTranscript ? 'Hide' : 'Show'}
            </Button>
          </View>
          {showTranscript && (
            <Text style={styles.transcriptText}>{transcript}</Text>
          )}
        </Card.Content>
      </Card>

      {/* Strengths Card */}
      {strengths.length > 0 && (
        <Card style={[styles.card, styles.strengthsCard]}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.strengthsTitle}>
              ✅ What You Did Well
            </Text>
            {strengths.map((strength: string, index: number) => (
              <View key={index} style={styles.listItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.strengthText}>{strength}</Text>
              </View>
            ))}
          </Card.Content>
        </Card>
      )}

      {/* Improvements Card */}
      {improvements.length > 0 && (
        <Card style={[styles.card, styles.improvementsCard]}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.improvementsTitle}>
              💡 Areas to Improve
            </Text>
            {improvements.map((improvement: string, index: number) => (
              <View key={index} style={styles.listItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.improvementText}>{improvement}</Text>
              </View>
            ))}
          </Card.Content>
        </Card>
      )}

      {/* Better Opening Suggestion */}
      {!!better_opening && (
        <Card style={[styles.card, styles.betterOpeningCard]}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.betterOpeningTitle}>
              🎯 Suggested Opening
            </Text>
            <Text style={styles.betterOpeningText}>{better_opening}</Text>
          </Card.Content>
        </Card>
      )}

      {/* Overall Feedback */}
      {!!feedback && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              📊 Overall Coaching Feedback
            </Text>
            <Text style={styles.feedbackText}>{feedback}</Text>
          </Card.Content>
        </Card>
      )}

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <Button
          mode="outlined"
          onPress={handlePracticeAgain}
          style={styles.actionButton}
          textColor="#2563EB"
        >
          Practice Again
        </Button>
        <Button
          mode="contained"
          onPress={handleNextQuestion}
          style={styles.actionButton}
          buttonColor="#2563EB"
        >
          Next Question
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
  scoreSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 24,
  },
  scoreCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  scoreNumber: {
    fontSize: 56,
    fontWeight: 'bold',
  },
  scoreOutOf: {
    fontSize: 20,
    color: '#64748B',
    marginTop: -8,
  },
  gradeLabel: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    color: '#1E293B',
    fontWeight: '600',
  },
  transcriptText: {
    color: '#475569',
    lineHeight: 22,
    marginTop: 8,
  },
  strengthsCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  strengthsTitle: {
    color: '#059669',
    fontWeight: 'bold',
    marginBottom: 12,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  bullet: {
    color: '#64748B',
    marginRight: 8,
    fontSize: 16,
  },
  strengthText: {
    flex: 1,
    color: '#065F46',
    lineHeight: 20,
  },
  improvementsCard: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  improvementsTitle: {
    color: '#EA580C',
    fontWeight: 'bold',
    marginBottom: 12,
  },
  improvementText: {
    flex: 1,
    color: '#9A3412',
    lineHeight: 20,
  },
  betterOpeningCard: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#93C5FD',
  },
  betterOpeningTitle: {
    color: '#1D4ED8',
    fontWeight: 'bold',
    marginBottom: 12,
  },
  betterOpeningText: {
    color: '#1E40AF',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  feedbackText: {
    color: '#475569',
    lineHeight: 22,
    marginTop: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
  },
});

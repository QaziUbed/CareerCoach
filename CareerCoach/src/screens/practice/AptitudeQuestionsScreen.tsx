import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Card, Button } from 'react-native-paper';
import { get } from '../../services/api';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';
import { LoadingScreen } from '../../components/ui';

export default function AptitudeQuestionsScreen({ route }: any) {
  const { topicId, title } = route.params;
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [showExplanation, setShowExplanation] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadQuestions();
  }, [topicId]);

  const loadQuestions = async () => {
    try {
      const data = await get<any>(`/api/practice/aptitude/questions/${topicId}`);
      setQuestions(data.questions);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const checkAnswer = (questionId: string, index: number, correctIndex: number) => {
    setSelectedAnswers(prev => ({ ...prev, [questionId]: index }));
    setShowExplanation(prev => ({ ...prev, [questionId]: true }));
  };

  if (loading) return <LoadingScreen message="Loading questions..." />;
  if (!questions || questions.length === 0) return <Text style={styles.title}>No questions found.</Text>;

  const q = questions[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === questions.length - 1;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text variant="headlineMedium" style={styles.title}>{title} Practice</Text>
      
      <Text style={{ textAlign: 'center', marginBottom: SPACING.md, color: COLORS.textSecondary }}>
        Question {currentIndex + 1} of {questions.length}
      </Text>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.questionText}>{q.question}</Text>
          
          {q.options.map((option: string, index: number) => {
            const isSelected = selectedAnswers[q.id] === index;
            const isCorrect = index === q.correct_index;
            const showed = showExplanation[q.id];
            
            let bgColor = COLORS.surface;
            if (showed) {
              if (isCorrect) bgColor = '#DCFCE7'; // Green
              else if (isSelected && !isCorrect) bgColor = '#FEE2E2'; // Red
            }
            
            return (
              <TouchableOpacity 
                  key={index} 
                  style={[styles.option, { backgroundColor: bgColor }]}
                  onPress={() => !showed && checkAnswer(q.id, index, q.correct_index)}>
                <Text style={styles.optionText}>{option}</Text>
              </TouchableOpacity>
            )
          })}
          
          {showExplanation[q.id] && (
            <View style={styles.explanationBox}>
              <Text style={styles.explanationText}>Explanation: {q.explanation}</Text>
            </View>
          )}
        </Card.Content>
      </Card>

      <View style={styles.navRow}>
        <Button 
          mode="outlined" 
          disabled={isFirst} 
          onPress={() => setCurrentIndex(c => c - 1)}
          style={styles.navBtn}
        >
          Previous
        </Button>
        <Button 
          mode="contained" 
          disabled={isLast} 
          onPress={() => setCurrentIndex(c => c + 1)}
          style={styles.navBtn}
        >
          Next
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg },
  title: { fontWeight: 'bold', color: COLORS.primary, marginBottom: SPACING.sm, textAlign: 'center' },
  card: { marginBottom: SPACING.lg, borderRadius: RADIUS.lg, ...SHADOWS.small },
  questionText: { fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: SPACING.md },
  option: {
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm
  },
  optionText: { color: COLORS.textPrimary },
  explanationBox: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: '#F1F5F9',
    borderRadius: RADIUS.md
  },
  explanationText: { color: COLORS.textSecondary, fontStyle: 'italic' },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.lg,
    paddingBottom: 40
  },
  navBtn: {
    width: '45%'
  }
});

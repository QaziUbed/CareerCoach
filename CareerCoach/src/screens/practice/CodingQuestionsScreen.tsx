import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Card, Chip, Button } from 'react-native-paper';
import { get } from '../../services/api';
import { COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '../../utils/theme';
import { LoadingScreen } from '../../components/ui';

export default function CodingQuestionsScreen({ route }: any) {
  const { topicId, title } = route.params;
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showSolution, setShowSolution] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadQuestions();
  }, [topicId]);

  const loadQuestions = async () => {
    try {
      const data = await get<any>(`/api/practice/coding/questions/${topicId}`);
      setQuestions(data.questions);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  if (loading) return <LoadingScreen message="Loading problems..." />;
  if (!questions || questions.length === 0) return <Text style={styles.title}>No questions found.</Text>;

  const q = questions[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === questions.length - 1;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text variant="headlineMedium" style={styles.title}>{title}</Text>
      
      <Text style={{ textAlign: 'center', marginBottom: SPACING.md, color: COLORS.textSecondary }}>
        Problem {currentIndex + 1} of {questions.length}
      </Text>

      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <Text variant="titleMedium" style={styles.questionTitle}>{q.title}</Text>
            <Chip style={styles.chip}>{q.difficulty}</Chip>
          </View>
          <Text style={styles.desc}>{q.description}</Text>
          
          <TouchableOpacity 
            style={styles.solutionButton} 
            onPress={() => setShowSolution(prev => ({ ...prev, [q.id]: !prev[q.id] }))}>
            <Text style={styles.solutionButtonText}>
              {showSolution[q.id] ? "Hide Solution" : "View Solution Snippet"}
            </Text>
          </TouchableOpacity>

          {showSolution[q.id] && (
            <View style={styles.codeBox}>
              <Text style={styles.codeText}>{q.solution_snippet}</Text>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  questionTitle: { fontWeight: 'bold', color: COLORS.textPrimary, flex: 1 },
  chip: { height: 28 },
  desc: { color: COLORS.textSecondary, marginBottom: SPACING.lg, lineHeight: 22 },
  solutionButton: {
    padding: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.sm,
    alignItems: 'center'
  },
  solutionButtonText: { color: COLORS.primary, fontWeight: 'bold' },
  codeBox: {
    marginTop: SPACING.md,
    backgroundColor: '#1E293B',
    padding: SPACING.md,
    borderRadius: RADIUS.md
  },
  codeText: { color: '#F8FAFC', fontFamily: 'monospace', fontSize: TYPOGRAPHY.fontSizes.sm },
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

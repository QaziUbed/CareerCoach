import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Chip, Button } from 'react-native-paper';
import { get } from '../../services/api';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';
import { LoadingScreen } from '../../components/ui';

export default function CompanyQuestionsScreen({ route }: any) {
  const { companyId, companyName } = route.params;
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    loadQuestions();
  }, [companyId]);

  const loadQuestions = async () => {
    try {
      const data = await get<any>(`/api/practice/companies/${companyId}/questions`);
      setQuestions(data.questions);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  if (loading) return <LoadingScreen message={`Loading facts for ${companyName}...`} />;
  if (!questions || questions.length === 0) return <Text style={styles.title}>No questions found.</Text>;

  const q = questions[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === questions.length - 1;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text variant="headlineMedium" style={styles.title}>{companyName} FAQs</Text>
      
      <Text style={{ textAlign: 'center', marginBottom: SPACING.md, color: COLORS.textSecondary }}>
        Question {currentIndex + 1} of {questions.length}
      </Text>
      
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <Chip style={styles.chip}>{q.category}</Chip>
            <Chip style={styles.chip}>{q.difficulty}</Chip>
          </View>
          <Text variant="titleMedium" style={styles.questionText}>{q.question}</Text>
          <Text style={styles.frequency}>Frequency: {q.frequency}</Text>
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
  card: { marginBottom: SPACING.md, borderRadius: RADIUS.lg, ...SHADOWS.small, paddingTop: SPACING.md, paddingBottom: SPACING.xl },
  header: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  chip: { height: 28 },
  questionText: { fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: SPACING.md, fontSize: 18, lineHeight: 26 },
  frequency: { color: COLORS.textSecondary, fontSize: 12 },
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

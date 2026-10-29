import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { get } from '../../services/api';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../../utils/theme';
import { LoadingScreen } from '../../components/ui';

export default function AptitudeScreen({ navigation }: any) {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTopics();
  }, []);

  const loadTopics = async () => {
    try {
      const { topics } = await get<any>('/api/practice/aptitude/topics');
      setTopics(topics);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  if (loading) return <LoadingScreen message="Loading topics..." />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text variant="headlineMedium" style={styles.title}>Aptitude Practice</Text>
      <Text style={styles.subtitle}>Select a topic to start practicing</Text>
      
      {topics.map((item: any) => (
        <TouchableOpacity 
          key={item.id} 
          onPress={() => navigation.navigate('AptitudeQuestions', { topicId: item.id, title: item.title })}>
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDesc}>{item.description}</Text>
              <Text style={styles.count}>{item.question_count} Questions</Text>
            </Card.Content>
          </Card>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg },
  title: { fontWeight: 'bold', color: COLORS.primary, marginBottom: SPACING.xs },
  subtitle: { color: COLORS.textSecondary, marginBottom: SPACING.xl },
  card: { marginBottom: SPACING.md, borderRadius: RADIUS.lg, ...SHADOWS.small },
  cardTitle: { fontWeight: 'bold', color: COLORS.textPrimary },
  cardDesc: { color: COLORS.textSecondary, marginVertical: SPACING.xs },
  count: { fontSize: TYPOGRAPHY.fontSizes.sm, color: COLORS.primary, fontWeight: 'bold' }
});

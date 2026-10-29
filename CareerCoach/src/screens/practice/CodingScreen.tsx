import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { get } from '../../services/api';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../../utils/theme';
import { LoadingScreen } from '../../components/ui';

export default function CodingScreen({ navigation }: any) {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTopics();
  }, []);

  const loadTopics = async () => {
    try {
      const { topics } = await get<any>('/api/practice/coding/topics');
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
      <Text variant="headlineMedium" style={styles.title}>Coding & Logic Building</Text>
      <Text style={styles.subtitle}>Improve your programming basics</Text>
      
      {topics.map((item: any) => (
        <Card key={item.id} style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardDesc}>{item.description}</Text>
            <TouchableOpacity 
              style={styles.button} 
              onPress={() => navigation.navigate('CodingQuestions', { topicId: item.id, title: item.title })}>
              <Text style={styles.buttonText}>Practice Now</Text>
            </TouchableOpacity>
          </Card.Content>
        </Card>
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
  cardDesc: { color: COLORS.textSecondary, marginVertical: SPACING.sm },
  button: {
    backgroundColor: COLORS.primaryLight,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.xs
  },
  buttonText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  }
});

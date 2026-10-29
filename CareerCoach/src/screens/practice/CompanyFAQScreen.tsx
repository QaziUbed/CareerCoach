import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { get } from '../../services/api';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../../utils/theme';
import { LoadingScreen } from '../../components/ui';

export default function CompanyFAQScreen({ navigation }: any) {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      const { companies } = await get<any>('/api/practice/companies');
      setCompanies(companies);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  if (loading) return <LoadingScreen message="Loading companies..." />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text variant="headlineMedium" style={styles.title}>Company FAQs</Text>
      <Text style={styles.subtitle}>Previous year questions from top companies</Text>
      
      <View style={styles.grid}>
        {companies.map((company: any) => (
          <TouchableOpacity 
            key={company.id} 
            style={styles.cardContainer}
            onPress={() => navigation.navigate('CompanyQuestions', { companyId: company.id, companyName: company.name })}>
            <Card style={styles.card}>
              <Card.Content style={styles.cardContent}>
                <Text style={styles.emoji}>{company.logo_emoji}</Text>
                <Text variant="titleMedium" style={styles.cardTitle} numberOfLines={1}>{company.name}</Text>
                <Text style={styles.industry} numberOfLines={1}>{company.industry}</Text>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg },
  title: { fontWeight: 'bold', color: COLORS.primary, marginBottom: SPACING.xs },
  subtitle: { color: COLORS.textSecondary, marginBottom: SPACING.xl },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -SPACING.sm },
  cardContainer: { width: '50%', padding: SPACING.sm },
  card: { borderRadius: RADIUS.lg, ...SHADOWS.small, height: 120 },
  cardContent: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  emoji: { fontSize: 32, marginBottom: SPACING.xs },
  cardTitle: { fontWeight: 'bold', color: COLORS.textPrimary, textAlign: 'center' },
  industry: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.fontSizes.xs, textAlign: 'center' }
});

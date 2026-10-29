import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../utils/theme';
import { Button } from './ui';

const { height } = Dimensions.get('window');

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade: (planId: string) => void;
  feature: 'resume_optimize' | 'cover_letter' | 'voice_session';
}

const FEATURE_CONFIG = {
  resume_optimize: {
    title: 'Unlock Unlimited Resume Optimization',
    icon: 'file-document-edit' as const,
    benefits: [
      'Unlimited ATS optimization scans',
      'Advanced keyword matching',
      'Industry-specific recommendations',
    ],
  },
  cover_letter: {
    title: 'Unlock Unlimited Cover Letters',
    icon: 'email-edit' as const,
    benefits: [
      'Generate unlimited cover letters',
      'AI-powered personalization',
      'Multiple templates and styles',
    ],
  },
  voice_session: {
    title: 'Unlock Unlimited Interview Practice',
    icon: 'microphone' as const,
    benefits: [
      'Unlimited voice interview sessions',
      'Real-time feedback and scoring',
      'Practice with any job description',
    ],
  },
};

const PLANS = [
  {
    id: 'pro',
    name: 'Pro',
    price: '$24.99',
    period: '/month',
    features: [
      'Unlimited resume optimization',
      'Unlimited cover letters',
      'Unlimited interview practice',
      'Priority support',
    ],
    popular: true,
  },
  {
    id: 'career_plus',
    name: 'Career+',
    price: '$39.99',
    period: '/month',
    features: [
      'Everything in Pro',
      'Advanced analytics',
      'Career coaching sessions',
      'Job application tracking',
      'Salary negotiation tips',
    ],
    popular: false,
  },
];

export const PaywallModal: React.FC<PaywallModalProps> = ({
  visible,
  onClose,
  onUpgrade,
  feature,
}) => {
  const config = FEATURE_CONFIG[feature];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons
                name={config.icon}
                size={32}
                color={COLORS.primary}
              />
            </View>
            <Text style={styles.title}>{config.title}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Feature Benefits */}
            <View style={styles.benefitsSection}>
              {config.benefits.map((benefit, index) => (
                <View key={index} style={styles.benefitItem}>
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={20}
                    color={COLORS.success}
                  />
                  <Text style={styles.benefitText}>{benefit}</Text>
                </View>
              ))}
            </View>

            {/* Plan Options */}
            <View style={styles.plansSection}>
              {PLANS.map((plan) => (
                <TouchableOpacity
                  key={plan.id}
                  style={[
                    styles.planCard,
                    plan.popular && styles.planCardPopular,
                  ]}
                  onPress={() => onUpgrade(plan.id)}
                  activeOpacity={0.8}
                >
                  {plan.popular && (
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularText}>MOST POPULAR</Text>
                    </View>
                  )}
                  
                  <View style={styles.planHeader}>
                    <Text style={styles.planName}>{plan.name}</Text>
                    <View style={styles.planPricing}>
                      <Text style={styles.planPrice}>{plan.price}</Text>
                      <Text style={styles.planPeriod}>{plan.period}</Text>
                    </View>
                  </View>

                  <View style={styles.planFeatures}>
                    {plan.features.map((feature, index) => (
                      <View key={index} style={styles.planFeatureItem}>
                        <MaterialCommunityIcons
                          name="check"
                          size={16}
                          color={plan.popular ? COLORS.primary : COLORS.textSecondary}
                        />
                        <Text style={styles.planFeatureText}>{feature}</Text>
                      </View>
                    ))}
                  </View>

                  <Button
                    variant={plan.popular ? 'primary' : 'outline'}
                    onPress={() => onUpgrade(plan.id)}
                    style={styles.planButton}
                  >
                    Start Free Trial
                  </Button>
                </TouchableOpacity>
              ))}
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                7-day free trial • Cancel anytime • No commitment
              </Text>
            </View>
          </ScrollView>

          {/* Dismiss Button */}
          <TouchableOpacity style={styles.dismissButton} onPress={onClose}>
            <Text style={styles.dismissText}>Maybe Later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: height * 0.85,
    paddingBottom: SPACING.xl,
  },
  header: {
    alignItems: 'center',
    paddingTop: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSizes.xl,
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    padding: SPACING.xs,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  benefitsSection: {
    paddingVertical: SPACING.lg,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  benefitText: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  plansSection: {
    gap: SPACING.md,
  },
  planCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  planCardPopular: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    alignSelf: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  popularText: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  planHeader: {
    marginBottom: SPACING.md,
  },
  planName: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  planPricing: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  planPrice: {
    fontSize: TYPOGRAPHY.fontSizes.xxl,
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    color: COLORS.primary,
  },
  planPeriod: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
  },
  planFeatures: {
    marginBottom: SPACING.md,
  },
  planFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  planFeatureText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textPrimary,
    marginLeft: SPACING.xs,
  },
  planButton: {
    marginTop: SPACING.sm,
  },
  footer: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  footerText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  dismissButton: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  dismissText: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
  },
});

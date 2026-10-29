import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { Text, Button, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import useAuthStore from '../../store/useAuthStore';
import { patch } from '../../services/api';

// Lazy load purchase service (may not be available on web)
let purchaseService: any = null;
try {
  purchaseService = require('../../services/purchaseService').default;
} catch (e) {
  console.log('Purchase service not available');
}

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  id: string;
  name: string;
  price: string;
  period: string;
  popular: boolean;
  features: PlanFeature[];
  packageId?: string;
}

const PLANS: Plan[] = [
  {
    id: 'job_seeker',
    name: 'Job Seeker',
    price: '$14.99',
    period: '/month',
    popular: false,
    features: [
      { text: '10 resume optimizations/month', included: true },
      { text: 'ATS score analysis', included: true },
      { text: 'Interview question prep', included: true },
      { text: 'Job application tracking', included: true },
      { text: 'Cover letter generation', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$24.99',
    period: '/month',
    popular: true,
    features: [
      { text: 'Unlimited resume optimizations', included: true },
      { text: 'ATS score analysis', included: true },
      { text: 'Interview question prep', included: true },
      { text: 'Job application tracking', included: true },
      { text: 'Cover letter generation', included: true },
    ],
  },
  {
    id: 'career_plus',
    name: 'Career+',
    price: '$39.99',
    period: '/month',
    popular: false,
    features: [
      { text: 'Everything in Pro', included: true },
      { text: 'Priority support', included: true },
      { text: 'Career coaching sessions', included: true },
      { text: 'LinkedIn profile optimization', included: true },
      { text: 'Salary negotiation guide', included: true },
    ],
  },
];

export default function UpgradeScreen() {
  const navigation = useNavigation();
  const user = useAuthStore((state) => state.user);
  const setPlan = useAuthStore((state) => state.setPlan);
  
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [offerings, setOfferings] = useState<any>(null);

  useEffect(() => {
    loadOfferings();
  }, []);

  const loadOfferings = async () => {
    try {
      const offers = await purchaseService.getOfferings();
      setOfferings(offers);
    } catch (error) {
      console.error('Failed to load offerings:', error);
      Alert.alert('Error', 'Failed to load subscription plans. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const findPackageForPlan = (planId: string): any | null => {
    if (!offerings?.current) return null;

    // Find package by identifier
    const pkg = offerings.current.availablePackages.find(
      (p: any) => p.identifier.toLowerCase().includes(planId.toLowerCase())
    );

    return pkg || null;
  };

  const handlePurchase = async (planId: string) => {
    if (!user) return;

    setPurchasing(planId);

    try {
      // Find the package for this plan
      const pkg = findPackageForPlan(planId);
      
      if (!pkg) {
        Alert.alert('Error', 'This plan is not available at the moment.');
        return;
      }

      // Purchase the package
      const customerInfo = await purchaseService.purchasePackage(pkg);

      // Check if purchase was successful
      if (customerInfo.entitlements.active['pro_access']) {
        // Update plan in backend
        await patch('/api/profile', { plan: planId });

        // Update local state
        setPlan(planId as any);

        Alert.alert(
          'Success!',
          'Your subscription is now active. Enjoy your premium features!',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error: any) {
      if (error.message === 'USER_CANCELLED') {
        // User cancelled, do nothing
        return;
      }

      console.error('Purchase failed:', error);
      Alert.alert(
        'Purchase Failed',
        'Unable to complete your purchase. Please try again.'
      );
    } finally {
      setPurchasing(null);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);

    try {
      const customerInfo = await purchaseService.restorePurchases();

      // Check if user has active entitlement
      if (customerInfo.entitlements.active['pro_access']) {
        // Get the active plan
        const activePlan = await purchaseService.getActivePlan();

        // Update plan in backend
        await patch('/api/profile', { plan: activePlan });

        // Update local state
        setPlan(activePlan as any);

        Alert.alert(
          'Success!',
          'Your purchases have been restored.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert(
          'No Purchases Found',
          'We couldn\'t find any active subscriptions to restore.'
        );
      }
    } catch (error) {
      console.error('Restore failed:', error);
      Alert.alert(
        'Restore Failed',
        'Unable to restore your purchases. Please try again.'
      );
    } finally {
      setRestoring(false);
    }
  };

  const openTerms = () => {
    Linking.openURL('https://yourapp.com/terms');
  };

  const openPrivacy = () => {
    Linking.openURL('https://yourapp.com/privacy');
  };

  const renderPlanCard = (plan: Plan) => {
    const isPurchasing = purchasing === plan.id;
    const pkg = findPackageForPlan(plan.id);

    return (
      <View
        key={plan.id}
        style={[
          styles.planCard,
          plan.popular && styles.planCardPopular,
        ]}
      >
        {plan.popular && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularText}>MOST POPULAR</Text>
          </View>
        )}

        <Text style={styles.planName}>{plan.name}</Text>
        
        <View style={styles.priceContainer}>
          <Text style={styles.planPrice}>{pkg?.product.priceString || plan.price}</Text>
          <Text style={styles.planPeriod}>{plan.period}</Text>
        </View>

        <View style={styles.featuresContainer}>
          {plan.features.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <Text style={styles.featureIcon}>
                {feature.included ? '✓' : '—'}
              </Text>
              <Text
                style={[
                  styles.featureText,
                  !feature.included && styles.featureTextDisabled,
                ]}
              >
                {feature.text}
              </Text>
            </View>
          ))}
        </View>

        <Button
          mode="contained"
          onPress={() => handlePurchase(plan.id)}
          loading={isPurchasing}
          disabled={loading || isPurchasing || restoring}
          style={[
            styles.purchaseButton,
            plan.popular && styles.purchaseButtonPopular,
          ]}
          contentStyle={styles.purchaseButtonContent}
          labelStyle={styles.purchaseButtonLabel}
        >
          {isPurchasing ? 'Processing...' : 'Subscribe'}
        </Button>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading plans...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.closeButton}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upgrade Your Plan</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Unlock Your Career Potential</Text>
          <Text style={styles.heroSubtitle}>
            Choose the plan that fits your job search needs
          </Text>
        </View>

        {/* Plans */}
        <View style={styles.plansContainer}>
          {PLANS.map(renderPlanCard)}
        </View>

        {/* Restore Button */}
        <Button
          mode="outlined"
          onPress={handleRestore}
          loading={restoring}
          disabled={loading || restoring || purchasing !== null}
          style={styles.restoreButton}
          contentStyle={styles.restoreButtonContent}
          labelStyle={styles.restoreButtonLabel}
        >
          Restore Purchases
        </Button>

        {/* Footer Links */}
        <View style={styles.footerLinks}>
          <TouchableOpacity onPress={openTerms}>
            <Text style={styles.footerLink}>Terms of Service</Text>
          </TouchableOpacity>
          <Text style={styles.footerSeparator}>•</Text>
          <TouchableOpacity onPress={openPrivacy}>
            <Text style={styles.footerLink}>Privacy Policy</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footerNote}>
          Subscriptions automatically renew unless cancelled at least 24 hours
          before the end of the current period.
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  closeButton: {
    fontSize: 24,
    color: '#64748B',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  heroSection: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
  },
  plansContainer: {
    gap: 16,
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    position: 'relative',
  },
  planCardPopular: {
    borderColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  popularText: {
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 12,
  },
  planName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 24,
  },
  planPrice: {
    fontSize: 36,
    fontWeight: '700',
    color: '#3B82F6',
  },
  planPeriod: {
    fontSize: 16,
    color: '#64748B',
    marginLeft: 4,
  },
  featuresContainer: {
    marginBottom: 24,
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 18,
    color: '#10B981',
    marginRight: 12,
    width: 20,
  },
  featureText: {
    fontSize: 15,
    color: '#1E293B',
    flex: 1,
  },
  featureTextDisabled: {
    color: '#94A3B8',
  },
  purchaseButton: {
    borderRadius: 8,
    backgroundColor: '#1E293B',
  },
  purchaseButtonPopular: {
    backgroundColor: '#3B82F6',
  },
  purchaseButtonContent: {
    paddingVertical: 8,
  },
  purchaseButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  restoreButton: {
    borderRadius: 8,
    borderColor: '#3B82F6',
    marginTop: 24,
  },
  restoreButtonContent: {
    paddingVertical: 8,
  },
  restoreButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
    gap: 12,
  },
  footerLink: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
  footerSeparator: {
    fontSize: 14,
    color: '#94A3B8',
  },
  footerNote: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
  },
});

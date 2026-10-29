# Quick Start: Using In-App Purchases

## ✅ Setup Complete!

Your RevenueCat API keys are configured in `.env`. The IAP system is ready to use!

## 🚀 How to Use IAP in Your App

### 1. Navigate to Upgrade Screen

From any screen:
```typescript
import { useNavigation } from '@react-navigation/native';

const navigation = useNavigation();
navigation.navigate('Upgrade');
```

### 2. Check Plan Limits

Use the `usePlanLimits` hook:
```typescript
import usePlanLimits from '../hooks/usePlanLimits';

function MyComponent() {
  const limits = usePlanLimits();
  
  // Check if loading
  if (limits.isLoading) {
    return <Loading />;
  }
  
  // Check resume optimization limit
  if (limits.resumeOptimizations === -1) {
    // Unlimited access
  } else {
    // Show limit: limits.resumeOptimizations
  }
  
  // Check feature access
  if (limits.canGenerateCoverLetter) {
    // Show cover letter feature
  } else {
    // Show upgrade prompt
  }
}
```

### 3. Show Upgrade Prompt

When user hits a limit:
```typescript
import { Alert } from 'react-native';

const showUpgradePrompt = () => {
  Alert.alert(
    'Upgrade Required',
    'This feature is available on Pro plans.',
    [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Upgrade', 
        onPress: () => navigation.navigate('Upgrade')
      },
    ]
  );
};
```

### 4. Check Current Plan

From Zustand store:
```typescript
import useAuthStore from '../store/useAuthStore';

const plan = useAuthStore((state) => state.plan);
// plan: 'free' | 'job_seeker' | 'pro' | 'career_plus'
```

### 5. Check Entitlement Directly

For advanced use cases:
```typescript
import purchaseService from '../services/purchaseService';

const hasProAccess = await purchaseService.hasProAccess();
if (hasProAccess) {
  // User has paid subscription
}
```

## 📋 Integration Checklist

### Resume Screen
- [ ] Check `limits.resumeOptimizations` before optimization
- [ ] Show usage count (e.g., "2/3 used this month")
- [ ] Show upgrade prompt when limit reached
- [ ] Add "Upgrade for unlimited" banner for free users

### Cover Letter Screen
- [ ] Check `limits.canGenerateCoverLetter` before generation
- [ ] Show upgrade prompt if not available
- [ ] Hide feature completely for free/job_seeker plans

### Interview Screen
- [ ] Check `limits.canAccessInterviewPrep` (always true currently)
- [ ] Consider adding advanced features for paid plans

### Settings Screen
- [ ] Show current plan name: `limits.planName`
- [ ] Add "Manage Subscription" button → navigate to Upgrade
- [ ] Show feature comparison table

### Home Screen
- [ ] Show upgrade banner for free users
- [ ] Display current plan badge
- [ ] Add quick action to upgrade

## 🎨 UI Patterns

### Upgrade Banner (for free users)
```typescript
{plan === 'free' && (
  <Card style={styles.upgradeBanner}>
    <Card.Content>
      <Text style={styles.bannerTitle}>🚀 Unlock Premium</Text>
      <Text>Get unlimited optimizations and more!</Text>
      <Button onPress={() => navigation.navigate('Upgrade')}>
        Upgrade Now
      </Button>
    </Card.Content>
  </Card>
)}
```

### Feature Lock Overlay
```typescript
{!limits.canGenerateCoverLetter && (
  <View style={styles.lockOverlay}>
    <Text>🔒 Pro Feature</Text>
    <Button onPress={() => navigation.navigate('Upgrade')}>
      Upgrade to Unlock
    </Button>
  </View>
)}
```

### Usage Counter
```typescript
{limits.resumeOptimizations !== -1 && (
  <Text>
    {currentUsage}/{limits.resumeOptimizations} used this month
  </Text>
)}
```

## 🧪 Testing

### Test in Development
1. RevenueCat will work in development mode
2. Use sandbox test accounts (iOS/Android)
3. Purchases won't charge real money

### Test Scenarios
- [ ] Purchase Job Seeker plan
- [ ] Purchase Pro plan
- [ ] Purchase Career+ plan
- [ ] Cancel purchase (should not show error)
- [ ] Restore purchases after reinstall
- [ ] Check limits update after purchase
- [ ] Verify backend receives plan update

## 🔐 Security Notes

1. **Always verify on backend**
   - Don't trust client-side plan checks alone
   - Use RevenueCat webhooks for real-time updates

2. **Handle edge cases**
   - User purchases on another device
   - Subscription expires
   - Refund issued
   - Billing problem

3. **Sync plan to backend**
   - After successful purchase
   - After restore purchases
   - On app launch (check RevenueCat)

## 📱 Example Implementation

See `src/components/ExampleFeatureScreen.tsx` for a complete example showing:
- Plan limit checks
- Upgrade prompts
- Feature gating
- Upgrade banners
- Usage tracking

## 🎯 Next Steps

1. **Add upgrade prompts to existing screens:**
   - ResumeScreen
   - OptimizationResultScreen
   - InterviewScreen
   - HomeScreen

2. **Test purchase flow:**
   - Set up sandbox accounts
   - Test all 3 plans
   - Test restore purchases

3. **Add analytics:**
   - Track upgrade button clicks
   - Track successful purchases
   - Track feature usage by plan

4. **Polish UI:**
   - Add plan badges
   - Show feature comparison
   - Add testimonials to upgrade screen

## 🆘 Troubleshooting

### RevenueCat not initializing
- Check API keys in `.env`
- Ensure user.id is available
- Check console for errors

### Offerings not loading
- Verify products created in RevenueCat
- Check entitlement configuration
- Ensure offerings are published

### Purchase fails
- Check sandbox account setup
- Verify product IDs match
- Check App Store Connect / Play Console

### Plan not syncing
- Check backend API endpoint
- Verify Zustand store update
- Check RevenueCat customer info

## 📚 Resources

- RevenueCat Docs: https://docs.revenuecat.com/
- React Native Purchases: https://github.com/RevenueCat/react-native-purchases
- Example Code: `src/components/ExampleFeatureScreen.tsx`
- Full Guide: `IAP_IMPLEMENTATION.md`

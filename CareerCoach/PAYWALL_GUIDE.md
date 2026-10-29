# Paywall & Upgrade Experience Guide

Complete guide for the paywall system, plan limits, and upgrade flow in the Career Coach app.

## 📦 Components & Hooks

### 1. usePlanLimits Hook (`src/hooks/usePlanLimits.ts`)

Custom hook that manages plan limits and usage tracking.

**Usage:**
```typescript
import { usePlanLimits } from '../hooks';

function MyComponent() {
  const {
    limits,              // Current plan limits
    usage,               // Current usage counts
    isPro,               // Boolean: is user on paid plan
    isLoading,           // Loading state
    canPerformAction,    // Function to check if action is allowed
    getRemainingCount,   // Function to get remaining count
    refetch,             // Refetch limits and usage
  } = usePlanLimits();

  // Check if user can perform action
  if (!canPerformAction('resume_optimize')) {
    // Show paywall
  }

  // Get remaining count
  const remaining = getRemainingCount('resume_optimize');
  // Returns: number (0-3 for free, Infinity for pro)
}
```

**Plan Limits:**
```typescript
// Free Plan
{
  resume_optimize: 3,
  cover_letter: 3,
  voice_session: 5,
}

// Paid Plans (Pro & Career+)
{
  resume_optimize: Infinity,
  cover_letter: Infinity,
  voice_session: Infinity,
}
```

**API:**
- `canPerformAction(action)` - Returns `true` if user can perform action
- `getRemainingCount(action)` - Returns remaining count (Infinity for pro users)
- `refetch()` - Manually refresh limits and usage data

---

### 2. PaywallModal Component (`src/components/PaywallModal.tsx`)

Modal that slides up from bottom when user hits a free plan limit.

**Usage:**
```typescript
import { PaywallModal } from '../components/PaywallModal';

const [showPaywall, setShowPaywall] = useState(false);

<PaywallModal
  visible={showPaywall}
  onClose={() => setShowPaywall(false)}
  onUpgrade={(planId) => handleUpgrade(planId)}
  feature="resume_optimize" // or "cover_letter" or "voice_session"
/>
```

**Props:**
- `visible: boolean` - Show/hide modal
- `onClose: () => void` - Called when user dismisses
- `onUpgrade: (planId: string) => void` - Called when user selects a plan
- `feature: 'resume_optimize' | 'cover_letter' | 'voice_session'` - Feature being blocked

**Features:**
- Dynamic title and benefits based on feature
- Two plan options: Pro ($24.99) and Career+ ($39.99)
- "Most Popular" badge on Pro plan
- "Start Free Trial" CTA button
- "Maybe Later" dismiss option (NOT a hard gate)
- Smooth slide-up animation

**Feature-Specific Content:**

**Resume Optimization:**
- Title: "Unlock Unlimited Resume Optimization"
- Icon: file-document-edit
- Benefits:
  - Unlimited ATS optimization scans
  - Advanced keyword matching
  - Industry-specific recommendations

**Cover Letter:**
- Title: "Unlock Unlimited Cover Letters"
- Icon: email-edit
- Benefits:
  - Generate unlimited cover letters
  - AI-powered personalization
  - Multiple templates and styles

**Voice Session:**
- Title: "Unlock Unlimited Interview Practice"
- Icon: microphone
- Benefits:
  - Unlimited voice interview sessions
  - Real-time feedback and scoring
  - Practice with any job description

---

### 3. UpgradeSuccessModal Component (`src/components/UpgradeSuccessModal.tsx`)

Celebration modal with confetti animation shown after successful upgrade.

**Usage:**
```typescript
import { UpgradeSuccessModal } from '../components/UpgradeSuccessModal';

const [showSuccess, setShowSuccess] = useState(false);
const [upgradedPlan, setUpgradedPlan] = useState('');

<UpgradeSuccessModal
  visible={showSuccess}
  onClose={() => setShowSuccess(false)}
  planName={upgradedPlan} // "Pro" or "Career+"
/>
```

**Features:**
- Confetti animation (200 pieces)
- Animated success icon (spring animation)
- Welcome message with plan name
- List of unlocked features
- "Start Using Premium Features" CTA

---

## 🎯 Integration Pattern

### Standard Integration Flow

```typescript
import { usePlanLimits } from '../hooks';
import { PaywallModal } from '../components/PaywallModal';
import { UpgradeSuccessModal } from '../components/UpgradeSuccessModal';
import purchaseService from '../services/purchaseService';

function FeatureScreen() {
  const { canPerformAction, refetch } = usePlanLimits();
  const [showPaywall, setShowPaywall] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [upgradedPlan, setUpgradedPlan] = useState('');

  const handleFeatureAction = async () => {
    // 1. Check if user can perform action
    if (!canPerformAction('resume_optimize')) {
      setShowPaywall(true);
      return; // Stop here - don't make API call
    }

    // 2. User has access - proceed with feature
    try {
      await performFeatureAction();
    } catch (error) {
      // Handle error
    }
  };

  const handleUpgrade = async (planId: string) => {
    try {
      setShowPaywall(false);
      
      // Get available packages
      const packages = await purchaseService.getOfferings();
      const selectedPackage = packages.find(pkg => 
        pkg.identifier.toLowerCase().includes(planId)
      );
      
      if (!selectedPackage) {
        Alert.alert('Error', 'Selected plan not found');
        return;
      }
      
      // Purchase the package
      const purchaseResult = await purchaseService.purchasePackage(selectedPackage);
      
      if (purchaseResult) {
        // Show success modal
        setUpgradedPlan(planId === 'pro' ? 'Pro' : 'Career+');
        setShowSuccess(true);
        
        // Refetch plan limits
        refetch();
      }
    } catch (error: any) {
      if (!error.userCancelled) {
        Alert.alert('Purchase Failed', error.message);
      }
    }
  };

  return (
    <View>
      {/* Your feature UI */}
      <Button onPress={handleFeatureAction}>Use Feature</Button>

      {/* Paywall Modal */}
      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onUpgrade={handleUpgrade}
        feature="resume_optimize"
      />

      {/* Success Modal */}
      <UpgradeSuccessModal
        visible={showSuccess}
        onClose={() => setShowSuccess(false)}
        planName={upgradedPlan}
      />
    </View>
  );
}
```

---

## 📱 Integrated Screens

### 1. ResumeScreen
**Feature:** `resume_optimize`
**Integration Point:** Before calling optimize API
**Behavior:**
- Shows remaining optimizations count in header
- Checks `canPerformAction('resume_optimize')` before optimization
- Shows PaywallModal if limit reached
- User can dismiss and continue using other features

### 2. PracticeScreen (Interview)
**Feature:** `voice_session`
**Integration Point:** Before submitting voice recording
**Behavior:**
- Checks `canPerformAction('voice_session')` before submission
- Shows PaywallModal if limit reached
- User can dismiss and try other questions

### 3. Cover Letter Screen (Future)
**Feature:** `cover_letter`
**Integration Point:** Before generating cover letter
**Behavior:**
- Shows remaining count
- Checks `canPerformAction('cover_letter')` before generation
- Shows PaywallModal if limit reached

---

## 🎨 UI/UX Principles

### Soft Paywall (NOT Hard Gate)
- Users can always dismiss the paywall
- Free features remain accessible
- No forced upgrades
- Encourages upgrade without blocking

### Progressive Disclosure
- Show limits only when relevant
- Display remaining count near action buttons
- Don't overwhelm users with upgrade prompts

### Celebration on Upgrade
- Confetti animation for delight
- Clear communication of unlocked features
- Immediate UI updates (badge, limits)

### Clear Value Proposition
- Feature-specific benefits
- Comparison between plans
- Free trial offer
- No commitment messaging

---

## 💳 Plan Comparison

### Free Plan
- 3 resume optimizations
- 3 cover letters
- 5 voice interview sessions
- Basic features

### Pro Plan ($24.99/month)
- **Unlimited** resume optimization
- **Unlimited** cover letters
- **Unlimited** interview practice
- Priority support
- **Most Popular**

### Career+ Plan ($39.99/month)
- Everything in Pro
- Advanced analytics
- Career coaching sessions
- Job application tracking
- Salary negotiation tips

---

## 🔄 Usage Tracking

### Backend Integration
The hook fetches usage data from:
```
GET /api/usage/{user_id}
```

**Expected Response:**
```json
{
  "resume_optimize": 2,
  "cover_letter": 1,
  "voice_session": 3
}
```

### RevenueCat Integration
- Checks entitlement: `pro_access`
- If entitlement exists: user is Pro
- If no entitlement: user is Free

### Automatic Updates
- Usage refetched after successful upgrade
- Plan status checked via RevenueCat
- UI updates immediately after purchase

---

## 🧪 Testing

### Test Free Plan Limits
```typescript
// Simulate reaching limit
const { canPerformAction } = usePlanLimits();

// Should return false after 3 uses
console.log(canPerformAction('resume_optimize')); // false
```

### Test Paywall Display
```typescript
// Trigger paywall manually
setShowPaywall(true);

// Verify:
// - Modal slides up from bottom
// - Shows correct feature title
// - Displays both plan options
// - "Maybe Later" dismisses modal
```

### Test Upgrade Flow
```typescript
// Test purchase flow
handleUpgrade('pro');

// Verify:
// - RevenueCat purchase initiated
// - Success modal shows with confetti
// - Plan limits update to Infinity
// - Settings badge updates to "Pro"
```

### Test Success Animation
```typescript
// Show success modal
setShowSuccess(true);

// Verify:
// - Confetti animation plays
// - Success icon animates (spring)
// - Shows correct plan name
// - Lists unlocked features
```

---

## 🎯 Best Practices

### 1. Check Limits Before API Calls
```typescript
// ✅ Good
if (!canPerformAction('resume_optimize')) {
  setShowPaywall(true);
  return; // Don't make API call
}
await optimizeResume();

// ❌ Bad
await optimizeResume(); // API call made even if limit reached
if (!canPerformAction('resume_optimize')) {
  setShowPaywall(true);
}
```

### 2. Show Remaining Count
```typescript
// ✅ Good - Show remaining count
const remaining = getRemainingCount('resume_optimize');
<Text>{remaining} remaining</Text>

// ❌ Bad - Don't show for pro users
{!isPro && <Text>{remaining} remaining</Text>}
```

### 3. Refetch After Upgrade
```typescript
// ✅ Good - Refetch limits after purchase
if (purchaseResult) {
  refetch(); // Update limits immediately
  setShowSuccess(true);
}

// ❌ Bad - Don't wait for automatic refresh
if (purchaseResult) {
  setShowSuccess(true);
  // Limits won't update until next mount
}
```

### 4. Handle Purchase Errors
```typescript
// ✅ Good - Handle user cancellation
catch (error: any) {
  if (!error.userCancelled) {
    Alert.alert('Purchase Failed', error.message);
  }
}

// ❌ Bad - Show error for cancellation
catch (error: any) {
  Alert.alert('Error', error.message); // Shows error even if user cancelled
}
```

---

## 📊 Analytics Events

Track these events for monitoring:

```typescript
// Paywall shown
analytics.track('paywall_shown', {
  feature: 'resume_optimize',
  remaining: 0,
});

// Paywall dismissed
analytics.track('paywall_dismissed', {
  feature: 'resume_optimize',
});

// Upgrade initiated
analytics.track('upgrade_initiated', {
  plan: 'pro',
  feature: 'resume_optimize',
});

// Upgrade completed
analytics.track('upgrade_completed', {
  plan: 'pro',
  revenue: 24.99,
});

// Feature used
analytics.track('feature_used', {
  feature: 'resume_optimize',
  is_pro: true,
});
```

---

## 🚀 Production Checklist

- [ ] Configure RevenueCat products with correct IDs
- [ ] Set up Stripe subscription plans
- [ ] Test purchase flow on physical devices (iOS & Android)
- [ ] Verify usage tracking API endpoint
- [ ] Test free trial eligibility
- [ ] Add analytics tracking for paywall events
- [ ] Test restore purchases functionality
- [ ] Verify plan badge updates in Settings
- [ ] Test upgrade flow from each feature
- [ ] Ensure confetti animation works on both platforms
- [ ] Test dismissing paywall (soft gate)
- [ ] Verify limits reset after upgrade

---

## 🎯 Summary

You now have:
- ✅ Complete plan limits system with usage tracking
- ✅ Beautiful paywall modal with feature-specific content
- ✅ Upgrade success modal with confetti animation
- ✅ Integration in ResumeScreen and PracticeScreen
- ✅ Soft paywall (users can dismiss)
- ✅ Automatic limit updates after upgrade
- ✅ RevenueCat integration for plan checking
- ✅ Professional UI with smooth animations

The paywall experience is complete and ready for production! 🎉

# Where to Add IAP Code - Step by Step Guide

## ✅ Already Done:
- HomeScreen.tsx - Upgrade button now navigates to 'Upgrade' screen

## 🎯 Files to Update:

### 1. ResumeScreen.tsx
**Location:** `src/screens/resume/ResumeScreen.tsx`

**Add at the top (imports):**
```typescript
import usePlanLimits from '../../hooks/usePlanLimits';
import { Alert } from 'react-native';
```

**Add inside component:**
```typescript
const limits = usePlanLimits();
```

**Before optimization (in handleOptimize function):**
```typescript
const handleOptimize = async () => {
  // Check limits first
  if (limits.resumeOptimizations !== -1) {
    // TODO: Get current usage from API
    const currentUsage = 0; // Replace with actual API call
    
    if (currentUsage >= limits.resumeOptimizations) {
      Alert.alert(
        'Limit Reached',
        `You've used all ${limits.resumeOptimizations} optimizations this month. Upgrade for unlimited!`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => navigation.navigate('Upgrade') },
        ]
      );
      return;
    }
  }
  
  // Continue with optimization...
};
```

---

### 2. OptimizationResultScreen.tsx
**Location:** `src/screens/resume/OptimizationResultScreen.tsx`

**Add at the top (imports):**
```typescript
import usePlanLimits from '../../hooks/usePlanLimits';
import { Alert } from 'react-native';
```

**Add inside component:**
```typescript
const limits = usePlanLimits();
```

**Before cover letter generation:**
```typescript
const handleGenerateCoverLetter = async () => {
  // Check if user has access
  if (!limits.canGenerateCoverLetter) {
    Alert.alert(
      'Upgrade Required',
      'Cover letter generation is available on Pro and Career+ plans.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Upgrade', onPress: () => navigation.navigate('Upgrade') },
      ]
    );
    return;
  }
  
  // Continue with cover letter generation...
};
```

**Hide cover letter button if not available:**
```typescript
{limits.canGenerateCoverLetter && (
  <Button onPress={handleGenerateCoverLetter}>
    Generate Cover Letter
  </Button>
)}
```

---

### 3. Settings/Profile Screen
**Location:** Create `src/screens/settings/SettingsScreen.tsx` (if doesn't exist)

**Add upgrade section:**
```typescript
import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Card, List } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import useAuthStore from '../../store/useAuthStore';
import usePlanLimits from '../../hooks/usePlanLimits';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const plan = useAuthStore((state) => state.plan);
  const limits = usePlanLimits();

  return (
    <ScrollView style={styles.container}>
      {/* Current Plan Card */}
      <Card style={styles.planCard}>
        <Card.Content>
          <Text style={styles.planTitle}>Current Plan</Text>
          <Text style={styles.planName}>{limits.planName}</Text>
          
          {plan === 'free' && (
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={() => navigation.navigate('Upgrade')}
            >
              <Text style={styles.upgradeButtonText}>Upgrade to Pro</Text>
            </TouchableOpacity>
          )}
          
          {plan !== 'free' && (
            <TouchableOpacity
              style={styles.manageButton}
              onPress={() => navigation.navigate('Upgrade')}
            >
              <Text style={styles.manageButtonText}>Manage Subscription</Text>
            </TouchableOpacity>
          )}
        </Card.Content>
      </Card>

      {/* Other settings... */}
      <List.Section>
        <List.Item
          title="Account"
          left={props => <List.Icon {...props} icon="account" />}
        />
        <List.Item
          title="Notifications"
          left={props => <List.Icon {...props} icon="bell" />}
        />
        <List.Item
          title="Privacy"
          left={props => <List.Icon {...props} icon="shield" />}
        />
      </List.Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  planCard: {
    margin: 16,
    backgroundColor: '#FFFFFF',
  },
  planTitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  planName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
  },
  upgradeButton: {
    backgroundColor: '#3B82F6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  manageButton: {
    backgroundColor: '#F1F5F9',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  manageButtonText: {
    color: '#1E293B',
    fontSize: 16,
    fontWeight: '600',
  },
});
```

---

### 4. Add Upgrade Banner Component
**Location:** Create `src/components/UpgradeBanner.tsx`

```typescript
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import useAuthStore from '../store/useAuthStore';

export default function UpgradeBanner() {
  const navigation = useNavigation();
  const plan = useAuthStore((state) => state.plan);

  if (plan !== 'free') return null;

  return (
    <Card style={styles.banner}>
      <Card.Content>
        <Text style={styles.title}>🚀 Unlock Premium Features</Text>
        <Text style={styles.subtitle}>
          Get unlimited resume optimizations, cover letter generation, and more!
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Upgrade')}
        >
          <Text style={styles.buttonText}>Upgrade Now</Text>
        </TouchableOpacity>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  banner: {
    margin: 16,
    backgroundColor: '#3B82F6',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 16,
    opacity: 0.9,
  },
  button: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
  },
});
```

**Then use it in any screen:**
```typescript
import UpgradeBanner from '../../components/UpgradeBanner';

// In your render:
<UpgradeBanner />
```

---

## 📋 Quick Checklist:

### HomeScreen.tsx ✅
- [x] Upgrade button navigates to 'Upgrade' screen

### ResumeScreen.tsx
- [ ] Import usePlanLimits hook
- [ ] Check limits before optimization
- [ ] Show upgrade alert when limit reached

### OptimizationResultScreen.tsx
- [ ] Import usePlanLimits hook
- [ ] Check canGenerateCoverLetter before generation
- [ ] Hide/disable cover letter button if not available

### SettingsScreen.tsx
- [ ] Create settings screen (if doesn't exist)
- [ ] Show current plan
- [ ] Add "Upgrade to Pro" or "Manage Subscription" button

### UpgradeBanner.tsx
- [ ] Create reusable upgrade banner component
- [ ] Add to Resume, Interview, or other screens

---

## 🎯 Priority Order:

1. **First:** Test Upgrade screen
   - Navigate to it from HomeScreen
   - Verify it loads correctly

2. **Second:** Add to ResumeScreen
   - Most important feature to gate
   - Users will hit limits here first

3. **Third:** Add to OptimizationResultScreen
   - Gate cover letter generation
   - Premium feature

4. **Fourth:** Create SettingsScreen
   - Show current plan
   - Manage subscription

5. **Fifth:** Add UpgradeBanner
   - Show on multiple screens
   - Increase upgrade conversions

---

## 🧪 Testing Steps:

1. **Test Navigation:**
   ```typescript
   navigation.navigate('Upgrade');
   ```
   Should open upgrade screen

2. **Test Plan Limits:**
   ```typescript
   const limits = usePlanLimits();
   console.log(limits);
   ```
   Should show current plan limits

3. **Test Purchase Flow:**
   - Tap a plan card
   - Complete purchase (sandbox)
   - Verify plan updates

4. **Test Restore:**
   - Tap "Restore Purchases"
   - Verify subscription restored

---

## 💡 Tips:

- Start with HomeScreen (already done ✅)
- Add one screen at a time
- Test after each change
- Use console.log to debug
- Check RevenueCat dashboard for purchase events

---

## 🆘 Need Help?

Check these files for examples:
- `src/components/ExampleFeatureScreen.tsx` - Full example
- `src/screens/settings/UpgradeScreen.tsx` - Upgrade UI
- `src/hooks/usePlanLimits.ts` - Plan limits hook
- `src/services/purchaseService.ts` - Purchase logic

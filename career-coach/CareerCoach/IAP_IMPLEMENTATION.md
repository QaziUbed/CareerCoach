# In-App Purchases Implementation Summary

## Overview
Complete RevenueCat integration for in-app purchases with 3 subscription tiers: Job Seeker ($14.99), Pro ($24.99), and Career+ ($39.99).

## Files Created

### 1. purchaseService.ts (`src/services/purchaseService.ts`)
**Core RevenueCat service with methods:**
- `initialize(userId)` - Configure RevenueCat SDK with user ID
- `getOfferings()` - Fetch available subscription packages
- `purchasePackage(pkg)` - Purchase a subscription package
- `restorePurchases()` - Restore previous purchases
- `checkEntitlement(id)` - Check if user has active entitlement
- `hasProAccess()` - Check if user has 'pro_access' entitlement
- `getActivePlan()` - Get current subscription plan name
- `getCustomerInfo()` - Get customer info from RevenueCat
- `logout()` - Logout user from RevenueCat

**Key Features:**
- Handles user cancellation gracefully (no error shown)
- Debug logging in development mode
- Platform-specific API keys (iOS/Android)
- Singleton pattern for global access

### 2. UpgradeScreen.tsx (`src/screens/settings/UpgradeScreen.tsx`)
**Full-featured subscription screen with:**
- Hero section with title and subtitle
- 3 plan cards with features and pricing
- "Most Popular" badge on Pro plan
- Real-time pricing from RevenueCat
- Purchase flow with loading states
- Restore Purchases button
- Terms of Service and Privacy Policy links
- Auto-renewal disclaimer

**Plan Features:**
- **Job Seeker ($14.99/mo):**
  - 10 resume optimizations/month
  - ATS score analysis
  - Interview question prep
  - Job application tracking

- **Pro ($24.99/mo) - MOST POPULAR:**
  - Unlimited resume optimizations
  - ATS score analysis
  - Interview question prep
  - Job application tracking
  - Cover letter generation

- **Career+ ($39.99/mo):**
  - Everything in Pro
  - Priority support
  - Career coaching sessions
  - LinkedIn profile optimization
  - Salary negotiation guide

**Purchase Flow:**
1. User taps plan card
2. RevenueCat handles payment
3. Backend API updated with new plan
4. Zustand store updated
5. Success alert shown
6. Navigate back to previous screen

### 3. usePlanLimits.ts (`src/hooks/usePlanLimits.ts`)
**Custom hook that checks RevenueCat entitlements:**
- Returns plan limits based on active subscription
- Checks RevenueCat first (source of truth)
- Falls back to Zustand store if RevenueCat fails
- Handles loading states

**Plan Limits:**
```typescript
{
  resumeOptimizations: number; // -1 = unlimited
  canGenerateCoverLetter: boolean;
  canAccessInterviewPrep: boolean;
  canTrackApplications: boolean;
  canAccessPrioritySupport: boolean;
  canAccessCoaching: boolean;
  planName: string;
  isLoading: boolean;
}
```

## Files Updated

### 1. App.tsx
- Added RevenueCat initialization on user login
- Initializes with user.id when available
- Handles initialization errors gracefully

### 2. navigation/types.ts
- Added `Upgrade: undefined` to RootStackParamList

### 3. navigation/AppNavigator.tsx
- Registered Upgrade screen
- No header (uses custom header in screen)

### 4. .env
- Added `EXPO_PUBLIC_REVENUECAT_IOS_KEY`
- Added `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`

## RevenueCat Setup Required

### 1. Create RevenueCat Account
1. Go to https://www.revenuecat.com/
2. Create a new project
3. Add your app (iOS and/or Android)

### 2. Configure Products
Create 3 products in RevenueCat:
- `job_seeker_monthly` - $14.99/month
- `pro_monthly` - $24.99/month
- `career_plus_monthly` - $39.99/month

### 3. Create Entitlement
- Entitlement ID: `pro_access`
- Attach all 3 products to this entitlement

### 4. Get API Keys
1. Go to Project Settings
2. Copy iOS API Key
3. Copy Android API Key
4. Add to `.env` file

### 5. Configure Offerings
Create an offering with all 3 packages:
- Package identifiers should match plan IDs
- Set Pro as default/featured package

## App Store Connect / Google Play Setup

### iOS (App Store Connect)
1. Create in-app purchase products
2. Product IDs must match RevenueCat product IDs
3. Set pricing to match ($14.99, $24.99, $39.99)
4. Submit for review

### Android (Google Play Console)
1. Create subscription products
2. Product IDs must match RevenueCat product IDs
3. Set pricing to match
4. Publish products

## Usage Examples

### Navigate to Upgrade Screen
```typescript
import { useNavigation } from '@react-navigation/native';

const navigation = useNavigation();
navigation.navigate('Upgrade');
```

### Check Plan Limits
```typescript
import usePlanLimits from '../hooks/usePlanLimits';

function MyComponent() {
  const limits = usePlanLimits();
  
  if (limits.isLoading) {
    return <Loading />;
  }
  
  if (limits.resumeOptimizations === -1) {
    // Unlimited
  } else {
    // Show count: limits.resumeOptimizations
  }
  
  if (limits.canGenerateCoverLetter) {
    // Show cover letter feature
  }
}
```

### Check Entitlement Directly
```typescript
import purchaseService from '../services/purchaseService';

const hasAccess = await purchaseService.hasProAccess();
if (hasAccess) {
  // User has paid subscription
}
```

## Testing

### Test Purchases (Sandbox)
1. **iOS:** Create sandbox tester in App Store Connect
2. **Android:** Add test account in Google Play Console
3. Use test account to make purchases
4. Purchases won't charge real money

### Test Restore
1. Make a purchase with test account
2. Delete and reinstall app
3. Tap "Restore Purchases"
4. Subscription should be restored

## Error Handling

### User Cancels Purchase
- No error alert shown
- Returns silently to upgrade screen

### Purchase Fails
- Alert shown: "Purchase Failed"
- User can retry

### Restore Fails
- Alert shown: "Restore Failed"
- User can retry

### No Purchases Found
- Alert shown: "No Purchases Found"
- User stays on upgrade screen

## Backend Integration

### Update Profile Endpoint
The upgrade flow calls:
```typescript
await patch('/api/profile', { plan: 'pro' });
```

Ensure your backend accepts plan updates and stores them in the database.

## Security Notes

1. **Never trust client-side plan checks alone**
   - Always verify entitlements on backend
   - Use RevenueCat webhooks for real-time updates

2. **Validate receipts on backend**
   - Use RevenueCat REST API to verify purchases
   - Don't rely solely on client-reported plan

3. **Handle subscription lifecycle**
   - Renewals
   - Cancellations
   - Refunds
   - Billing issues

## Next Steps

1. **Set up RevenueCat account and products**
2. **Configure App Store Connect / Google Play**
3. **Add RevenueCat API keys to .env**
4. **Test purchases in sandbox**
5. **Implement backend verification**
6. **Set up RevenueCat webhooks**
7. **Add analytics tracking**
8. **Test restore purchases flow**
9. **Submit for app store review**

## Dependencies

Already installed:
- `react-native-purchases` (v9.12.0)

No additional installation needed!

## Notes

- RevenueCat handles all platform-specific purchase logic
- Subscriptions auto-renew unless cancelled
- Users can manage subscriptions in App Store/Play Store
- RevenueCat provides analytics dashboard
- Supports promotional offers and trials
- Handles receipt validation automatically

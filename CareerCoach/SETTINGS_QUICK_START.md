# SettingsScreen - Quick Reference

## ✅ Complete Implementation

File: `src/screens/settings/SettingsScreen.tsx`

## 🎯 Features

### Profile Section
- Avatar with initials
- Name and email
- Plan badge (color-coded)
- Edit profile button

### Subscription Management
**Free Users:**
- Upgrade banner with benefits
- "Upgrade to Pro" button

**Paid Users:**
- Current plan with features
- "Manage Subscription" button
- Opens Stripe Customer Portal

### Usage Tracking (Free Plan)
- Resume optimizations progress
- Cover letters progress
- Voice sessions progress
- Color-coded bars (green/orange/red)

### App Section
- Rate App
- Share App
- Privacy Policy
- Terms of Service
- App Version

### Danger Zone
- Sign Out (with confirmation)
- Delete Account (double confirmation)

## 🚀 Quick Start

### 1. Add to Navigation

If using Tab Navigator:
```typescript
import SettingsScreen from './src/screens/settings/SettingsScreen';

<Tab.Screen 
  name="Settings" 
  component={SettingsScreen}
  options={{
    tabBarIcon: ({ color }) => <Icon name="cog" color={color} />,
    tabBarLabel: 'Settings',
  }}
/>
```

If using Stack Navigator:
```typescript
<Stack.Screen 
  name="Settings" 
  component={SettingsScreen}
  options={{ title: 'Settings' }}
/>
```

### 2. Navigate to Settings
```typescript
navigation.navigate('Settings');
```

### 3. Update Store URLs

Open `SettingsScreen.tsx` and update:

```typescript
// Line ~90
const storeUrl = Platform.select({
  ios: 'https://apps.apple.com/app/idYOUR_APP_ID',  // Replace with your App Store ID
  android: 'https://play.google.com/store/apps/details?id=YOUR_PACKAGE_NAME',  // Replace with your package name
});
```

### 4. Update External Links

```typescript
// Privacy Policy (Line ~110)
Linking.openURL('https://yourapp.com/privacy');

// Terms of Service (Line ~114)
Linking.openURL('https://yourapp.com/terms');

// Share message (Line ~100)
message: 'Check out Career Coach!',
url: 'https://yourapp.com',
```

## 📊 API Endpoints Used

### GET `/api/usage/stats`
Returns usage statistics:
```json
{
  "resume_optimize": 2,
  "cover_letter": 1,
  "voice_sessions": 3
}
```

### POST `/api/billing/create-portal-session`
Returns Stripe portal URL:
```json
{
  "url": "https://billing.stripe.com/session/..."
}
```

### DELETE `/api/profile`
Deletes user account (requires confirmation)

## 🎨 Customization

### Change Plan Badge Colors
```typescript
// Line ~65
const colors = {
  free: '#94A3B8',        // Gray
  job_seeker: '#3B82F6',  // Blue
  pro: '#8B5CF6',         // Purple
  career_plus: '#F59E0B', // Orange
};
```

### Change Usage Progress Colors
```typescript
// Line ~195
if (percentage >= 90) return '#EF4444'; // Red
if (percentage >= 70) return '#F59E0B'; // Orange
return '#10B981'; // Green
```

### Modify Usage Limits (Free Plan)
```typescript
// Line ~340 - Cover Letters
{usageStats.cover_letter || 0}/3

// Line ~360 - Voice Sessions
{usageStats.voice_sessions || 0}/5
```

## 🧪 Testing

### Test Manage Subscription
1. Sign in with paid account
2. Tap "Manage Subscription"
3. Should open Stripe portal in browser
4. Verify you can manage subscription

### Test Usage Bars
1. Sign in with free account
2. Use some features (optimize resume, etc.)
3. Go to Settings
4. Verify progress bars show correct usage
5. Check colors change based on usage

### Test Sign Out
1. Tap "Sign Out"
2. Confirm in dialog
3. Should redirect to login screen

### Test Delete Account
1. Tap "Delete Account"
2. Confirm first dialog
3. Confirm second dialog
4. Account should be deleted
5. Should redirect to login

## 🐛 Troubleshooting

### Stripe Portal Not Opening
- Check `STRIPE_SECRET_KEY` in backend `.env`
- Verify user has `stripe_customer_id` in database
- Check backend logs for errors

### Usage Stats Not Loading
- Verify `/api/usage/stats` endpoint is working
- Check network tab for API errors
- Ensure user is authenticated

### App Version Not Showing
- Check `expo-constants` is installed (comes with expo)
- Verify `version` is set in `app.json` or `app.config.js`

### Store Links Not Working
- Update App Store ID and package name
- Test on actual device (not simulator)
- Verify URLs are correct

## 📝 Checklist

Before deploying:
- [ ] Update App Store ID
- [ ] Update Play Store package name
- [ ] Update privacy policy URL
- [ ] Update terms of service URL
- [ ] Update share message and URL
- [ ] Test manage subscription flow
- [ ] Test sign out
- [ ] Test delete account
- [ ] Verify usage stats display
- [ ] Test on iOS and Android

## 🎉 You're Done!

Your SettingsScreen is complete with:
- ✅ Profile management
- ✅ Subscription handling
- ✅ Usage tracking
- ✅ App information
- ✅ Account management

Just add to navigation and customize the URLs! 🚀

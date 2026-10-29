# Theme System Documentation

## Overview

A complete, consistent theme system for the Career Coach React Native app with reusable UI components.

## 📁 File Structure

```
src/
├── utils/
│   └── theme.ts          # Theme constants and helpers
└── components/
    └── ui/
        ├── Button.tsx         # Button component
        ├── Card.tsx           # Card wrapper
        ├── Badge.tsx          # Colored pill badges
        ├── ScoreCircle.tsx    # Circular score display
        ├── Input.tsx          # Styled text input
        ├── LoadingScreen.tsx  # Full screen loading
        └── index.ts           # Export all components
```

---

## 🎨 Theme Constants

### Colors

```typescript
import { COLORS } from '../utils/theme';

// Brand Colors
COLORS.primary          // #2563EB - Main brand blue
COLORS.primaryDark      // #1D4ED8 - Darker blue for press states
COLORS.secondary        // #0D9488 - Teal for success/positive

// Status Colors
COLORS.danger           // #DC2626 - Red for errors
COLORS.warning          // #EA580C - Orange for warnings
COLORS.success          // #16A34A - Green for success

// Background Colors
COLORS.background       // #FFFFFF - White
COLORS.surface          // #F8FAFC - Light gray surface
COLORS.border           // #E2E8F0 - Border color

// Text Colors
COLORS.textPrimary      // #0F172A - Near black
COLORS.textSecondary    // #475569 - Medium gray
COLORS.textMuted        // #94A3B8 - Light gray

// Score Colors
COLORS.scoreHigh        // #16A34A - Score 70+
COLORS.scoreMid         // #EA580C - Score 40-69
COLORS.scoreLow         // #DC2626 - Score <40

// Opacity Variants
COLORS.primaryLight     // #2563EB20 - 20% opacity
COLORS.successLight     // #16A34A20 - 20% opacity
// ... etc
```

### Typography

```typescript
import { TYPOGRAPHY } from '../utils/theme';

// Font Sizes
TYPOGRAPHY.fontSizes.xs      // 11
TYPOGRAPHY.fontSizes.sm      // 13
TYPOGRAPHY.fontSizes.md      // 15
TYPOGRAPHY.fontSizes.lg      // 17
TYPOGRAPHY.fontSizes.xl      // 20
TYPOGRAPHY.fontSizes.xxl     // 24
TYPOGRAPHY.fontSizes.xxxl    // 32

// Font Weights
TYPOGRAPHY.fontWeights.regular    // '400'
TYPOGRAPHY.fontWeights.medium     // '500'
TYPOGRAPHY.fontWeights.semibold   // '600'
TYPOGRAPHY.fontWeights.bold       // '700'

// Line Heights
TYPOGRAPHY.lineHeights.tight      // 1.2
TYPOGRAPHY.lineHeights.normal     // 1.5
TYPOGRAPHY.lineHeights.relaxed    // 1.75
```

### Spacing

```typescript
import { SPACING } from '../utils/theme';

SPACING.xs      // 4
SPACING.sm      // 8
SPACING.md      // 12
SPACING.lg      // 16
SPACING.xl      // 24
SPACING.xxl     // 32
SPACING.xxxl    // 48
```

### Border Radius

```typescript
import { RADIUS } from '../utils/theme';

RADIUS.sm       // 6
RADIUS.md       // 10
RADIUS.lg       // 14
RADIUS.xl       // 20
RADIUS.full     // 999
```

### Shadows

```typescript
import { SHADOWS } from '../utils/theme';

SHADOWS.small   // Subtle shadow
SHADOWS.medium  // Medium shadow
SHADOWS.large   // Large shadow
```

### Helper Functions

```typescript
import { getScoreColor, getScoreBackgroundColor } from '../utils/theme';

// Get color based on score
const color = getScoreColor(85);  // Returns COLORS.scoreHigh

// Get background color based on score
const bgColor = getScoreBackgroundColor(85);  // Returns COLORS.successLight
```

---

## 🧩 UI Components

### Button

Multiple variants with loading states.

```typescript
import { Button } from '../components/ui';

// Primary button
<Button 
  title="Submit" 
  onPress={handleSubmit}
/>

// Variants
<Button title="Secondary" variant="secondary" onPress={...} />
<Button title="Outline" variant="outline" onPress={...} />
<Button title="Ghost" variant="ghost" onPress={...} />
<Button title="Danger" variant="danger" onPress={...} />

// Sizes
<Button title="Small" size="small" onPress={...} />
<Button title="Medium" size="medium" onPress={...} />
<Button title="Large" size="large" onPress={...} />

// States
<Button title="Loading" loading onPress={...} />
<Button title="Disabled" disabled onPress={...} />
<Button title="Full Width" fullWidth onPress={...} />

// Custom styles
<Button 
  title="Custom" 
  onPress={...}
  style={{ marginTop: 20 }}
  textStyle={{ fontSize: 18 }}
/>
```

**Props:**
- `title` (string, required) - Button text
- `onPress` (function, required) - Press handler
- `variant` ('primary' | 'secondary' | 'outline' | 'ghost' | 'danger') - Button style
- `size` ('small' | 'medium' | 'large') - Button size
- `loading` (boolean) - Show loading spinner
- `disabled` (boolean) - Disable button
- `fullWidth` (boolean) - Take full width
- `style` (ViewStyle) - Custom container style
- `textStyle` (TextStyle) - Custom text style

---

### Card

Wrapper component with consistent styling.

```typescript
import { Card } from '../components/ui';

// Basic card
<Card>
  <Text>Card content</Text>
</Card>

// Custom padding
<Card padding="xl">
  <Text>More padding</Text>
</Card>

// No padding
<Card noPadding>
  <Image source={...} />
</Card>

// No shadow
<Card noShadow>
  <Text>Flat card</Text>
</Card>

// Custom style
<Card style={{ marginBottom: 20 }}>
  <Text>Custom card</Text>
</Card>
```

**Props:**
- `children` (ReactNode, required) - Card content
- `style` (ViewStyle) - Custom style
- `padding` ('xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl') - Padding size
- `noPadding` (boolean) - Remove padding
- `noShadow` (boolean) - Remove shadow

---

### Badge

Colored pill badges for status indicators.

```typescript
import { Badge } from '../components/ui';

// Variants
<Badge label="Primary" variant="primary" />
<Badge label="Secondary" variant="secondary" />
<Badge label="Success" variant="success" />
<Badge label="Warning" variant="warning" />
<Badge label="Danger" variant="danger" />
<Badge label="Neutral" variant="neutral" />

// Sizes
<Badge label="Small" size="small" />
<Badge label="Medium" size="medium" />
<Badge label="Large" size="large" />

// Custom styles
<Badge 
  label="Custom" 
  style={{ marginRight: 10 }}
  textStyle={{ fontSize: 14 }}
/>
```

**Props:**
- `label` (string, required) - Badge text
- `variant` ('primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'neutral') - Badge color
- `size` ('small' | 'medium' | 'large') - Badge size
- `style` (ViewStyle) - Custom container style
- `textStyle` (TextStyle) - Custom text style

---

### ScoreCircle

Circular score display with color-coded values.

```typescript
import { ScoreCircle } from '../components/ui';

// Basic usage
<ScoreCircle score={85} />

// Custom size
<ScoreCircle score={65} size={120} />

// Without label
<ScoreCircle score={45} showLabel={false} />

// Custom label
<ScoreCircle score={90} label="Match Score" />

// Custom style
<ScoreCircle 
  score={75} 
  style={{ marginVertical: 20 }}
/>
```

**Props:**
- `score` (number, required) - Score value (0-100)
- `size` (number) - Circle diameter (default: 100)
- `showLabel` (boolean) - Show label below circle (default: true)
- `label` (string) - Label text (default: 'ATS Score')
- `style` (ViewStyle) - Custom container style

**Color Logic:**
- Score >= 70: Green (success)
- Score 40-69: Orange (warning)
- Score < 40: Red (danger)

---

### Input

Styled text input with label and error states.

```typescript
import { Input } from '../components/ui';

// Basic input
<Input 
  label="Email"
  placeholder="Enter your email"
  value={email}
  onChangeText={setEmail}
/>

// With error
<Input 
  label="Password"
  error="Password is required"
  value={password}
  onChangeText={setPassword}
  secureTextEntry
/>

// With helper text
<Input 
  label="Username"
  helperText="Must be at least 3 characters"
  value={username}
  onChangeText={setUsername}
/>

// Multiline
<Input 
  label="Description"
  multiline
  numberOfLines={4}
  value={description}
  onChangeText={setDescription}
/>

// Custom styles
<Input 
  label="Custom"
  containerStyle={{ marginBottom: 30 }}
  style={{ fontSize: 18 }}
/>
```

**Props:**
- All TextInput props
- `label` (string) - Input label
- `error` (string) - Error message
- `helperText` (string) - Helper text below input
- `containerStyle` (ViewStyle) - Custom container style

---

### LoadingScreen

Full screen loading indicator.

```typescript
import { LoadingScreen } from '../components/ui';

// Basic loading
<LoadingScreen />

// With message
<LoadingScreen message="Loading your data..." />

// Conditional rendering
{loading && <LoadingScreen message="Please wait..." />}
```

**Props:**
- `message` (string) - Optional loading message

---

## 📖 Usage Examples

### Example 1: Login Screen

```typescript
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Input, Button, Card } from '../components/ui';
import { SPACING, COLORS } from '../utils/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  return (
    <View style={styles.container}>
      <Card>
        <Input 
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Input 
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <Button 
          title="Sign In"
          onPress={handleLogin}
          loading={loading}
          fullWidth
        />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.xl,
    backgroundColor: COLORS.surface,
  },
});
```

### Example 2: Score Display

```typescript
import React from 'react';
import { View } from 'react-native';
import { ScoreCircle, Badge, Card } from '../components/ui';
import { SPACING } from '../utils/theme';

export default function ScoreCard({ score, keywords }) {
  return (
    <Card>
      <ScoreCircle score={score} />
      <View style={{ marginTop: SPACING.lg }}>
        {keywords.map((keyword, index) => (
          <Badge 
            key={index}
            label={keyword}
            variant="success"
            size="small"
          />
        ))}
      </View>
    </Card>
  );
}
```

### Example 3: Action Buttons

```typescript
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button } from '../components/ui';
import { SPACING } from '../utils/theme';

export default function ActionButtons() {
  return (
    <View style={styles.container}>
      <Button 
        title="Save"
        variant="primary"
        onPress={handleSave}
      />
      <Button 
        title="Cancel"
        variant="outline"
        onPress={handleCancel}
      />
      <Button 
        title="Delete"
        variant="danger"
        onPress={handleDelete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
});
```

---

## 🎯 Migration Guide

### Before (Old Style)

```typescript
<TouchableOpacity 
  style={{
    backgroundColor: '#2563EB',
    padding: 12,
    borderRadius: 8,
  }}
  onPress={handlePress}
>
  <Text style={{ color: '#FFFFFF', fontSize: 16 }}>
    Submit
  </Text>
</TouchableOpacity>
```

### After (Theme System)

```typescript
<Button 
  title="Submit"
  onPress={handlePress}
/>
```

---

## ✅ Benefits

1. **Consistency** - Same look and feel across the app
2. **Maintainability** - Change colors/spacing in one place
3. **Reusability** - Use components everywhere
4. **Type Safety** - TypeScript support
5. **Accessibility** - Proper touch targets and contrast
6. **Performance** - Optimized components
7. **Developer Experience** - Easy to use and understand

---

## 🚀 Next Steps

1. Update existing screens to use theme components
2. Add more variants as needed
3. Create additional components (Modal, Dropdown, etc.)
4. Add dark mode support
5. Add animation utilities
6. Create Storybook for component documentation

---

## 📝 Checklist

- [x] Theme constants (colors, typography, spacing)
- [x] Button component with variants
- [x] Card wrapper component
- [x] Badge component
- [x] ScoreCircle component
- [x] Input component
- [x] LoadingScreen component
- [x] Export all components
- [x] Documentation
- [ ] Update all screens to use theme
- [ ] Add dark mode
- [ ] Add more components

---

## 🎉 Summary

Complete theme system with:
- ✅ Comprehensive color palette
- ✅ Typography scale
- ✅ Spacing system
- ✅ Border radius values
- ✅ Shadow utilities
- ✅ 6 reusable UI components
- ✅ Helper functions
- ✅ Full TypeScript support
- ✅ Documentation and examples

Ready to use throughout the app!

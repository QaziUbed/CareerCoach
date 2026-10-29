# Theme System - Quick Reference

## 🎨 Import Theme

```typescript
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../utils/theme';
import { Button, Card, Badge, ScoreCircle, Input, LoadingScreen } from '../components/ui';
```

## 🎯 Quick Examples

### Button
```typescript
<Button title="Submit" onPress={handleSubmit} />
<Button title="Cancel" variant="outline" onPress={handleCancel} />
<Button title="Delete" variant="danger" loading onPress={handleDelete} />
```

### Card
```typescript
<Card>
  <Text>Content</Text>
</Card>
```

### Badge
```typescript
<Badge label="Active" variant="success" />
<Badge label="Pending" variant="warning" />
```

### ScoreCircle
```typescript
<ScoreCircle score={85} />
```

### Input
```typescript
<Input 
  label="Email"
  value={email}
  onChangeText={setEmail}
  error={emailError}
/>
```

### LoadingScreen
```typescript
<LoadingScreen message="Loading..." />
```

## 🎨 Colors

```typescript
COLORS.primary          // #2563EB
COLORS.success          // #16A34A
COLORS.danger           // #DC2626
COLORS.warning          // #EA580C
COLORS.textPrimary      // #0F172A
COLORS.textSecondary    // #475569
COLORS.surface          // #F8FAFC
COLORS.border           // #E2E8F0
```

## 📏 Spacing

```typescript
SPACING.xs      // 4
SPACING.sm      // 8
SPACING.md      // 12
SPACING.lg      // 16
SPACING.xl      // 24
SPACING.xxl     // 32
```

## 🔤 Typography

```typescript
TYPOGRAPHY.fontSizes.xs      // 11
TYPOGRAPHY.fontSizes.sm      // 13
TYPOGRAPHY.fontSizes.md      // 15
TYPOGRAPHY.fontSizes.lg      // 17
TYPOGRAPHY.fontSizes.xl      // 20
TYPOGRAPHY.fontSizes.xxl     // 24
TYPOGRAPHY.fontSizes.xxxl    // 32
```

## 📐 Border Radius

```typescript
RADIUS.sm       // 6
RADIUS.md       // 10
RADIUS.lg       // 14
RADIUS.xl       // 20
RADIUS.full     // 999
```

## 🌑 Shadows

```typescript
SHADOWS.small
SHADOWS.medium
SHADOWS.large
```

## 🎯 Common Patterns

### Form
```typescript
<Card>
  <Input label="Name" value={name} onChangeText={setName} />
  <Input label="Email" value={email} onChangeText={setEmail} />
  <Button title="Submit" onPress={handleSubmit} fullWidth />
</Card>
```

### Status Badge
```typescript
<Badge 
  label={status} 
  variant={status === 'active' ? 'success' : 'warning'} 
/>
```

### Score Display
```typescript
<ScoreCircle score={atsScore} label="ATS Score" />
```

### Action Buttons
```typescript
<View style={{ flexDirection: 'row', gap: SPACING.md }}>
  <Button title="Save" variant="primary" onPress={save} />
  <Button title="Cancel" variant="outline" onPress={cancel} />
</View>
```

## ✅ Migration Checklist

Replace:
- [ ] TouchableOpacity → Button
- [ ] View with styles → Card
- [ ] Custom badges → Badge component
- [ ] Score displays → ScoreCircle
- [ ] TextInput → Input
- [ ] ActivityIndicator → LoadingScreen
- [ ] Hardcoded colors → COLORS
- [ ] Hardcoded spacing → SPACING
- [ ] Hardcoded font sizes → TYPOGRAPHY

## 📚 Full Documentation

See `THEME_SYSTEM.md` for complete documentation.

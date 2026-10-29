# Loading States & Error Handling Guide

Complete guide for professional loading states and error handling throughout the Career Coach app.

## 📦 New Components & Hooks

### 1. useApiCall Hook (`src/hooks/useApiCall.ts`)

Generic hook for standardized API calls with automatic loading, error handling, and refetch capability.

**Usage:**
```typescript
import { useApiCall } from '../hooks';
import axios from 'axios';

function MyComponent() {
  const { data, isLoading, error, refetch } = useApiCall(
    () => axios.get('/api/endpoint'),
    [] // dependencies array
  );

  if (isLoading) return <LoadingScreen />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  
  return <View>{/* render data */}</View>;
}
```

**Features:**
- Auto-fetches on mount and when dependencies change
- Returns: `{data, isLoading, error, refetch}`
- Shows Alert.alert on error automatically
- TypeScript generic support: `useApiCall<ResponseType>`

---

### 2. ErrorState Component (`src/components/ui/ErrorState.tsx`)

Displays when an API call fails with retry functionality.

**Usage:**
```typescript
import { ErrorState } from '../components/ui';

<ErrorState 
  message="Failed to load applications"
  onRetry={() => refetch()}
/>
```

**Props:**
- `message?: string` - Error message (default: "Something went wrong")
- `onRetry?: () => void` - Callback for retry button

---

### 3. EmptyState Component (`src/components/ui/EmptyState.tsx`)

Shows when a list is empty with optional call-to-action.

**Usage:**
```typescript
import { EmptyState } from '../components/ui';

<EmptyState
  icon="briefcase-outline"
  title="No Applications Yet"
  subtitle="Start your job search. Add your first application."
  ctaText="Add Application"
  onCTA={() => navigation.navigate('AddJob')}
/>
```

**Props:**
- `icon?: string` - MaterialCommunityIcons icon name (default: "inbox-outline")
- `title: string` - Main heading
- `subtitle?: string` - Description text
- `ctaText?: string` - Button text
- `onCTA?: () => void` - Button callback

---

### 4. SkeletonLoader Component (`src/components/ui/SkeletonLoader.tsx`)

Animated placeholder for loading lists with smooth opacity animation.

**Usage:**
```typescript
import { SkeletonLoader } from '../components/ui';

// Loading list items
<SkeletonLoader variant="listItem" count={5} />

// Loading cards
<SkeletonLoader variant="card" count={3} />

// Loading profile
<SkeletonLoader variant="profile" count={1} />
```

**Props:**
- `variant?: 'card' | 'listItem' | 'profile'` - Skeleton type (default: 'card')
- `count?: number` - Number of skeletons to show (default: 3)

**Variants:**
- `card` - Full card with title and text lines
- `listItem` - Circle avatar + text lines (for lists)
- `profile` - Large avatar + centered text (for profile screens)

---

### 5. ErrorBoundary Component (`src/components/ErrorBoundary.tsx`)

Catches unhandled React errors and shows friendly error screen.

**Usage:**
```typescript
// Already implemented in App.tsx
import { ErrorBoundary } from './src/components/ErrorBoundary';

<ErrorBoundary>
  <YourApp />
</ErrorBoundary>
```

**Features:**
- Catches all unhandled component errors
- Shows friendly error screen instead of white screen
- "Restart App" button using expo-updates
- Shows error details in development mode

---

## 🎯 Implementation Examples

### Example 1: JobsScreen with Optimistic Updates

**Optimistic Update Pattern:**
```typescript
const handleStatusChange = async (newStatus: string) => {
  // 1. Update local state immediately
  const originalStatus = item.status;
  useJobStore.setState((state) => ({
    applications: state.applications.map((app) =>
      app.id === item.id ? { ...app, status: newStatus } : app
    ),
  }));

  try {
    // 2. Call API in background
    await axios.patch(`${API_URL}/applications/${item.id}`, { status: newStatus });
  } catch (error) {
    // 3. Revert on error
    useJobStore.setState((state) => ({
      applications: state.applications.map((app) =>
        app.id === item.id ? { ...app, status: originalStatus } : app
      ),
    }));
    Alert.alert('Error', 'Failed to update status. Please try again.');
  }
};
```

**Loading States:**
```typescript
{loading && applications.length === 0 ? (
  <SkeletonLoader variant="listItem" count={5} />
) : filteredApps.length === 0 ? (
  <EmptyState
    icon="briefcase-outline"
    title="No Applications Yet"
    subtitle="Start your job search."
    ctaText="Add Application"
    onCTA={() => navigation.navigate('AddJob')}
  />
) : (
  <FlashList data={filteredApps} renderItem={renderCard} />
)}
```

---

### Example 2: Using useApiCall Hook

```typescript
import { useApiCall } from '../hooks';
import { ErrorState, SkeletonLoader } from '../components/ui';
import axios from 'axios';

function ResumeScreen() {
  const { data: resume, isLoading, error, refetch } = useApiCall(
    () => axios.get('/api/resume/123'),
    []
  );

  if (isLoading) return <SkeletonLoader variant="card" count={3} />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!resume) return <EmptyState title="No resume found" />;

  return <View>{/* render resume */}</View>;
}
```

---

### Example 3: Custom Loading State

```typescript
import { LoadingScreen } from '../components/ui';

function MyScreen() {
  const [uploading, setUploading] = useState(false);

  if (uploading) {
    return <LoadingScreen message="Uploading resume..." />;
  }

  return <View>{/* content */}</View>;
}
```

---

## 🎨 Component Styling

All components use the theme system from `src/utils/theme.ts`:

```typescript
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../utils/theme';

// Components automatically use:
// - COLORS.primary, COLORS.danger, COLORS.success
// - SPACING.xs, SPACING.sm, SPACING.md, SPACING.lg, SPACING.xl
// - TYPOGRAPHY.sizes, TYPOGRAPHY.weights
// - RADIUS.sm, RADIUS.md, RADIUS.lg
```

---

## 📋 Migration Checklist

To add loading states and error handling to existing screens:

### Step 1: Replace Loading States
```typescript
// ❌ Before
{loading && <ActivityIndicator />}

// ✅ After
{loading && <SkeletonLoader variant="listItem" count={5} />}
```

### Step 2: Replace Empty States
```typescript
// ❌ Before
{data.length === 0 && <Text>No data</Text>}

// ✅ After
{data.length === 0 && (
  <EmptyState
    title="No Data"
    subtitle="Get started by adding items"
    ctaText="Add Item"
    onCTA={handleAdd}
  />
)}
```

### Step 3: Add Error Handling
```typescript
// ❌ Before
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetchData().then(setData).finally(() => setLoading(false));
}, []);

// ✅ After
const { data, isLoading, error, refetch } = useApiCall(
  () => axios.get('/api/data'),
  []
);

if (error) return <ErrorState message={error} onRetry={refetch} />;
```

### Step 4: Add Optimistic Updates (for mutations)
```typescript
const handleUpdate = async (id: string, newValue: any) => {
  // 1. Save original
  const original = data.find(item => item.id === id);
  
  // 2. Update immediately
  setData(data.map(item => 
    item.id === id ? { ...item, ...newValue } : item
  ));
  
  try {
    // 3. Call API
    await axios.patch(`/api/items/${id}`, newValue);
  } catch (error) {
    // 4. Revert on error
    setData(data.map(item => 
      item.id === id ? original : item
    ));
    Alert.alert('Error', 'Update failed');
  }
};
```

---

## 🚀 Best Practices

1. **Always use SkeletonLoader** instead of generic ActivityIndicator for better UX
2. **Show EmptyState** with helpful CTAs instead of just "No data"
3. **Implement optimistic updates** for instant feedback on user actions
4. **Use useApiCall hook** for consistent error handling across the app
5. **ErrorBoundary is already set up** in App.tsx - no additional setup needed
6. **Test error states** by temporarily breaking API calls
7. **Keep loading messages short** and action-oriented

---

## 📦 Dependencies

All components use existing dependencies:
- `@expo/vector-icons` - For icons
- `react-native` - Core components
- `expo-updates` - For app restart in ErrorBoundary

No additional packages required! ✅

---

## 🎯 Summary

You now have:
- ✅ `useApiCall` hook for standardized API calls
- ✅ `ErrorState` component for error displays
- ✅ `EmptyState` component for empty lists
- ✅ `SkeletonLoader` component for loading states
- ✅ `ErrorBoundary` component for crash handling
- ✅ Optimistic updates in JobsScreen
- ✅ Professional loading states throughout the app

All components are fully typed, themed, and ready to use! 🎉

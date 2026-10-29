import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Platform } from 'react-native';
import { COLORS, SPACING, RADIUS } from '../../utils/theme';

interface SkeletonLoaderProps {
  variant?: 'card' | 'listItem' | 'profile';
  count?: number;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant = 'card',
  count = 3,
}) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    ).start();
  }, []);

  const renderSkeleton = () => {
    switch (variant) {
      case 'profile':
        return <ProfileSkeleton opacity={opacity} />;
      case 'listItem':
        return <ListItemSkeleton opacity={opacity} />;
      case 'card':
      default:
        return <CardSkeleton opacity={opacity} />;
    }
  };

  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.item}>
          {renderSkeleton()}
        </View>
      ))}
    </View>
  );
};

const CardSkeleton: React.FC<{ opacity: Animated.Value }> = ({ opacity }) => (
  <View style={styles.card}>
    <Animated.View style={[styles.skeletonTitle, { opacity }]} />
    <Animated.View style={[styles.skeletonText, { opacity }]} />
    <Animated.View style={[styles.skeletonText, { opacity, width: '60%' }]} />
  </View>
);

const ListItemSkeleton: React.FC<{ opacity: Animated.Value }> = ({ opacity }) => (
  <View style={styles.listItem}>
    <Animated.View style={[styles.skeletonCircle, { opacity }]} />
    <View style={styles.listItemContent}>
      <Animated.View style={[styles.skeletonText, { opacity, width: '70%' }]} />
      <Animated.View style={[styles.skeletonText, { opacity, width: '40%', height: 12 }]} />
    </View>
  </View>
);

const ProfileSkeleton: React.FC<{ opacity: Animated.Value }> = ({ opacity }) => (
  <View style={styles.profile}>
    <Animated.View style={[styles.skeletonAvatar, { opacity }]} />
    <Animated.View style={[styles.skeletonTitle, { opacity, width: 150, marginTop: SPACING.md }]} />
    <Animated.View style={[styles.skeletonText, { opacity, width: 200 }]} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    padding: SPACING.md,
  },
  item: {
    marginBottom: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
  },
  listItemContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  profile: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  skeletonTitle: {
    height: 20,
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.sm,
  },
  skeletonText: {
    height: 16,
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.xs,
  },
  skeletonCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.border,
  },
  skeletonAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.border,
  },
});

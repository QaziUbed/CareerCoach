import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ConfettiCannon from 'react-native-confetti-cannon';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../utils/theme';
import { Button } from './ui';

interface UpgradeSuccessModalProps {
  visible: boolean;
  onClose: () => void;
  planName: string;
}

export const UpgradeSuccessModal: React.FC<UpgradeSuccessModalProps> = ({
  visible,
  onClose,
  planName,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const confettiRef = useRef<any>(null);

  useEffect(() => {
    if (visible) {
      // Trigger confetti
      confettiRef.current?.start();

      // Animate the success icon
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <ConfettiCannon
          ref={confettiRef}
          count={200}
          origin={{ x: -10, y: 0 }}
          autoStart={false}
          fadeOut
        />
        
        <View style={styles.container}>
          <Animated.View
            style={[
              styles.iconContainer,
              {
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <MaterialCommunityIcons
              name="check-circle"
              size={80}
              color={COLORS.success}
            />
          </Animated.View>

          <Text style={styles.title}>Welcome to {planName}!</Text>
          <Text style={styles.message}>
            You now have unlimited access to all premium features.
          </Text>

          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <MaterialCommunityIcons
                name="infinity"
                size={24}
                color={COLORS.primary}
              />
              <Text style={styles.featureText}>Unlimited resume optimization</Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialCommunityIcons
                name="infinity"
                size={24}
                color={COLORS.primary}
              />
              <Text style={styles.featureText}>Unlimited cover letters</Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialCommunityIcons
                name="infinity"
                size={24}
                color={COLORS.primary}
              />
              <Text style={styles.featureText}>Unlimited interview practice</Text>
            </View>
          </View>

          <Button
            variant="primary"
            title="Start Using Premium Features"
            onPress={onClose}
            style={styles.button}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    margin: SPACING.xl,
    alignItems: 'center',
    maxWidth: 400,
  },
  iconContainer: {
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  message: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: TYPOGRAPHY.lineHeights.relaxed,
  },
  featuresContainer: {
    width: '100%',
    marginBottom: SPACING.xl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  featureText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.text,
    marginLeft: SPACING.md,
    flex: 1,
  },
  button: {
    width: '100%',
  },
});

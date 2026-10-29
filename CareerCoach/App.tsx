import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import AppNavigator from './src/navigation/AppNavigator';
import useAuthStore from './src/store/useAuthStore';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { COLORS } from './src/utils/theme';

export default function App() {
  const initialize = useAuthStore((state) => state.initialize);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Initialize optional services when user is available (fail silently)
  useEffect(() => {
    if (user?.id) {
      // Only initialize RevenueCat if API keys are configured
      try {
        const purchaseService = require('./src/services/purchaseService').default;
        purchaseService.initialize(user.id).catch((error: any) => {
          console.log('RevenueCat not available (expected in dev):', error?.message);
        });
      } catch (e) {
        console.log('Purchase service not available');
      }

      // Only register for push notifications on physical devices
      try {
        const notificationService = require('./src/services/notificationService').default;
        notificationService.registerForPushNotifications(user.id).catch((error: any) => {
          console.log('Push notifications not available (expected in dev):', error?.message);
        });
      } catch (e) {
        console.log('Notification service not available');
      }
    }
  }, [user?.id]);

  if (!isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Create a custom Paper theme matching our design strategy
  const theme = {
    ...MD3LightTheme,
    colors: {
      ...MD3LightTheme.colors,
      primary: COLORS.primary,
      secondary: COLORS.secondary,
      background: COLORS.background,
      surface: COLORS.surface,
      error: COLORS.danger,
    },
  };

  return (
    <ErrorBoundary>
      <PaperProvider theme={theme}>
        <View style={styles.rootContainer}>
          <View style={styles.responsiveWrapper}>
            <NavigationContainer>
              <AppNavigator />
            </NavigationContainer>
          </View>
        </View>
      </PaperProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  rootContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  responsiveWrapper: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: COLORS.background,
    ...Platform.select({
      web: {
        height: '100%',
        overflow: 'hidden',
      } as any,
    }),
  },
});

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';
import useAuthStore from '../store/useAuthStore';
import { RootStackParamList } from './types';

// Import missing screens
import OptimizationLoadingScreen from '../screens/resume/OptimizationLoadingScreen';
import OptimizationResultScreen from '../screens/resume/OptimizationResultScreen';
import PracticeScreen from '../screens/interview/PracticeScreen';
import FeedbackScreen from '../screens/interview/FeedbackScreen';
import JobsScreen from '../screens/jobs/JobsScreen';
import AddJobScreen from '../screens/jobs/AddJobScreen';
import UpgradeScreen from '../screens/settings/UpgradeScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const session = useAuthStore((state) => state.session);

  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 300,
      }}
    >
      {session ? (
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen 
            name="OptimizationLoading" 
            component={OptimizationLoadingScreen}
            options={{ headerShown: true, title: 'Optimizing Resume' }}
          />
          <Stack.Screen 
            name="OptimizationResult" 
            component={OptimizationResultScreen}
            options={{ headerShown: true, title: 'Optimization Results' }}
          />
          <Stack.Screen 
            name="Practice" 
            component={PracticeScreen}
            options={{ headerShown: true, title: 'Practice Interview' }}
          />
          <Stack.Screen 
            name="Feedback" 
            component={FeedbackScreen}
            options={{ headerShown: true, title: 'Interview Feedback' }}
          />
          <Stack.Screen 
            name="Jobs" 
            component={JobsScreen}
          />
          <Stack.Screen 
            name="AddJob" 
            component={AddJobScreen}
          />
          <Stack.Screen 
            name="Upgrade" 
            component={UpgradeScreen}
          />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthStack} />
      )}
    </Stack.Navigator>
  );
}

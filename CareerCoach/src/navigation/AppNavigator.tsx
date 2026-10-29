import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';
import useAuthStore from '../store/useAuthStore';
import { RootStackParamList } from './types';

// Import screens
import OptimizationLoadingScreen from '../screens/resume/OptimizationLoadingScreen';
import OptimizationResultScreen from '../screens/resume/OptimizationResultScreen';
import PracticeScreen from '../screens/interview/PracticeScreen';
import FeedbackScreen from '../screens/interview/FeedbackScreen';
import JobsScreen from '../screens/jobs/JobsScreen';
import AddJobScreen from '../screens/jobs/AddJobScreen';
import JobSearchAgentScreen from '../screens/jobs/JobSearchAgentScreen';
import JobResultsScreen from '../screens/jobs/JobResultsScreen';
import GapAnalysisScreen from '../screens/jobs/GapAnalysisScreen';
import UpgradeScreen from '../screens/settings/UpgradeScreen';
import AptitudeScreen from '../screens/practice/AptitudeScreen';
import AptitudeQuestionsScreen from '../screens/practice/AptitudeQuestionsScreen';
import CompanyFAQScreen from '../screens/practice/CompanyFAQScreen';
import CompanyQuestionsScreen from '../screens/practice/CompanyQuestionsScreen';
import CodingScreen from '../screens/practice/CodingScreen';
import CodingQuestionsScreen from '../screens/practice/CodingQuestionsScreen';

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
            name="JobSearchAgent" 
            component={JobSearchAgentScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="JobResults" 
            component={JobResultsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="GapAnalysis" 
            component={GapAnalysisScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Upgrade" 
            component={UpgradeScreen}
          />
          <Stack.Screen 
            name="AptitudePractice" 
            component={AptitudeScreen}
            options={{ headerShown: true, title: 'Aptitude Practice' }}
          />
          <Stack.Screen 
            name="AptitudeQuestions" 
            component={AptitudeQuestionsScreen}
            options={{ headerShown: true, title: '' }}
          />
          <Stack.Screen 
            name="CompanyFAQ" 
            component={CompanyFAQScreen}
            options={{ headerShown: true, title: 'Company FAQs' }}
          />
          <Stack.Screen 
            name="CompanyQuestions" 
            component={CompanyQuestionsScreen}
            options={{ headerShown: true, title: '' }}
          />
          <Stack.Screen 
            name="CodingPractice" 
            component={CodingScreen}
            options={{ headerShown: true, title: 'Logic Building' }}
          />
          <Stack.Screen 
            name="CodingQuestions" 
            component={CodingQuestionsScreen}
            options={{ headerShown: true, title: '' }}
          />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthStack} />
      )}
    </Stack.Navigator>
  );
}

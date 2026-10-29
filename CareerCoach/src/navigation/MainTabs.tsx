import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import HomeScreen from '../screens/home/HomeScreen';
import ResumeScreen from '../screens/resume/ResumeScreen';
import JobsScreen from '../screens/jobs/JobsScreen';
import InterviewScreen from '../screens/interview/InterviewScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import { COLORS, SHADOWS, TYPOGRAPHY } from '../utils/theme';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopWidth: 0, // removed border for modern look
          ...Platform.select({
            ios: SHADOWS.medium,
            android: { elevation: 8 },
            web: {
              boxShadow: '0 -4px 6px -1px rgba(15, 23, 42, 0.05)',
            } as any
          }),
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 80 : 65,
        },
        tabBarLabelStyle: {
          fontSize: TYPOGRAPHY.fontSizes.xs,
          fontWeight: TYPOGRAPHY.fontWeights.medium as any,
          paddingBottom: Platform.OS === 'ios' ? 0 : 4,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Resume" 
        component={ResumeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="file-document" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="JobsTab" 
        component={JobsScreen}
        options={{
          tabBarLabel: 'Jobs',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="briefcase" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Interview" 
        component={InterviewScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="microphone" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';

export const COLORS = {
  primary: '#0F172A',
  secondary: '#334155',
  accent: '#10B981',
  background: '#F8FAFC',
  text: '#1E293B',
  white: '#FFFFFF',
  error: '#EF4444',
};

export const PLAN_LIMITS = {
  FREE: {
    resumeReviews: 1,
    interviews: 0,
    jobApplications: 5,
  },
  BASIC: {
    resumeReviews: 5,
    interviews: 2,
    jobApplications: 20,
  },
  PREMIUM: {
    resumeReviews: -1, // Unlimited
    interviews: -1,
    jobApplications: -1,
  },
};

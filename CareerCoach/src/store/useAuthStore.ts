import { create } from 'zustand';
import { signOut as authSignOut } from '../services/authService';

export interface User {
  id: string;
  email?: string;
  user_metadata?: any;
}

export interface Session {
  access_token: string;
  refresh_token: string;
}

export type PlanType = 'free' | 'job_seeker' | 'pro' | 'career_plus';

/** Must match backend core/auth.py DEV_USER + dev-mock-token */
export const DEV_USER_ID = '00000000-0000-0000-0000-000000000001';
export const DEV_ACCESS_TOKEN = 'dev-mock-token';

interface AuthState {
  user: User | null;
  session: Session | null;
  plan: PlanType;
  isLoading: boolean;
  isInitialized: boolean;
  initialize: () => Promise<void>;
  setUser: (user: User | null, session: Session | null) => void;
  setPlan: (plan: PlanType) => void;
  signOut: () => Promise<void>;
}

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  plan: 'free',
  isLoading: false,
  isInitialized: false,

  initialize: async () => {
    set({ isLoading: true });
    try {
      // Development mock auth so the app works without a live Supabase session.
      // Backend accepts this token when ENVIRONMENT=development.
      const mockUser: User = {
        id: DEV_USER_ID,
        email: 'dev@example.com',
        user_metadata: { full_name: 'Developer' },
      };

      const mockSession: Session = {
        access_token: DEV_ACCESS_TOKEN,
        refresh_token: 'dev-mock-refresh',
      };

      set({
        user: mockUser,
        session: mockSession,
        plan: 'free',
        isInitialized: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      set({ isInitialized: true, isLoading: false });
    }
  },

  setUser: (user, session) => set({ user, session }),

  setPlan: (plan) => set({ plan }),

  signOut: async () => {
    try {
      await authSignOut();
    } catch (error) {
      console.warn('Sign out warning:', error);
    }
    set({ user: null, session: null, plan: 'free' });
  },
}));

export default useAuthStore;

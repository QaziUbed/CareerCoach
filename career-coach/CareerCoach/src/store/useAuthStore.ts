import { create } from 'zustand';
import { supabase, onAuthStateChange, signOut as authSignOut } from '../services/authService';

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
      // Mock user for development without Supabase
      const mockUser: User = {
        id: 'dev-user-123',
        email: 'dev@example.com',
        user_metadata: { full_name: 'Developer' },
      };

      // Mock session so AppNavigator shows MainTabs (it gates on session being truthy)
      const mockSession: Session = {
        access_token: 'dev-mock-token',
        refresh_token: 'dev-mock-refresh',
      };
      
      const plan: PlanType = 'free';
      set({ user: mockUser, session: mockSession, plan, isInitialized: true, isLoading: false });

    } catch (error) {
      console.error('Failed to initialize auth:', error);
      set({ isInitialized: true, isLoading: false });
    }
  },

  setUser: (user, session) => set({ user, session }),
  
  setPlan: (plan) => set({ plan }),

  signOut: async () => {
    await authSignOut();
    set({ user: null, session: null, plan: 'free' });
  },
}));

export default useAuthStore;

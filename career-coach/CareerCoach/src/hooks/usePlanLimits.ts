import { useState, useEffect } from 'react';
import useAuthStore from '../store/useAuthStore';
import { get } from '../services/api';

interface PlanLimits {
  resume_optimize: number;
  cover_letter: number;
  voice_session: number;
}

interface UsageData {
  resume_optimize: number;
  cover_letter: number;
  voice_session: number;
}

interface PlanLimitsResult {
  limits: PlanLimits;
  usage: UsageData;
  isPro: boolean;
  isLoading: boolean;
  canPerformAction: (action: keyof PlanLimits) => boolean;
  getRemainingCount: (action: keyof PlanLimits) => number;
  refetch: () => void;
  // Additional properties used by SettingsScreen
  planName: string;
  resumeOptimizations: number;
  canGenerateCoverLetter: boolean;
  canAccessPrioritySupport: boolean;
}

// Plan limits configuration
const FREE_LIMITS: PlanLimits = {
  resume_optimize: 3,
  cover_letter: 3,
  voice_session: 5,
};

const PAID_LIMITS: PlanLimits = {
  resume_optimize: Infinity,
  cover_letter: Infinity,
  voice_session: Infinity,
};

const PLAN_NAMES: Record<string, string> = {
  free: 'Free',
  job_seeker: 'Job Seeker',
  pro: 'Pro',
  career_plus: 'Career+',
};

export function usePlanLimits(): PlanLimitsResult {
  const user = useAuthStore((state) => state.user);
  const plan = useAuthStore((state) => state.plan);
  const [isPro, setIsPro] = useState(false);
  const [usage, setUsage] = useState<UsageData>({
    resume_optimize: 0,
    cover_letter: 0,
    voice_session: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Determine pro status from the auth store plan
      const hasProAccess = plan !== 'free';
      setIsPro(hasProAccess);

      // Try to fetch usage data from backend (fail silently if backend is down)
      try {
        const data = await get<UsageData>('/api/usage/stats');
        setUsage(data);
      } catch (error) {
        console.log('Usage stats not available (backend may be offline)');
        // Keep default usage values
      }
    } catch (error) {
      console.error('Error fetching plan limits:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.id, plan]);

  const limits = isPro ? PAID_LIMITS : FREE_LIMITS;

  const canPerformAction = (action: keyof PlanLimits): boolean => {
    if (isPro) return true; // Pro users have unlimited access
    return usage[action] < limits[action];
  };

  const getRemainingCount = (action: keyof PlanLimits): number => {
    if (isPro) return Infinity;
    const remaining = limits[action] - usage[action];
    return Math.max(0, remaining);
  };

  return {
    limits,
    usage,
    isPro,
    isLoading,
    canPerformAction,
    getRemainingCount,
    refetch: fetchData,
    // Additional properties for SettingsScreen compatibility
    planName: PLAN_NAMES[plan] || 'Free',
    resumeOptimizations: limits.resume_optimize,
    canGenerateCoverLetter: isPro || usage.cover_letter < limits.cover_letter,
    canAccessPrioritySupport: plan === 'pro' || plan === 'career_plus',
  };
}

export default usePlanLimits;

import { create } from 'zustand';

export interface ResumeAnalysis {
  overall_score: number;
  score_breakdown: {
    ats_compatibility: number;
    content_quality: number;
    impact_language: number;
    skills_relevance: number;
    formatting: number;
  };
  candidate_level: string;
  years_experience: number;
  primary_field: string;
  top_skills: string[];
  missing_critical_skills: string[];
  strengths: string[];
  critical_gaps: string[];
  quick_wins: string[];
  best_fit_roles: string[];
  best_fit_companies: string[];
  salary_range_estimate: string;
  readiness_verdict: string;
}

export interface Resume {
  id: string;
  fileName: string;
  characterCount: number;
  summary?: string;
  experience?: string;
  uploadedAt: string;
  analysis?: ResumeAnalysis;
}

interface ResumeState {
  currentResume: Resume | null;
  setResume: (resume: Resume | null) => void;
  setAnalysis: (analysis: ResumeAnalysis) => void;
  clearResume: () => void;
}

const useResumeStore = create<ResumeState>((set) => ({
  currentResume: null,
  setResume: (resume) => set({ currentResume: resume }),
  setAnalysis: (analysis) => set((state) => ({
    currentResume: state.currentResume ? { ...state.currentResume, analysis } : null
  })),
  clearResume: () => set({ currentResume: null }),
}));

export default useResumeStore;

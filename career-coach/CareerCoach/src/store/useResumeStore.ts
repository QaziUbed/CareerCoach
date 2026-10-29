import { create } from 'zustand';

export interface Resume {
  id: string;
  fileName: string;
  characterCount: number;
  summary?: string;
  experience?: string;
  uploadedAt: string;
}

interface ResumeState {
  currentResume: Resume | null;
  setResume: (resume: Resume | null) => void;
  clearResume: () => void;
}

const useResumeStore = create<ResumeState>((set) => ({
  currentResume: null,
  setResume: (resume) => set({ currentResume: resume }),
  clearResume: () => set({ currentResume: null }),
}));

export default useResumeStore;

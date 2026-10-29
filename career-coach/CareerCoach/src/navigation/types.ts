export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  Onboarding: undefined;
  MainTabs: undefined;
  OptimizationLoading: {
    companyName: string;
    jobTitle: string;
    jobDescription: string;
    resumeId: string;
  };
  OptimizationResult: {
    optimizationId: string;
  };
  Practice: {
    question: string;
    category: string;
    optimization_id: string;
    question_index: number;
    answer_framework: string;
    sample_talking_points: string[];
  };
  Feedback: {
    session_id: string;
    transcript: string;
    score: number;
    grade: string;
    feedback: string;
    strengths: string[];
    improvements: string[];
    better_opening: string;
    audio_url: string;
    question: string;
    category: string;
  };
  Jobs: undefined;
  AddJob: {
    applicationId?: string;
  };
  Upgrade: undefined;
};

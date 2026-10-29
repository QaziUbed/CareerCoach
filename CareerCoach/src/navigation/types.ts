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
  JobSearchAgent: {
    field: string;
    location: string;
    experience_level: string;
    job_type: string[];
    salary_min: number;
  };
  JobResults: {
    jobs: any[];
    average_match_score: number;
    preferences: {
      field: string;
      location: string;
      experience_level: string;
      job_type: string[];
      salary_min: number;
    };
  };
  GapAnalysis: {
    companyName: string;
    jobTitle: string;
    jobDescription: string;
  };
  Upgrade: undefined;
  AptitudePractice: undefined;
  AptitudeQuestions: { topicId: string, title: string };
  CompanyFAQ: undefined;
  CompanyQuestions: { companyId: string, companyName: string };
  CodingPractice: undefined;
  CodingQuestions: { topicId: string, title: string };
  Auth: undefined;
};

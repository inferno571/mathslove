// Enriched question (5th-6th grade)
export interface EnrichedQuestion {
  source_id: string;
  original_grade: string;
  source: string;
  problem: string;
  solution_type: string;
  formula: string;
  correct_answer: string;
  explanation: string;
  id: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topic: string;
  cognitive_domain: string;
  skills: string[];
  calculator_needed: boolean;
  answer_type: string;
  tags: string[];
  choices?: string[];
}

// Basic question (other grades)
export interface BasicQuestion {
  source_id: string;
  original_grade: string;
  source: string;
  problem: string;
  solution_type: string;
  formula: string;
  correct_answer: string;
  explanation: string;
  id: string;
  choices?: string[];
}

// Union type
export type Question = EnrichedQuestion | BasicQuestion;

export function isEnrichedQuestion(q: Question): q is EnrichedQuestion {
  return 'difficulty' in q && 'cognitive_domain' in q;
}

export interface QuestionSet {
  name: string;
  grade_band: string;
  target_students: string;
  description: string;
  questions: Question[];
}

export interface GradeConfig {
  key: string;
  label: string;
  gradeRange: string;
  ageRange: string;
  description: string;
  file: string;
  enriched: boolean;
  icon: string;
  color: string;
}

export interface UserAnswer {
  questionIndex: number;
  questionId: string;
  answer: string;
  timeSpent: number; // seconds
  isCorrect: boolean;
}

export interface TestResult {
  grade: string;
  questions: Question[];
  answers: UserAnswer[];
  totalTime: number;
  score: number;
  maxScore: number;
  iqScore: number;
  percentile: number;
  cognitiveBreakdown?: CognitiveBreakdown[];
  timestamp: string;
}

export interface CognitiveBreakdown {
  domain: string;
  correct: number;
  total: number;
  percentage: number;
}

export interface AIAnalysis {
  overallSummary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  domainAnalyses: DomainAnalysis[];
  iqInterpretation: string;
}

export interface DomainAnalysis {
  domain: string;
  score: number;
  analysis: string;
  percentile: number;
}

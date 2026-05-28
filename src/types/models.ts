import { Timestamp } from 'firebase/firestore';

// Base interface for all documents to support ownership and autosave tracking
export interface BaseModel {
  id?: string;
  userId: string;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

export interface User extends Omit<BaseModel, 'userId'> {
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'student' | 'admin' | 'mentor';
}

export interface Test extends Omit<BaseModel, 'userId'> {
  type: 'sat' | 'ielts' | 'toefl';
  title: string;
  description: string;
  totalScore: number;
}

export interface Question {
  id?: string;
  testId: string;
  text: string;
  options?: string[]; // For multiple choice
  correctAnswer?: string;
  type: 'multiple-choice' | 'open-ended' | 'speaking';
}

export interface StudentTestGoal extends BaseModel {
  testType: 'sat' | 'ielts' | 'toefl';
  targetScore: number;
  currentScore?: number;
  targetDate: Timestamp | Date;
}

export interface StudentAttempt extends BaseModel {
  testId: string;
  score: number;
  status: 'in-progress' | 'completed';
  answers: Record<string, any>; // questionId -> answer
}

export interface DiagnosticResult extends BaseModel {
  overallReadinessScore: number;
  academicScore: number;
  extracurricularScore: number;
  strengths: string[];
  weaknesses: string[];
  rawAnswers: Record<string, any>;
}

export interface LearningPlan extends BaseModel {
  title: string;
  tasks: {
    id: string;
    title: string;
    status: 'pending' | 'in-progress' | 'completed';
    dueDate?: Timestamp | Date;
  }[];
  progressPercentage: number;
}

export interface StudentProfile extends BaseModel {
  fullName: string;
  grade: number;
  schoolName: string;
  gpa: number;
  extracurriculars: string[];
  intendedMajors: string[];
  targetCountries: string[];
}

export interface AIRecommendation extends BaseModel {
  type: 'university' | 'scholarship' | 'essay-feedback';
  content: string; // JSON or Markdown content
  confidenceScore: number;
  isAccepted?: boolean;
}

export interface MockInterview extends BaseModel {
  title: string;
  topic: string;
  durationMinutes: number;
  status: 'scheduled' | 'completed';
}

export interface Transcript extends BaseModel {
  interviewId: string;
  speaker: 'user' | 'ai';
  text: string;
  audioUrl?: string; // Stored in Firebase Storage
}

export interface Evaluation extends BaseModel {
  interviewId: string;
  fluencyScore: number;
  contentScore: number;
  feedback: string;
}

export interface MentorFeedback extends BaseModel {
  targetType: 'essay' | 'interview' | 'profile';
  targetId: string;
  mentorId: string;
  comments: string;
}

export interface PDFReport extends BaseModel {
  title: string;
  storageUrl: string; // Firebase Storage URL
  reportType: 'diagnostic' | 'monthly-progress' | 'final-readiness';
}

export type QuestionType = 'choice' | 'true_false' | 'fill' | 'match';

export interface Question {
  type: QuestionType;
  question: string;
  options?: string[];
  answer: string;
  explanation?: string;
  isInjectedReview?: boolean;
  originalLessonId?: string;
  originalCourseName?: string;
  originalLessonTitle?: string;
}

export interface Lesson {
  id: string;
  title: string;
  type: 'vocab' | 'quiz' | 'flashcard';
  xp: number;
  questions: Question[];
  targetLevel?: number;
}

export interface Unit {
  unitNumber: number;
  title: string;
  description: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  courseName: string;
  themeColor: string; // 'emerald' | 'sky' | 'rose' | 'amber' | 'indigo' | 'violet'
  units: Unit[];
  createdAt: string;
  sourceNotes?: string;
}

export interface NodeKnowledgeState {
  mastery: number; // 0 to 100
  confidence: number; // confidence score (1 to 5)
  halfLife: number; // half-life in days
  recallProbability: number; // 0 to 1
  reviewCount: number;
  successCount: number;
  failureCount: number;
  lastReviewDate: string; // ISO string
  nextReviewDate: string; // ISO string
}

export interface SpacedRepetitionData {
  lessonId: string;
  courseId: string;
  interval: number; // in days
  reps: number;
  easeFactor: number;
  nextReviewDate: string; // ISO String
}

export interface ExerciseRecord {
  exerciseId: string;
  nodeId: string;
  seen: boolean;
  lastSeen: string; // ISO date
  score: number; // 0 to 1 based on correct first try
}

export interface UserProgress {
  xp: number;
  gems: number;
  hearts: number; // max 5
  streak: number;
  lastActiveDate?: string;
  completedLessons: string[]; // lessonId
  spacedRepetition: Record<string, SpacedRepetitionData>; // key: lessonId
  lessonLevels?: Record<string, number>; // key: lessonId, level 0 to 4
  nodeStates?: Record<string, NodeKnowledgeState>; // key: lessonId
  seenExercises?: Record<string, ExerciseRecord>; // key: exerciseId
  examDate?: string; // ISO Date String
  competenceLevel?: number; // User overall competence rating
  streakFreezeActive: boolean;
  doubleXpActive: boolean;
  dailyXp?: Record<string, number>;
  heartsLastRefilledAt?: string;
}

export interface LeaderboardUser {
  id: string;
  name: string;
  avatar: string;
  xp: number;
  isMe?: boolean;
  country: string; // country code or flag emoji
}

export interface ShopItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  cost: number;
  purchased: boolean;
}

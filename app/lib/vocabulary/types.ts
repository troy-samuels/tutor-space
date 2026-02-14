/**
 * Vocabulary Bank Types
 * 
 * Student vocabulary tracking with spaced repetition integration
 */

export interface VocabEntry {
  id: string;
  word: string;
  translation: string;
  language: string;
  level: string;
  topic?: string;
  tags?: string[];
  exampleSentence?: string;
  notes?: string;
  
  // Learning stats
  lastPracticed: string | null;
  correctCount: number;
  incorrectCount: number;
  totalReviews: number;
  
  // Spaced repetition
  srsDueDate: string | null;
  srsEaseFactor: number;
  srsInterval: number;
  srsRepetitions: number;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  source?: "practice" | "lesson" | "manual";
  sourceLessonId?: string;
}

export interface VocabStats {
  totalWords: number;
  masteryRate: number; // 0-100
  wordsDueToday: number;
  wordsReviewedToday: number;
  averageAccuracy: number;
  strongestTopics: string[];
  weakestTopics: string[];
}

export interface VocabFilter {
  language?: string;
  level?: string;
  topic?: string;
  tags?: string[];
  dueOnly?: boolean;
  masteredOnly?: boolean;
  searchQuery?: string;
}

export interface VocabReviewSession {
  id: string;
  startedAt: string;
  completedAt: string | null;
  totalWords: number;
  reviewedWords: number;
  correctAnswers: number;
  averageResponseTime: number;
}

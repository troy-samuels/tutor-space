export type ExerciseType = "multiple-choice" | "fill-blank" | "word-order" | "translate" | "listening" | "conversation";

export type DifficultyLevel = "beginner" | "elementary" | "intermediate" | "upper-intermediate" | "advanced";

export type GrammarCategory = string;

export type TopicCategory = 
  | "greetings" 
  | "food-drink" 
  | "travel" 
  | "shopping" 
  | "family" 
  | "work" 
  | "health" 
  | "weather" 
  | "directions" 
  | "hobbies" 
  | "culture" 
  | "daily-routine" 
  | "emotions" 
  | "technology" 
  | "education";

export interface CatalogueExercise {
  id: string; // e.g. "es-beg-mc-001"
  type: ExerciseType;
  language: string;
  level: DifficultyLevel;
  topic: TopicCategory;
  grammar?: GrammarCategory;
  prompt: string;
  
  // Multiple choice
  options?: string[];
  correctIndex?: number;
  
  // Fill blank
  sentence?: string;
  correctAnswer?: string;
  blankOptions?: string[];
  blankCorrectIndex?: number;
  
  // Word order
  words?: string[];
  correctOrder?: string[];
  
  // Translate
  sourceText?: string;
  targetText?: string;
  acceptedAnswers?: string[];
  
  // Conversation
  aiMessage?: string;
  suggestedResponse?: string;
  
  // Metadata
  explanation: string;
  xp: number;
  tags?: string[];
}

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  rtl?: boolean;
  levels: readonly DifficultyLevel[] | DifficultyLevel[];
}

export interface AssessmentResult {
  language: string;
  correctAnswers: number;
  totalQuestions: number;
  suggestedLevel: DifficultyLevel;
  score: number;
}

export interface SessionScore {
  totalXp: number;
  correctAnswers: number;
  totalQuestions: number;
  accuracy: number;
  timeBonus: number;
  streakBonus: number;
}

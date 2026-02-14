import { CatalogueExercise, DifficultyLevel, SessionScore, AssessmentResult } from './types';

export interface Answer {
  exerciseId: string;
  isCorrect: boolean;
  timeMs: number;
}

export function calculateSessionScore(
  exercises: CatalogueExercise[],
  answers: Answer[],
  streak: number = 0
): SessionScore {
  const totalQuestions = answers.length;
  let correctAnswers = 0;
  let baseXp = 0;
  let totalTimeMs = 0;

  for (let index = 0; index < totalQuestions; index += 1) {
    const answer = answers[index];
    totalTimeMs += answer.timeMs;
    if (!answer.isCorrect) {
      continue;
    }
    correctAnswers += 1;
    baseXp += exercises[index]?.xp ?? 0;
  }

  const accuracy = totalQuestions > 0 ? correctAnswers / totalQuestions : 0;

  // Time bonus: faster answers get bonus (max 20% bonus)
  const avgTime = totalQuestions > 0 ? totalTimeMs / totalQuestions : 0;
  const timeBonus = Math.floor(baseXp * Math.min(0.2, Math.max(0, (30000 - avgTime) / 150000)));

  // Streak bonus: 5% per streak level (max 50%)
  const streakBonus = Math.floor(baseXp * Math.min(0.5, streak * 0.05));

  return {
    totalXp: baseXp + timeBonus + streakBonus,
    correctAnswers,
    totalQuestions,
    accuracy,
    timeBonus,
    streakBonus
  };
}

export function determineLevelFromAssessment(
  correctAnswers: number,
  totalQuestions: number
): DifficultyLevel {
  if (totalQuestions <= 0) {
    return 'beginner';
  }
  const score = correctAnswers / totalQuestions;

  if (score < 0.3) return 'beginner';
  if (score < 0.5) return 'elementary';
  if (score < 0.7) return 'intermediate';
  if (score < 0.85) return 'upper-intermediate';
  return 'advanced';
}

export function calculateXpReward(
  exercise: CatalogueExercise,
  timeMs: number,
  streak: number = 0
): number {
  const baseXp = exercise.xp;
  
  // Time bonus
  const timeBonus = Math.floor(baseXp * Math.min(0.2, Math.max(0, (30000 - timeMs) / 150000)));
  
  // Streak bonus
  const streakBonus = Math.floor(baseXp * Math.min(0.5, streak * 0.05));
  
  return baseXp + timeBonus + streakBonus;
}

export function calculateAssessmentResult(
  language: string,
  exercises: CatalogueExercise[],
  answers: Answer[]
): AssessmentResult {
  const totalQuestions = Math.min(answers.length, exercises.length);
  let correctAnswers = 0;
  for (let index = 0; index < totalQuestions; index += 1) {
    if (answers[index].isCorrect) {
      correctAnswers += 1;
    }
  }
  const score = totalQuestions > 0 ? correctAnswers / totalQuestions : 0;
  const suggestedLevel = determineLevelFromAssessment(correctAnswers, totalQuestions);

  return {
    language,
    correctAnswers,
    totalQuestions,
    suggestedLevel,
    score
  };
}

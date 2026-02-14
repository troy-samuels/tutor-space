"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type Screen =
  | "splash"
  | "language-picker"
  | "level-assessment"
  | "practice"
  | "results";

export type PracticeExerciseContext = {
  language: string;
  level: string;
  topic: string;
  vocabularyFocus: string[];
  grammarFocus: string[];
  lessonDate?: string;
  tutorNotes?: string;
};

export type PracticeChallengeSeed = {
  challengeId: string;
  challengerName: string;
  challengerScore: number;
  language: string;
  level: string;
};

export interface PracticeState {
  screen: Screen;
  language: string;
  level: string;
  xp: number;
  streak: number;
  difficultyMultiplier: 1 | 1.5 | 2;
  hearts: number;
  currentExerciseIndex: number;
  answers: { correct: boolean; xp: number }[];
  exerciseContext: PracticeExerciseContext | null;
  assignmentId: string | null;
  anonymousSessionToken: string | null;
  publicSessionId: string | null;
  resultScore: number | null;
  challengeSeed: PracticeChallengeSeed | null;
}

type PracticeMachineOptions = {
  initialLanguageCode?: string;
  initialExerciseContext?: PracticeExerciseContext | null;
  initialScreen?: Screen;
  assignmentId?: string | null;
  challengeSeed?: PracticeChallengeSeed | null;
};

/**
 * Escalates difficulty multiplier after sustained correct streaks.
 *
 * @param current - Existing multiplier.
 * @returns Escalated multiplier.
 */
function getEscalatedMultiplier(
  current: PracticeState["difficultyMultiplier"]
): PracticeState["difficultyMultiplier"] {
  if (current === 1) return 1.5;
  if (current === 1.5) return 2;
  return 2;
}

/**
 * Builds initial machine state from optional assignment/challenge context.
 *
 * @param options - Initial state options.
 * @returns Machine initial state.
 */
function createInitialState(options: PracticeMachineOptions): PracticeState {
  const initialLanguage = options.initialLanguageCode || options.initialExerciseContext?.language || "es";
  const initialLevel = options.initialExerciseContext?.level || options.challengeSeed?.level || "";
  return {
    screen: options.initialScreen ?? "splash",
    language: initialLanguage,
    level: initialLevel,
    xp: 0,
    streak: 0,
    difficultyMultiplier: 1,
    hearts: 3,
    currentExerciseIndex: 0,
    answers: [],
    exerciseContext: options.initialExerciseContext ?? null,
    assignmentId: options.assignmentId ?? null,
    anonymousSessionToken: null,
    publicSessionId: null,
    resultScore: null,
    challengeSeed: options.challengeSeed ?? null,
  };
}

/**
 * Client-side state machine for the public practice experience.
 *
 * @param options - Optional initial route context (assignment, challenge, language).
 * @returns State and state transition handlers.
 */
export function usePracticeMachine(options: PracticeMachineOptions = {}) {
  const initialState = useMemo(
    () => createInitialState(options),
    [
      options.assignmentId,
      options.challengeSeed,
      options.initialExerciseContext,
      options.initialLanguageCode,
      options.initialScreen,
    ]
  );
  const [state, setState] = useState<PracticeState>(initialState);

  useEffect(() => {
    setState(initialState);
  }, [initialState]);

  const goToScreen = useCallback((screen: Screen) => {
    setState((prev) => ({ ...prev, screen }));
  }, []);

  const selectLanguage = useCallback((language: string) => {
    setState((prev) => ({
      ...prev,
      language,
      exerciseContext: prev.exerciseContext
        ? {
            ...prev.exerciseContext,
            language,
          }
        : prev.exerciseContext,
      screen: "level-assessment",
    }));
  }, []);

  const completeAssessment = useCallback((level: string, earnedXp: number) => {
    setState((prev) => ({
      ...prev,
      level,
      xp: prev.xp + earnedXp,
      screen: "practice",
    }));
  }, []);

  const completePractice = useCallback(() => {
    setState((prev) => ({ ...prev, screen: "results" }));
  }, []);

  const awardXp = useCallback((amount: number) => {
    setState((prev) => ({ ...prev, xp: prev.xp + amount }));
  }, []);

  const incrementStreak = useCallback(() => {
    setState((prev) => {
      const nextStreak = prev.streak + 1;
      const shouldEscalate = nextStreak >= 3 && nextStreak % 3 === 0;
      return {
        ...prev,
        streak: nextStreak,
        difficultyMultiplier: shouldEscalate
          ? getEscalatedMultiplier(prev.difficultyMultiplier)
          : prev.difficultyMultiplier,
      };
    });
  }, []);

  const resetStreak = useCallback(() => {
    setState((prev) => ({ ...prev, streak: 0, difficultyMultiplier: 1 }));
  }, []);

  const loseHeart = useCallback(() => {
    setState((prev) => ({ ...prev, hearts: Math.max(0, prev.hearts - 1) }));
  }, []);

  const recordAnswer = useCallback((correct: boolean, xp: number) => {
    setState((prev) => ({
      ...prev,
      answers: [...prev.answers, { correct, xp }],
    }));
  }, []);

  const advanceExercise = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentExerciseIndex: prev.currentExerciseIndex + 1,
    }));
  }, []);

  const setAnonymousSession = useCallback((sessionToken: string, publicSessionId: string) => {
    setState((prev) => ({
      ...prev,
      anonymousSessionToken: sessionToken,
      publicSessionId,
    }));
  }, []);

  const setResultScore = useCallback((score: number) => {
    setState((prev) => ({
      ...prev,
      resultScore: Math.max(0, Math.min(100, Math.round(score))),
    }));
  }, []);

  const reset = useCallback(() => {
    setState(createInitialState(options));
  }, [options]);

  return {
    state,
    goToScreen,
    selectLanguage,
    completeAssessment,
    completePractice,
    awardXp,
    incrementStreak,
    resetStreak,
    loseHeart,
    recordAnswer,
    advanceExercise,
    setAnonymousSession,
    setResultScore,
    reset,
  };
}

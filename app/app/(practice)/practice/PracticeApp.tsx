"use client";

import { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import SplashScreen from "@/components/practice/SplashScreen";
import LanguagePicker from "@/components/practice/LanguagePicker";
import LevelAssessment from "@/components/practice/LevelAssessment";
import PracticeChat from "@/components/practice/PracticeChat";
import ResultsCard from "@/components/practice/ResultsCard";
import { LANGUAGES, SCORE_RESULTS } from "@/lib/practice/catalogue-bridge";
import type { PracticeChallengeSeed, PracticeExerciseContext, Screen } from "@/lib/hooks/use-practice";
import { usePracticeMachine } from "@/lib/hooks/use-practice";

type PracticeAppProps = {
  assignmentId?: string | null;
  initialExerciseContext?: PracticeExerciseContext | null;
  initialLanguageCode?: string;
  initialScreen?: Screen;
  tutorDisplayName?: string;
  challengeSeed?: PracticeChallengeSeed | null;
};

type CreateAnonymousSessionResponse = {
  success: boolean;
  sessionId: string;
  sessionToken: string;
};

const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

const pageTransition = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30,
};

/**
 * Resolves language code from either ISO code or language display name.
 *
 * @param value - Candidate language value.
 * @returns Language code recognized by practice mock data.
 */
function resolveLanguageCode(value: string | undefined | null): string {
  if (!value) {
    return "es";
  }

  const normalized = value.trim().toLowerCase();
  const exactCode = LANGUAGES.find((language) => language.code.toLowerCase() === normalized);
  if (exactCode) {
    return exactCode.code;
  }

  const byName = LANGUAGES.find(
    (language) =>
      language.name.toLowerCase() === normalized || language.nativeName.toLowerCase() === normalized
  );

  return byName?.code || "es";
}

/**
 * Persists latest anonymous practice session payload for local continuity.
 *
 * @param payload - Session identifiers and lightweight result metadata.
 */
function persistAnonymousSession(payload: {
  sessionId: string;
  sessionToken: string;
  languageCode: string;
  score: number;
}) {
  if (typeof window === "undefined") {
    return;
  }

  const storageKey = "tl_anonymous_practice_sessions";
  const currentRaw = window.localStorage.getItem(storageKey);
  const currentList = currentRaw ? (JSON.parse(currentRaw) as Array<Record<string, unknown>>) : [];

  const nextEntry = {
    sessionId: payload.sessionId,
    sessionToken: payload.sessionToken,
    languageCode: payload.languageCode,
    score: payload.score,
    createdAt: new Date().toISOString(),
  };

  const deduplicated = [nextEntry, ...currentList.filter((item) => item.sessionId !== payload.sessionId)];
  window.localStorage.setItem(storageKey, JSON.stringify(deduplicated.slice(0, 30)));
  window.localStorage.setItem("tl_last_public_practice_session", JSON.stringify(nextEntry));
}

export default function PracticeApp({
  assignmentId = null,
  initialExerciseContext = null,
  initialLanguageCode,
  initialScreen = "splash",
  tutorDisplayName,
  challengeSeed = null,
}: PracticeAppProps) {
  const resolvedInitialLanguage = useMemo(
    () => resolveLanguageCode(initialLanguageCode || initialExerciseContext?.language || challengeSeed?.language),
    [challengeSeed?.language, initialExerciseContext?.language, initialLanguageCode]
  );

  const {
    state,
    goToScreen,
    selectLanguage,
    completeAssessment,
    completePractice,
    incrementStreak,
    resetStreak,
    loseHeart,
    setAnonymousSession,
    setResultScore,
    reset,
  } = usePracticeMachine({
    assignmentId,
    initialExerciseContext,
    initialLanguageCode: resolvedInitialLanguage,
    initialScreen,
    challengeSeed,
  });

  const [isPersistingSession, setIsPersistingSession] = useState(false);

  const handleStart = useCallback(() => {
    if (initialExerciseContext) {
      goToScreen("practice");
      return;
    }
    goToScreen("language-picker");
  }, [goToScreen, initialExerciseContext]);

  const handleLanguageSelect = useCallback(
    (languageCode: string) => {
      selectLanguage(languageCode);
    },
    [selectLanguage]
  );

  const handleAssessmentComplete = useCallback(() => {
    const contextualLevel = initialExerciseContext?.level || challengeSeed?.level || "In Progress";
    completeAssessment(contextualLevel, 0);
  }, [challengeSeed?.level, completeAssessment, initialExerciseContext?.level]);

  const ensureAnonymousSession = useCallback(async () => {
    if (state.publicSessionId && state.anonymousSessionToken) {
      return;
    }

    const score = SCORE_RESULTS[state.language]?.overallScore ?? SCORE_RESULTS.es.overallScore;
    setIsPersistingSession(true);
    try {
      const response = await fetch("/api/practice/anonymous/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          language: state.language,
          level: state.level || initialExerciseContext?.level || challengeSeed?.level || "Intermediate",
          score,
          results: {
            assignmentId: state.assignmentId,
            challengeId: state.challengeSeed?.challengeId || null,
            tutorDisplayName: tutorDisplayName || null,
          },
        }),
      });

      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as CreateAnonymousSessionResponse;
      if (!payload.success || !payload.sessionId || !payload.sessionToken) {
        return;
      }

      setAnonymousSession(payload.sessionToken, payload.sessionId);
      persistAnonymousSession({
        sessionId: payload.sessionId,
        sessionToken: payload.sessionToken,
        languageCode: state.language,
        score,
      });
    } catch {
      // Silent: the public flow must continue even if persistence fails.
    } finally {
      setIsPersistingSession(false);
    }
  }, [
    challengeSeed?.level,
    initialExerciseContext?.level,
    setAnonymousSession,
    state.anonymousSessionToken,
    state.assignmentId,
    state.challengeSeed?.challengeId,
    state.language,
    state.level,
    state.publicSessionId,
    tutorDisplayName,
  ]);

  const handlePracticeComplete = useCallback(async () => {
    const score = SCORE_RESULTS[state.language]?.overallScore ?? SCORE_RESULTS.es.overallScore;
    setResultScore(score);
    await ensureAnonymousSession();
    completePractice();
  }, [completePractice, ensureAnonymousSession, setResultScore, state.language]);

  const handleKeepPractising = useCallback(() => {
    reset();
  }, [reset]);

  const handlePracticeAnswerOutcome = useCallback(
    (correct: boolean) => {
      if (correct) {
        incrementStreak();
        return;
      }

      resetStreak();
      loseHeart();
    },
    [incrementStreak, loseHeart, resetStreak]
  );

  return (
    <AnimatePresence mode="wait">
      {state.screen === "splash" && (
        <motion.div
          key="splash"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={pageTransition}
        >
          <SplashScreen
            onStart={handleStart}
            languageHint={initialExerciseContext?.language || challengeSeed?.language || null}
            tutorDisplayName={tutorDisplayName || null}
            topicHint={initialExerciseContext?.topic || null}
          />
        </motion.div>
      )}

      {state.screen === "language-picker" && (
        <motion.div
          key="language-picker"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={pageTransition}
        >
          <LanguagePicker onSelect={handleLanguageSelect} />
        </motion.div>
      )}

      {state.screen === "level-assessment" && (
        <motion.div
          key="level-assessment"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={pageTransition}
        >
          <LevelAssessment
            languageCode={state.language}
            onComplete={handleAssessmentComplete}
          />
        </motion.div>
      )}

      {state.screen === "practice" && (
        <motion.div
          key="practice"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={pageTransition}
        >
          <PracticeChat
            languageCode={state.language}
            difficultyMultiplier={state.difficultyMultiplier}
            correctStreak={state.streak}
            exerciseContext={state.exerciseContext}
            onAnswerOutcome={handlePracticeAnswerOutcome}
            onComplete={handlePracticeComplete}
          />
        </motion.div>
      )}

      {state.screen === "results" && (
        <motion.div
          key="results"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={pageTransition}
        >
          <ResultsCard
            languageCode={state.language}
            score={state.resultScore}
            levelLabel={state.level}
            streak={state.streak}
            sessionId={state.publicSessionId}
            sessionToken={state.anonymousSessionToken}
            challengeSeed={state.challengeSeed}
            isPersistingSession={isPersistingSession}
            onKeepPractising={handleKeepPractising}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

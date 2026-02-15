"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type {
  RecapSummary,
  RecapExercise,
  AttemptAnswer,
} from "@/lib/recap/types";
import WelcomeCard from "@/components/recap/WelcomeCard";
import VocabCards from "@/components/recap/VocabCards";
import ExerciseStep from "@/components/recap/ExerciseStep";
import ResultsCard from "@/components/recap/ResultsCard";

type RecapExperienceProps = {
  recapId: string;
  shortId: string;
  summary: RecapSummary;
  exercises: RecapExercise[];
  createdAt: string;
  tutorDisplayName?: string | null;
  tutorUsername?: string | null;
};

const pageVariants = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
};

const pageTransition = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30,
};

function getStudentFingerprint(): string {
  if (typeof window === "undefined") return "";
  const key = "tl_student_fp";
  let fp = localStorage.getItem(key);
  if (!fp) {
    fp = crypto.randomUUID();
    localStorage.setItem(key, fp);
  }
  return fp;
}

export default function RecapExperience({
  recapId,
  shortId,
  summary,
  exercises,
  createdAt,
  tutorDisplayName,
  tutorUsername,
}: RecapExperienceProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<AttemptAnswer[]>([]);
  const [streak, setStreak] = useState(0);
  const startTimeRef = useRef<Date>(new Date());
  const exerciseStartRef = useRef<number>(Date.now());
  const submittedRef = useRef(false);

  // Skip vocab step if no vocabulary
  const hasVocab = summary.vocabulary.length > 0;
  const hasExercises = exercises.length > 0;

  // Steps: welcome(0) + vocab(1, optional) + exercises + results
  const vocabStep = hasVocab ? 1 : -1;
  const exerciseStartStep = hasVocab ? 2 : 1;
  const resultsStep = exerciseStartStep + exercises.length;
  const totalSteps = resultsStep + 1;
  const progress = Math.min((currentStep / (totalSteps - 1)) * 100, 100);

  const handleNext = useCallback(() => {
    setCurrentStep((prev) => prev + 1);
    exerciseStartRef.current = Date.now();
  }, []);

  const handleExerciseAnswer = useCallback(
    (exerciseIndex: number, answer: string | number | Record<string, string>, correct: boolean) => {
      const timeMs = Date.now() - exerciseStartRef.current;
      setAnswers((prev) => [
        ...prev,
        { exerciseIndex, answer, correct, timeMs },
      ]);
      setStreak((prev) => (correct ? prev + 1 : 0));
    },
    []
  );

  // Submit attempt once on results mount
  useEffect(() => {
    if (currentStep !== resultsStep) return;
    if (submittedRef.current) return;
    submittedRef.current = true;

    const score = answers.filter((a) => a.correct).length;
    const total = exercises.length;
    const timeSpentSeconds = Math.round(
      (Date.now() - startTimeRef.current.getTime()) / 1000
    );

    fetch(`/api/recap/${shortId}/attempt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        score,
        total,
        timeSpentSeconds,
        answers,
        studentFingerprint: getStudentFingerprint(),
      }),
    }).catch(() => {
      // Non-critical — silently fail
    });
  }, [currentStep, resultsStep, answers, exercises.length, shortId]);

  // Determine which step component to render
  const renderStep = () => {
    // Welcome
    if (currentStep === 0) {
      return (
        <motion.div
          key="welcome"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={pageTransition}
        >
          <WelcomeCard
            summary={summary}
            createdAt={createdAt}
            onContinue={handleNext}
          />
        </motion.div>
      );
    }

    // Vocab (skip if empty)
    if (currentStep === vocabStep && hasVocab) {
      return (
        <motion.div
          key="vocab"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={pageTransition}
        >
          <VocabCards
            vocabulary={summary.vocabulary}
            language={summary.language}
            onContinue={handleNext}
            uiStrings={summary.uiStrings}
          />
        </motion.div>
      );
    }

    // Exercises
    const exerciseIndex = currentStep - exerciseStartStep;
    if (exerciseIndex >= 0 && exerciseIndex < exercises.length) {
      const exercise = exercises[exerciseIndex];

      return (
        <motion.div
          key={`exercise-${exerciseIndex}`}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={pageTransition}
        >
          <ExerciseStep
            exercise={exercise}
            exerciseNumber={exerciseIndex + 1}
            totalExercises={exercises.length}
            onAnswer={(correct: boolean, userAnswer?: string | number | Record<string, string>) => {
              handleExerciseAnswer(
                exerciseIndex,
                userAnswer ?? (correct ? "correct" : "wrong"),
                correct
              );
            }}
            onNext={handleNext}
            uiStrings={summary.uiStrings}
            streak={streak}
          />
        </motion.div>
      );
    }

    // Results (also handles case with no exercises)
    return (
      <motion.div
        key="results"
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={pageTransition}
      >
        <ResultsCard
          score={answers.filter((a) => a.correct).length}
          total={exercises.length}
          answers={answers}
          summary={summary}
          exercises={exercises}
          startTime={startTimeRef.current}
          tutorDisplayName={tutorDisplayName}
          tutorUsername={tutorUsername}
        />
      </motion.div>
    );
  };

  return (
    <div className="relative min-h-screen">
      {/* Progress bar */}
      <div className="fixed left-0 right-0 top-0 z-50 h-[3px] bg-card">
        <motion.div
          className="h-full bg-primary"
          initial={{ width: "0%" }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">{renderStep()}</AnimatePresence>
    </div>
  );
}

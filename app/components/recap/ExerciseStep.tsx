"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";
import type { RecapExercise, RecapUIStrings } from "@/lib/recap/types";
import { DEFAULT_UI_STRINGS } from "@/lib/recap/types";
import MultipleChoiceExercise from "./MultipleChoiceExercise";
import FillBlankExercise from "./FillBlankExercise";
import WordOrderExercise from "./WordOrderExercise";
import ListeningExercise from "./ListeningExercise";
import MatchingExercise from "./MatchingExercise";
import TranslationExercise from "./TranslationExercise";
import ContextClozeExercise from "./ContextClozeExercise";

type ExerciseStepProps = {
  exercise: RecapExercise;
  exerciseNumber: number;
  totalExercises: number;
  onAnswer: (correct: boolean, userAnswer?: string | number | Record<string, string>) => void;
  onNext: () => void;
  uiStrings?: RecapUIStrings;
  streak?: number;
};

const TYPE_EMOJI: Record<string, string> = {
  multipleChoice: "🧠",
  fillBlank: "✏️",
  wordOrder: "🔀",
  listening: "🔊",
  matching: "🔗",
  translation: "🌍",
  contextCloze: "📝",
};

const DIFFICULTY_BADGES: Record<string, { label: string; color: string }> = {
  easy: { label: "Easy", color: "bg-green-500/20 text-green-400" },
  medium: { label: "Medium", color: "bg-yellow-500/20 text-yellow-400" },
  hard: { label: "Hard", color: "bg-red-500/20 text-red-400" },
};

const VALID_TYPES = [
  "multipleChoice",
  "fillBlank",
  "wordOrder",
  "listening",
  "matching",
  "translation",
  "contextCloze",
];

export default function ExerciseStep({
  exercise,
  exerciseNumber,
  totalExercises,
  onAnswer,
  onNext,
  uiStrings,
  streak = 0,
}: ExerciseStepProps) {
  const ui = { ...DEFAULT_UI_STRINGS, ...uiStrings };
  const [answered, setAnswered] = useState(false);

  const handleAnswer = (correct: boolean, userAnswer?: string | number | Record<string, string>) => {
    if (answered) return;
    setAnswered(true);
    onAnswer(correct, userAnswer);
  };

  const progressPercent = (exerciseNumber / totalExercises) * 100;
  const isValidType = VALID_TYPES.includes(exercise.type);
  const difficulty = exercise.difficulty;
  const badge = difficulty ? DIFFICULTY_BADGES[difficulty] : null;

  return (
    <div className="flex min-h-screen flex-col px-6 py-12">
      {/* Exercise header */}
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">
            {ui.questionOf
              .replace("{n}", String(exerciseNumber))
              .replace("{total}", String(totalExercises))}
          </span>
          <div className="flex items-center gap-2">
            {/* Streak indicator */}
            {streak > 1 && (
              <span className="text-xs font-bold text-orange-400">
                🔥 {streak}
              </span>
            )}
            {/* Difficulty badge */}
            {badge && (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                  badge.color
                )}
              >
                {badge.label}
              </span>
            )}
            <span className="text-lg">{TYPE_EMOJI[exercise.type] ?? "📝"}</span>
          </div>
        </div>

        {/* Mini progress bar */}
        <div className="mb-8 h-1.5 w-full overflow-hidden rounded-full bg-card">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Exercise content */}
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col">
        {!isValidType ? (
          <div className="flex flex-1 flex-col items-center justify-center">
            <p className="text-sm text-muted-foreground">
              This exercise couldn&apos;t be loaded.
            </p>
            <button
              onClick={() => {
                if (!answered) {
                  setAnswered(true);
                  onAnswer(false);
                }
              }}
              className={cn(
                "mt-4 rounded-xl bg-card px-6 py-3 text-sm font-medium text-foreground",
                "transition-all hover:brightness-110"
              )}
            >
              Skip →
            </button>
          </div>
        ) : (
          <>
            {exercise.type === "multipleChoice" && (
              <MultipleChoiceExercise exercise={exercise} onAnswer={handleAnswer} uiStrings={uiStrings} />
            )}
            {exercise.type === "fillBlank" && (
              <FillBlankExercise exercise={exercise} onAnswer={handleAnswer} uiStrings={uiStrings} />
            )}
            {exercise.type === "wordOrder" && (
              <WordOrderExercise exercise={exercise} onAnswer={handleAnswer} uiStrings={uiStrings} />
            )}
            {exercise.type === "listening" && (
              <ListeningExercise exercise={exercise} onAnswer={handleAnswer} uiStrings={uiStrings} />
            )}
            {exercise.type === "matching" && (
              <MatchingExercise exercise={exercise} onAnswer={handleAnswer} uiStrings={uiStrings} />
            )}
            {exercise.type === "translation" && (
              <TranslationExercise exercise={exercise} onAnswer={handleAnswer} uiStrings={uiStrings} />
            )}
            {exercise.type === "contextCloze" && (
              <ContextClozeExercise exercise={exercise} onAnswer={handleAnswer} uiStrings={uiStrings} />
            )}
          </>
        )}

        {/* Next button (shown after answering) */}
        {answered && (
          <button
            onClick={onNext}
            className={cn(
              "mt-6 w-full rounded-xl bg-primary py-3 font-semibold text-white",
              "transition-all hover:brightness-110 active:scale-[0.98]"
            )}
          >
            {ui.next}
          </button>
        )}
      </div>

      {/* Footer */}
      <div className="mt-8 flex justify-center opacity-40">
        <Logo variant="wordmark" className="h-5 invert" />
      </div>
    </div>
  );
}

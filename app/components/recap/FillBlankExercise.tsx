"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { FillBlankExercise as FBExerciseType, RecapUIStrings } from "@/lib/recap/types";
import { DEFAULT_UI_STRINGS } from "@/lib/recap/types";

type FillBlankExerciseProps = {
  exercise: FBExerciseType;
  onAnswer: (correct: boolean) => void;
  uiStrings?: RecapUIStrings;
};

/**
 * Normalize a string for accent-insensitive comparison.
 * Strips combining diacritical marks and lowercases.
 */
function normalize(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export default function FillBlankExercise({
  exercise,
  onAnswer,
  uiStrings,
}: FillBlankExerciseProps) {
  const ui = { ...DEFAULT_UI_STRINGS, ...uiStrings };
  const [input, setInput] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const correctAnswer = exercise.answer;

  // Auto-focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Show hint after 8 seconds
  useEffect(() => {
    if (exercise.hint && !showHint && !showResult) {
      hintTimerRef.current = setTimeout(() => setShowHint(true), 8000);
    }
    return () => {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    };
  }, [exercise.hint, showHint, showResult]);

  const handleCheck = useCallback(() => {
    if (showResult || !input.trim()) return;
    const correct = normalize(input) === normalize(correctAnswer);
    setIsCorrect(correct);
    setShowResult(true);
    onAnswer(correct);
  }, [input, correctAnswer, showResult, onAnswer]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleCheck();
      }
    },
    [handleCheck]
  );

  // Render question with styled blank
  const questionParts = exercise.question.split("___");

  return (
    <div>
      {/* Question */}
      <p className="mb-6 text-lg font-medium leading-relaxed text-foreground">
        {questionParts.map((part, i) => (
          <span key={i}>
            {part}
            {i < questionParts.length - 1 && (
              <span className="mx-1 inline-block w-20 border-b-2 border-primary/50" />
            )}
          </span>
        ))}
      </p>

      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={showResult}
        placeholder={ui.typeYourAnswer}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        className={cn(
          "w-full rounded-xl border bg-card p-4 text-center text-lg text-foreground",
          "placeholder:text-muted-foreground/40",
          "focus:outline-none focus:ring-2 focus:ring-primary/50",
          showResult && isCorrect && "border-green-500 bg-green-500/5",
          showResult && !isCorrect && "border-red-500 bg-red-500/5",
          !showResult && "border-border"
        )}
      />

      {/* Hint */}
      {!showResult && exercise.hint && (
        <button
          onClick={() => setShowHint(true)}
          className="mt-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {showHint ? (
            <span>💡 {exercise.hint}</span>
          ) : (
            <span>{ui.showHint}</span>
          )}
        </button>
      )}

      {/* Check button */}
      {!showResult && (
        <button
          onClick={handleCheck}
          disabled={!input.trim()}
          className={cn(
            "mt-6 w-full rounded-xl bg-primary py-3 font-semibold text-white",
            "transition-all hover:brightness-110 active:scale-[0.98]",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
        >
          {ui.check}
        </button>
      )}

      {/* Result */}
      {showResult && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={cn(
            "mt-4 rounded-xl p-4 text-sm leading-relaxed",
            isCorrect
              ? "bg-green-500/10 text-green-300"
              : "bg-red-500/10 text-red-300"
          )}
        >
          <p className="mb-1 font-semibold">
            {isCorrect ? ui.correct : ui.notQuite}
          </p>
          {!isCorrect && (
            <p className="mb-2 text-foreground/70">
              {ui.correctAnswerIs}{" "}
              <span className="font-semibold text-green-400">
                {correctAnswer}
              </span>
            </p>
          )}
          <p className="text-foreground/70">{exercise.explanation}</p>
        </motion.div>
      )}
    </div>
  );
}

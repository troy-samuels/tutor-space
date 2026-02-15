"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { TranslationExercise as TranslationExerciseType, RecapUIStrings } from "@/lib/recap/types";
import { DEFAULT_UI_STRINGS } from "@/lib/recap/types";

type TranslationExerciseProps = {
  exercise: TranslationExerciseType;
  onAnswer: (correct: boolean, userAnswer?: string) => void;
  uiStrings?: RecapUIStrings;
};

/**
 * Normalize for comparison: strip diacritics, punctuation, lowercase.
 */
function normalize(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.,!?;:'"¿¡—–\-]/g, "")
    .replace(/\s+/g, " ");
}

/**
 * Levenshtein distance between two strings.
 */
function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Check if the answer is close enough using Levenshtein distance.
 * Threshold: up to 15% of the answer length, minimum 1 char.
 */
function isFuzzyMatch(input: string, answer: string): boolean {
  const normInput = normalize(input);
  const normAnswer = normalize(answer);
  if (normInput === normAnswer) return true;

  const threshold = Math.max(1, Math.floor(normAnswer.length * 0.15));
  return levenshtein(normInput, normAnswer) <= threshold;
}

export default function TranslationExerciseComponent({
  exercise,
  onAnswer,
  uiStrings,
}: TranslationExerciseProps) {
  const ui = { ...DEFAULT_UI_STRINGS, ...uiStrings };
  const [input, setInput] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleCheck = useCallback(() => {
    if (showResult || !input.trim()) return;

    // Check against primary answer + acceptable alternatives
    const allAnswers = [exercise.answer, ...(exercise.acceptableAnswers ?? [])];
    const correct = allAnswers.some((ans) => isFuzzyMatch(input, ans));

    setIsCorrect(correct);
    setShowResult(true);
    onAnswer(correct, input);
  }, [input, exercise.answer, exercise.acceptableAnswers, showResult, onAnswer]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleCheck();
      }
    },
    [handleCheck]
  );

  return (
    <div>
      <p className="mb-4 text-lg font-medium leading-relaxed text-foreground">
        {exercise.question || ui.translateThisSentence}
      </p>

      {/* Source sentence card */}
      <div
        className="mb-6 rounded-xl border bg-card p-4"
        style={{ borderColor: "rgba(245, 242, 239, 0.08)" }}
      >
        <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {exercise.sourceLanguage}
        </span>
        <p className="text-lg font-semibold text-foreground">
          {exercise.sourceText}
        </p>
      </div>

      {/* Direction indicator */}
      <div className="mb-3 flex items-center justify-center">
        <span className="text-xs font-medium text-muted-foreground">
          ↓ {exercise.targetLanguage}
        </span>
      </div>

      {/* Translation input */}
      <textarea
        ref={inputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={showResult}
        placeholder={ui.typeYourAnswer}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        rows={2}
        className={cn(
          "w-full resize-none rounded-xl border bg-card p-4 text-center text-lg text-foreground",
          "placeholder:text-muted-foreground/40",
          "focus:outline-none focus:ring-2 focus:ring-primary/50",
          showResult && isCorrect && "border-green-500 bg-green-500/5",
          showResult && !isCorrect && "border-red-500 bg-red-500/5",
          !showResult && "border-border"
        )}
      />

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
                {exercise.answer}
              </span>
            </p>
          )}
          <p className="text-foreground/70">{exercise.explanation}</p>
        </motion.div>
      )}
    </div>
  );
}

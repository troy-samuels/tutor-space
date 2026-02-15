"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { MultipleChoiceExercise as MCExerciseType, RecapUIStrings } from "@/lib/recap/types";
import { DEFAULT_UI_STRINGS } from "@/lib/recap/types";

type MultipleChoiceExerciseProps = {
  exercise: MCExerciseType;
  onAnswer: (correct: boolean) => void;
  uiStrings?: RecapUIStrings;
};

export default function MultipleChoiceExercise({
  exercise,
  onAnswer,
  uiStrings,
}: MultipleChoiceExerciseProps) {
  const ui = { ...DEFAULT_UI_STRINGS, ...uiStrings };
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  const correctIndex = exercise.correct;
  const options = exercise.options;

  const handleSelect = (index: number) => {
    if (showResult) return;
    setSelected(index);
    setShowResult(true);
    onAnswer(index === correctIndex);
  };

  const getOptionStyle = (index: number) => {
    if (!showResult) {
      return "border-border hover:border-primary/50";
    }
    if (index === correctIndex) {
      return "border-green-500 bg-green-500/10";
    }
    if (index === selected && index !== correctIndex) {
      return "border-red-500 bg-red-500/10";
    }
    return "border-border opacity-50";
  };

  return (
    <div>
      {/* Question */}
      <p className="mb-6 text-lg font-medium leading-relaxed text-foreground">
        {exercise.question}
      </p>

      {/* Options */}
      <div className="flex flex-col gap-3">
        {options.map((option, i) => (
          <motion.button
            key={i}
            onClick={() => handleSelect(i)}
            disabled={showResult}
            className={cn(
              "rounded-xl border bg-card p-4 text-left text-foreground transition-colors",
              getOptionStyle(i),
              !showResult && "cursor-pointer active:scale-[0.98]"
            )}
            whileTap={!showResult ? { scale: 0.97 } : undefined}
          >
            <span className="flex items-center gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border text-xs font-medium text-muted-foreground">
                {String.fromCharCode(65 + i)}
              </span>
              <span>{option}</span>
              {showResult && i === correctIndex && (
                <span className="ml-auto text-green-500">✓</span>
              )}
              {showResult && i === selected && i !== correctIndex && (
                <span className="ml-auto text-red-500">✗</span>
              )}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Explanation */}
      {showResult && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={cn(
            "mt-4 rounded-xl p-4 text-sm leading-relaxed",
            selected === correctIndex
              ? "bg-green-500/10 text-green-300"
              : "bg-red-500/10 text-red-300"
          )}
        >
          <p className="mb-1 font-semibold">
            {selected === correctIndex ? ui.correct : ui.notQuite}
          </p>
          <p className="text-foreground/70">{exercise.explanation}</p>
        </motion.div>
      )}
    </div>
  );
}

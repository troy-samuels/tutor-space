"use client";

import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { WordOrderExercise as WOExerciseType, RecapUIStrings } from "@/lib/recap/types";
import { DEFAULT_UI_STRINGS } from "@/lib/recap/types";

type WordOrderExerciseProps = {
  exercise: WOExerciseType;
  onAnswer: (correct: boolean) => void;
  uiStrings?: RecapUIStrings;
};

export default function WordOrderExercise({
  exercise,
  onAnswer,
  uiStrings,
}: WordOrderExerciseProps) {
  const ui = { ...DEFAULT_UI_STRINGS, ...uiStrings };
  const words = exercise.words;
  const correctOrder = exercise.correctOrder;
  const correctSentence = exercise.correctSentence;

  const [placed, setPlaced] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Words remaining in the pool (indices not yet placed)
  const poolIndices = words
    .map((_, i) => i)
    .filter((i) => !placed.includes(i));

  const handleTapPool = useCallback(
    (wordIndex: number) => {
      if (showResult) return;
      setPlaced((prev) => [...prev, wordIndex]);
    },
    [showResult]
  );

  const handleTapPlaced = useCallback(
    (positionIndex: number) => {
      if (showResult) return;
      setPlaced((prev) => prev.filter((_, i) => i !== positionIndex));
    },
    [showResult]
  );

  const handleCheck = useCallback(() => {
    if (showResult || placed.length !== words.length) return;

    // Check if the placed order matches correctOrder
    const correct =
      placed.length === correctOrder.length &&
      placed.every((v, i) => v === correctOrder[i]);

    setIsCorrect(correct);
    setShowResult(true);
    onAnswer(correct);
  }, [placed, words.length, correctOrder, showResult, onAnswer]);

  return (
    <div>
      {/* Instruction */}
      <p className="mb-6 text-lg font-medium leading-relaxed text-foreground">
        {exercise.question || ui.arrangeWords}
      </p>

      {/* Answer zone */}
      <div
        className={cn(
          "flex min-h-[60px] flex-wrap gap-2 rounded-xl border-2 border-dashed p-4",
          showResult && isCorrect
            ? "border-green-500/50 bg-green-500/5"
            : showResult && !isCorrect
              ? "border-red-500/50 bg-red-500/5"
              : "border-border bg-card/50"
        )}
      >
        <AnimatePresence mode="popLayout">
          {placed.length === 0 && !showResult && (
            <motion.span
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              className="text-sm text-muted-foreground"
            >
              {ui.tapWordsHere}
            </motion.span>
          )}
          {placed.map((wordIndex, posIndex) => (
            <motion.button
              key={`placed-${wordIndex}`}
              layoutId={`word-${wordIndex}`}
              onClick={() => handleTapPlaced(posIndex)}
              disabled={showResult}
              className={cn(
                "rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                showResult && isCorrect
                  ? "border-green-500 bg-green-500/10 text-green-300"
                  : showResult && !isCorrect
                    ? "border-red-500/50 bg-red-500/5 text-foreground"
                    : "cursor-pointer border-primary/50 bg-primary/10 text-foreground hover:bg-primary/20"
              )}
            >
              {words[wordIndex]}
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      {/* Word pool */}
      <div className="mt-4 flex flex-wrap gap-2">
        <AnimatePresence mode="popLayout">
          {poolIndices.map((wordIndex) => (
            <motion.button
              key={`pool-${wordIndex}`}
              layoutId={`word-${wordIndex}`}
              onClick={() => handleTapPool(wordIndex)}
              className={cn(
                "cursor-pointer rounded-lg border border-border bg-card px-4 py-2",
                "text-sm font-medium text-foreground transition-colors",
                "hover:border-primary/50 hover:bg-card/80 active:scale-[0.97]"
              )}
            >
              {words[wordIndex]}
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      {/* Check button */}
      {!showResult && (
        <button
          onClick={handleCheck}
          disabled={placed.length !== words.length}
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
              {ui.correctSentenceLabel}{" "}
              <span className="font-semibold text-green-400">
                {correctSentence}
              </span>
            </p>
          )}
          <p className="text-foreground/70">{exercise.explanation}</p>
        </motion.div>
      )}
    </div>
  );
}

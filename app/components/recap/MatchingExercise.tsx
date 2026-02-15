"use client";

import { useCallback, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { MatchingExercise as MatchingExerciseType, RecapUIStrings } from "@/lib/recap/types";
import { DEFAULT_UI_STRINGS } from "@/lib/recap/types";

type MatchingExerciseProps = {
  exercise: MatchingExerciseType;
  onAnswer: (correct: boolean) => void;
  uiStrings?: RecapUIStrings;
};

export default function MatchingExerciseComponent({
  exercise,
  onAnswer,
  uiStrings,
}: MatchingExerciseProps) {
  const ui = { ...DEFAULT_UI_STRINGS, ...uiStrings };

  // Shuffle right column but track original indices for correct matching
  const shuffledRight = useMemo(() => {
    const indices = exercise.rightItems.map((_, i) => i);
    // Fisher-Yates shuffle
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [selectedRight, setSelectedRight] = useState<number | null>(null);
  const [matches, setMatches] = useState<Map<number, number>>(new Map()); // left → shuffled right index
  const [showResult, setShowResult] = useState(false);
  const [correctPairs, setCorrectPairs] = useState<Set<number>>(new Set());
  const [wrongPairs, setWrongPairs] = useState<Set<number>>(new Set());

  const isLeftMatched = (i: number) => matches.has(i);
  const isRightMatched = (shuffledIdx: number) =>
    [...matches.values()].includes(shuffledIdx);

  const handleLeftTap = useCallback(
    (leftIdx: number) => {
      if (showResult || isLeftMatched(leftIdx)) return;
      setSelectedLeft(leftIdx);

      // If right was already selected, try to make a match
      if (selectedRight !== null && !isRightMatched(selectedRight)) {
        setMatches((prev) => new Map(prev).set(leftIdx, selectedRight));
        setSelectedLeft(null);
        setSelectedRight(null);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [showResult, selectedRight, matches]
  );

  const handleRightTap = useCallback(
    (shuffledIdx: number) => {
      if (showResult || isRightMatched(shuffledIdx)) return;
      setSelectedRight(shuffledIdx);

      // If left was already selected, try to make a match
      if (selectedLeft !== null && !isLeftMatched(selectedLeft)) {
        setMatches((prev) => new Map(prev).set(selectedLeft, shuffledIdx));
        setSelectedLeft(null);
        setSelectedRight(null);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [showResult, selectedLeft, matches]
  );

  const handleCheck = useCallback(() => {
    if (showResult || matches.size !== exercise.leftItems.length) return;

    const correct = new Set<number>();
    const wrong = new Set<number>();

    matches.forEach((shuffledRightIdx, leftIdx) => {
      const originalRightIdx = shuffledRight[shuffledRightIdx];
      if (leftIdx === originalRightIdx) {
        correct.add(leftIdx);
      } else {
        wrong.add(leftIdx);
      }
    });

    setCorrectPairs(correct);
    setWrongPairs(wrong);
    setShowResult(true);
    onAnswer(wrong.size === 0);
  }, [matches, exercise.leftItems.length, shuffledRight, showResult, onAnswer]);

  // Allow unmatching by tapping a matched pair
  const handleUnmatch = useCallback(
    (leftIdx: number) => {
      if (showResult) return;
      setMatches((prev) => {
        const next = new Map(prev);
        next.delete(leftIdx);
        return next;
      });
    },
    [showResult]
  );

  const getLeftStyle = (i: number) => {
    if (showResult) {
      if (correctPairs.has(i)) return "border-green-500 bg-green-500/10";
      if (wrongPairs.has(i)) return "border-red-500 bg-red-500/10";
    }
    if (isLeftMatched(i)) return "border-primary/50 bg-primary/10";
    if (selectedLeft === i) return "border-primary bg-primary/15";
    return "border-border hover:border-primary/50";
  };

  const getRightStyle = (shuffledIdx: number) => {
    if (showResult) {
      // Find which left this right is matched to
      const leftIdx = [...matches.entries()].find(
        ([, r]) => r === shuffledIdx
      )?.[0];
      if (leftIdx !== undefined) {
        if (correctPairs.has(leftIdx)) return "border-green-500 bg-green-500/10";
        if (wrongPairs.has(leftIdx)) return "border-red-500 bg-red-500/10";
      }
    }
    if (isRightMatched(shuffledIdx)) return "border-primary/50 bg-primary/10";
    if (selectedRight === shuffledIdx) return "border-primary bg-primary/15";
    return "border-border hover:border-primary/50";
  };

  return (
    <div>
      <p className="mb-6 text-lg font-medium leading-relaxed text-foreground">
        {exercise.question || ui.matchThePairs}
      </p>

      {/* Matching grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Left column */}
        <div className="flex flex-col gap-2">
          {exercise.leftItems.map((item, i) => (
            <motion.button
              key={`left-${i}`}
              onClick={() =>
                isLeftMatched(i) ? handleUnmatch(i) : handleLeftTap(i)
              }
              disabled={showResult}
              className={cn(
                "rounded-xl border p-3 text-left text-sm font-medium text-foreground transition-colors",
                getLeftStyle(i)
              )}
              whileTap={!showResult ? { scale: 0.97 } : undefined}
            >
              <span className="flex items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-[10px] font-bold text-foreground/60">
                  {i + 1}
                </span>
                <span>{item}</span>
              </span>
            </motion.button>
          ))}
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-2">
          {shuffledRight.map((originalIdx, shuffledIdx) => (
            <motion.button
              key={`right-${shuffledIdx}`}
              onClick={() => handleRightTap(shuffledIdx)}
              disabled={showResult || isRightMatched(shuffledIdx)}
              className={cn(
                "rounded-xl border p-3 text-left text-sm font-medium text-foreground transition-colors",
                getRightStyle(shuffledIdx)
              )}
              whileTap={!showResult ? { scale: 0.97 } : undefined}
            >
              <span className="flex items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-[10px] font-bold text-foreground/60">
                  {String.fromCharCode(65 + shuffledIdx)}
                </span>
                <span>{exercise.rightItems[originalIdx]}</span>
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Match count indicator */}
      <p className="mt-3 text-center text-xs text-muted-foreground">
        {matches.size}/{exercise.leftItems.length} matched
      </p>

      {/* Check button */}
      {!showResult && (
        <button
          onClick={handleCheck}
          disabled={matches.size !== exercise.leftItems.length}
          className={cn(
            "mt-4 w-full rounded-xl bg-primary py-3 font-semibold text-white",
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
            wrongPairs.size === 0
              ? "bg-green-500/10 text-green-300"
              : "bg-red-500/10 text-red-300"
          )}
        >
          <p className="mb-1 font-semibold">
            {wrongPairs.size === 0 ? ui.correct : ui.notQuite}
          </p>
          {wrongPairs.size > 0 && (
            <div className="mb-2 text-foreground/70">
              {[...wrongPairs].map((leftIdx) => {
                const correctRight = exercise.rightItems[leftIdx];
                return (
                  <p key={leftIdx}>
                    {exercise.leftItems[leftIdx]} → {correctRight}
                  </p>
                );
              })}
            </div>
          )}
          <p className="text-foreground/70">{exercise.explanation}</p>
        </motion.div>
      )}
    </div>
  );
}

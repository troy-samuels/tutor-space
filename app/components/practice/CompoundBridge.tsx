"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo, useRef, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import GameTile from "./GameTile";

interface CompoundStep {
  /** The compound word (2 characters) */
  compound: string;
  /** English meaning */
  meaning: string;
}

interface CompoundBridgeProps {
  /** The full chain of compound words. Each pair shares one character with the next. */
  chain: CompoundStep[];
  /** Choices for each step (character options to pick from) */
  choices: string[][];
  onComplete: (score: number) => void;
  onExit?: () => void;
}

/** Sample data for Chinese Compound Bridge */
export const SAMPLE_ZH_CHAIN: CompoundStep[] = [
  { compound: "电力", meaning: "Electric power" },
  { compound: "电话", meaning: "Telephone" },
  { compound: "谈话", meaning: "Conversation" },
  { compound: "谈心", meaning: "Heart-to-heart" },
  { compound: "心情", meaning: "Mood" },
];

export const SAMPLE_ZH_CHOICES: string[][] = [
  [], // First step is given
  ["话", "子", "车", "视"],
  ["谈", "说", "言", "读"],
  ["心", "口", "手", "目"],
  ["情", "意", "志", "感"],
];

export default function CompoundBridge({
  chain,
  choices,
  onComplete,
  onExit,
}: CompoundBridgeProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedChar, setSelectedChar] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [completedSteps, setCompletedSteps] = useState<string[]>(
    chain.length > 0 ? [chain[0].compound] : []
  );
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Guard: need at least 2 steps for a chain
  if (chain.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full p-8 text-center">
        <p className="text-muted-foreground">No chain data available.</p>
        <button
          type="button"
          onClick={() => onComplete(0)}
          className="mt-4 bg-primary text-primary-foreground px-6 py-3 rounded-2xl font-semibold"
        >
          Go Back
        </button>
      </div>
    );
  }

  const isLastStep = currentStep >= chain.length - 1;
  const progress = ((currentStep + 1) / chain.length) * 100;

  // The "bridge" character — shared between current and next compound
  const bridgeChar = useMemo(() => {
    if (currentStep >= chain.length - 1) return null;
    const current = chain[currentStep].compound;
    const next = chain[currentStep + 1].compound;
    // Find shared character
    for (const c of current) {
      if (next.includes(c)) return c;
    }
    return current[1]; // fallback: second char of current
  }, [currentStep, chain]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleSelect = (char: string) => {
    if (feedback) return;
    if (currentStep + 1 >= chain.length) return;
    setSelectedChar(char);

    const nextCompound = chain[currentStep + 1].compound;
    // Determine the exact expected character based on bridge position
    const currentCompound = chain[currentStep].compound;
    const sharedIdx = nextCompound.indexOf(currentCompound[1]);
    const expectedChar =
      sharedIdx === 0
        ? nextCompound[1]
        : sharedIdx === 1
          ? nextCompound[0]
          : nextCompound.replace(bridgeChar ?? "", "")[0];
    const isCorrect = char === expectedChar;

    if (isCorrect) {
      setFeedback("correct");
      setScore((s) => s + 1);
      setCompletedSteps((prev) => [...prev, nextCompound]);
    } else {
      setFeedback("wrong");
    }

    // Auto-advance after feedback
    timerRef.current = setTimeout(
      () => {
        if (currentStep + 1 >= chain.length - 1) {
          onComplete(isCorrect ? score + 1 : score);
        } else {
          setCurrentStep((s) => s + 1);
          setSelectedChar(null);
          setFeedback(null);
        }
      },
      isCorrect ? 800 : 1200
    );
  };

  return (
    <div className="flex flex-col min-h-full bg-background p-6">
      {/* Progress */}
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-8">
        <motion.div
          className="h-full bg-primary rounded-full"
          animate={{ width: `${progress}%` }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      </div>

      {/* Title */}
      <h2 className="text-xl font-bold text-center mb-2">Compound Bridge</h2>
      <p className="text-sm text-muted-foreground text-center mb-8">
        Chain compound words by keeping one character
      </p>

      {/* Chain visualisation */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
        {completedSteps.map((compound, i) => (
          <motion.div
            key={`${compound}-${i}`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-1"
          >
            {i > 0 && (
              <ArrowRight className="w-4 h-4 text-muted-foreground mx-1" />
            )}
            <div className="flex gap-0.5">
              {compound.split("").map((char, ci) => (
                <GameTile
                  key={`${char}-${ci}`}
                  char={char}
                  state={i < completedSteps.length - 1 ? "correct" : "active"}
                  isCJK
                  disabled
                />
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Current meaning */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="text-center mb-8"
        >
          <p className="text-lg text-foreground font-semibold">
            {chain[currentStep].compound}
          </p>
          <p className="text-sm text-muted-foreground">
            {chain[currentStep].meaning}
          </p>
          {bridgeChar && !isLastStep && (
            <p className="text-xs text-primary mt-2">
              Keep &quot;{bridgeChar}&quot; — pick the next character
            </p>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Choices */}
      {!isLastStep && currentStep + 1 < choices.length && (
        <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
          {choices[currentStep + 1].map((char) => {
            const isSelected = selectedChar === char;
            const nextCompound = chain[currentStep + 1].compound;
            const isCorrectChar = nextCompound.includes(char);
            let state: "idle" | "active" | "correct" | "wrong" = "idle";

            if (isSelected && feedback === "correct") state = "correct";
            else if (isSelected && feedback === "wrong") state = "wrong";
            else if (feedback === "wrong" && isCorrectChar) state = "correct";

            return (
              <GameTile
                key={char}
                char={char}
                state={state}
                isCJK
                onClick={() => handleSelect(char)}
                disabled={feedback !== null}
              />
            );
          })}
        </div>
      )}

      {/* Score */}
      <div className="mt-auto pt-6 text-center">
        <p className="text-sm text-muted-foreground">
          Score: {score} / {chain.length - 1}
        </p>
      </div>
    </div>
  );
}

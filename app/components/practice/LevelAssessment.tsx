"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Sparkles, Zap, ChevronRight, Lock } from "lucide-react";
import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { ASSESSMENT_EXERCISES } from "@/lib/practice/catalogue-bridge";
import type { AssessmentExercise } from "@/components/practice/mock-data";
import WordTile from "./WordTile";
import ListenButton from "./ListenButton";
import VoiceInputToggle from "./VoiceInputToggle";

interface LevelAssessmentProps {
  languageCode: string;
  onComplete: () => void;
  tier?: "free" | "basic" | "unlimited" | "solo";
  adaptiveEnabled?: boolean;
  voiceInputEnabled?: boolean;
  upgradePriceCents?: number | null;
}

type AnswerState = "idle" | "correct" | "wrong";
type MiniPromptReason = "voice" | "adaptive";

const springTransition = {
  type: "spring" as const,
  stiffness: 400,
  damping: 30,
};

export default function LevelAssessment({
  languageCode,
  onComplete,
  tier = "free",
  adaptiveEnabled,
  voiceInputEnabled,
  upgradePriceCents,
}: LevelAssessmentProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answerState, setAnswerState] = useState<AnswerState>("idle");
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [totalXp, setTotalXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showXpPop, setShowXpPop] = useState(false);
  const [xpPopAmount, setXpPopAmount] = useState(0);
  const [orderedWords, setOrderedWords] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<string[]>([]);
  const [miniPromptReason, setMiniPromptReason] = useState<MiniPromptReason | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const exercises =
    ASSESSMENT_EXERCISES[languageCode] || ASSESSMENT_EXERCISES.es;
  const current = exercises[currentIndex];
  const totalQuestions = exercises.length;
  const progress = (currentIndex / totalQuestions) * 100;
  const resolvedAdaptiveEnabled =
    adaptiveEnabled ?? (tier === "unlimited" || tier === "solo");
  const resolvedVoiceInputEnabled =
    voiceInputEnabled ?? (tier === "unlimited" || tier === "solo");
  const effectiveUpgradePriceCents = upgradePriceCents ?? 499;
  const formattedUpgradePrice = `$${(effectiveUpgradePriceCents / 100).toFixed(2)}/mo`;

  const difficultyColors: Record<string, string> = {
    easy: "text-accent",
    medium: "text-primary",
    hard: "text-[#C4563F]",
    expert: "text-[#9A5EC4]",
    master: "text-[#E84D8A]",
  };

  // Reset state when question changes
  useEffect(() => {
    if (current?.type === "word-order" && current.words) {
      setAvailableWords([...current.words]);
      setOrderedWords([]);
    }
    setSelectedOption(null);
    setAnswerState("idle");
  }, [currentIndex, current?.type, current?.words]);

  const awardXp = useCallback(
    (amount: number) => {
      const bonus = streak >= 3 ? Math.floor(amount * 0.5) : 0;
      const total = amount + bonus;
      setTotalXp((prev) => prev + total);
      setXpPopAmount(total);
      setShowXpPop(true);
      setTimeout(() => setShowXpPop(false), 1200);
    },
    [streak]
  );

  const advance = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (currentIndex >= totalQuestions - 1) {
        onComplete();
      } else {
        setCurrentIndex((prev) => prev + 1);
      }
    }, 1200);
  }, [currentIndex, totalQuestions, onComplete]);

  const handleOptionSelect = useCallback(
    (index: number, exercise: AssessmentExercise) => {
      if (answerState !== "idle") return;
      setSelectedOption(index);

      const correctIdx = exercise.correctIndex ?? 0;

      if (index === correctIdx) {
        setAnswerState("correct");
        setStreak((s) => s + 1);
        awardXp(exercise.xp);
      } else {
        setAnswerState("wrong");
        setStreak(0);
      }
      advance();
    },
    [answerState, awardXp, advance]
  );

  const handleWordTap = (word: string) => {
    if (answerState !== "idle") return;
    setOrderedWords((prev) => [...prev, word]);
    setAvailableWords((prev) => {
      const idx = prev.indexOf(word);
      return [...prev.slice(0, idx), ...prev.slice(idx + 1)];
    });
  };

  const handleWordRemove = (index: number) => {
    if (answerState !== "idle") return;
    const word = orderedWords[index];
    setOrderedWords((prev) => [
      ...prev.slice(0, index),
      ...prev.slice(index + 1),
    ]);
    setAvailableWords((prev) => [...prev, word]);
  };

  const handleWordOrderSubmit = () => {
    if (!current.correctOrder) return;
    const isCorrect =
      orderedWords.length === current.correctOrder.length &&
      orderedWords.every((w, i) => w === current.correctOrder![i]);

    if (isCorrect) {
      setAnswerState("correct");
      setStreak((s) => s + 1);
      awardXp(current.xp);
    } else {
      setAnswerState("wrong");
      setStreak(0);
    }
    advance();
  };

  const expectedVoiceAnswers = useMemo(() => {
    if (!current) return [];

    if (
      (current.type === "multiple-choice" || current.type === "fill-blank") &&
      current.options
    ) {
      const correctIndex = current.correctIndex ?? 0;
      const correctOption = current.options[correctIndex];
      return correctOption ? [correctOption] : [];
    }

    if (current.type === "word-order" && current.correctOrder) {
      return [current.correctOrder.join(" ")];
    }

    return [];
  }, [current]);

  const handleVoiceMatch = useCallback(() => {
    if (answerState !== "idle") return;

    if (
      (current.type === "multiple-choice" || current.type === "fill-blank") &&
      current.options
    ) {
      handleOptionSelect(current.correctIndex ?? 0, current);
      return;
    }

    if (current.type === "word-order" && current.correctOrder) {
      setOrderedWords(current.correctOrder);
      setAvailableWords([]);
      setAnswerState("correct");
      setStreak((prev) => prev + 1);
      awardXp(current.xp);
      advance();
    }
  }, [answerState, current, awardXp, advance, handleOptionSelect]);

  /** Opens a short-lived inline upgrade prompt for a locked feature. */
  const showLockedFeaturePrompt = useCallback((reason: MiniPromptReason) => {
    setMiniPromptReason(reason);
    setTimeout(() => setMiniPromptReason(null), 2600);
  }, []);

  return (
    <div className="flex flex-col h-[100dvh] relative">
      {/* Voice input toggle - top right */}
      {resolvedVoiceInputEnabled ? (
        <VoiceInputToggle
          languageCode={languageCode}
          expectedAnswers={expectedVoiceAnswers}
          onMatch={handleVoiceMatch}
          disabled={answerState !== "idle"}
          className="absolute right-4 top-4 z-30"
        />
      ) : null}

      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        {/* Progress bar with glow */}
        <div className="flex items-center gap-3 mb-1">
          <div className="flex-1 h-3 rounded-full bg-stone-100 border border-stone-200 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary to-amber-500 shadow-[0_0_20px_-5px_rgba(232,120,77,0.5)]"
              initial={{ width: 0 }}
              animate={{
                width: `${progress}%`,
                opacity: [0.7, 1, 0.7],
              }}
              transition={{
                width: { type: "spring", stiffness: 80, damping: 15 },
                opacity: { duration: 2, repeat: Infinity, ease: "easeInOut" },
              }}
            />
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-primary tabular-nums">
              {totalXp}
            </span>
          </div>
        </div>

        {/* Streak + difficulty */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {streak >= 2 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={springTransition}
                className="text-sm"
              >
                🔥 {streak} streak
              </motion.span>
            )}
            {streak >= 3 && (
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={springTransition}
                className="text-[10px] text-[#E8A84D] backdrop-blur-md bg-[#E8A84D]/10 px-1.5 py-0.5 rounded-full border border-primary/30 shadow-[0_0_15px_-5px_rgba(232,168,77,0.3)]"
              >
                1.5× XP
              </motion.span>
            )}

            {resolvedAdaptiveEnabled ? (
              <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded-full border border-primary/20">
                Adaptive ON
              </span>
            ) : null}
            {resolvedVoiceInputEnabled ? null : null}
          </div>
          <span
            className={`text-xs font-medium uppercase tracking-wider ${
              difficultyColors[current.difficulty]
            }`}
          >
            {current.difficulty}
          </span>
        </div>
      </div>

      {/* Exercise area */}
      <div className="flex-1 px-4 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className={`space-y-6 p-5 rounded-3xl bg-stone-50 border ${
              streak >= 3 ? "border-primary/30" : "border-stone-200"
            } transition-colors`}
          >
            {/* Question prompt */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 text-xs text-muted-foreground mb-2 border border-stone-200">
                <Sparkles className="w-3 h-3 text-primary" />
                Question {currentIndex + 1} of {totalQuestions}
              </div>
              <div className="flex items-start justify-center gap-2 px-1">
                <h2 className="text-lg font-semibold leading-snug text-center">
                  {current.prompt}
                </h2>
                <ListenButton text={current.prompt} languageCode={languageCode} />
              </div>
            </div>

            {/* ─── Multiple Choice ─── */}
            {current.type === "multiple-choice" && current.options && (
              <div className="space-y-3">
                {current.options.map((option, i) => {
                  const isSelected = selectedOption === i;
                  const isCorrect = i === current.correctIndex;
                  let bgClass =
                    "bg-stone-50 border-stone-200";
                  let textClass = "text-foreground";

                  if (answerState !== "idle") {
                    if (isCorrect) {
                      bgClass =
                        "backdrop-blur-md bg-accent/[0.15] border-accent shadow-[0_0_20px_-10px_rgba(90,122,94,0.4)]";
                      textClass = "text-accent";
                    } else if (isSelected && !isCorrect) {
                      bgClass =
                        "backdrop-blur-md bg-[#C4563F]/[0.15] border-[#C4563F] shadow-[0_0_20px_-10px_rgba(196,86,63,0.4)]";
                      textClass = "text-[#C4563F]";
                    }
                  }

                  return (
                    <motion.button
                      key={i}
                      whileTap={
                        answerState === "idle"
                          ? { scale: 0.97 }
                          : undefined
                      }
                      transition={springTransition}
                      onClick={() => handleOptionSelect(i, current)}
                      disabled={answerState !== "idle"}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all ${bgClass}`}
                    >
                      <span
                        className={`w-8 h-8 rounded-full border flex items-center justify-center text-sm font-medium shrink-0 ${
                          answerState !== "idle" && isCorrect
                            ? "border-accent bg-accent text-background"
                            : answerState !== "idle" &&
                              isSelected &&
                              !isCorrect
                            ? "border-[#C4563F] bg-[#C4563F] text-background"
                            : "border-stone-300 text-muted-foreground"
                        }`}
                      >
                        {answerState !== "idle" && isCorrect ? (
                          <Check className="w-4 h-4" />
                        ) : answerState !== "idle" &&
                          isSelected &&
                          !isCorrect ? (
                          <X className="w-4 h-4" />
                        ) : (
                          String.fromCharCode(65 + i)
                        )}
                      </span>
                      <span className={`text-sm text-left ${textClass}`}>
                        {option}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            )}

            {/* ─── Fill in the Blank ─── */}
            {current.type === "fill-blank" && current.sentence && (
              <div className="space-y-5">
                {/* Sentence with blank */}
                <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5 text-center">
                  <p className="text-lg leading-relaxed">
                    {current.sentence.split("___").map((part, i, arr) => (
                      <span key={i}>
                        {part}
                        {i < arr.length - 1 && (
                          <span
                            className={`inline-block min-w-[80px] mx-1 px-3 py-0.5 rounded-lg border-b-2 text-lg font-semibold ${
                              answerState === "correct"
                                ? "border-accent text-accent bg-accent/10"
                                : answerState === "wrong"
                                ? "border-[#C4563F] text-[#C4563F] bg-[#C4563F]/10"
                                : "border-primary text-primary/50"
                            }`}
                          >
                            {selectedOption !== null && current.options
                              ? current.options[selectedOption]
                              : "___"}
                          </span>
                        )}
                      </span>
                    ))}
                  </p>
                </div>

                {/* Options grid */}
                <div className="grid grid-cols-2 gap-2.5">
                  {current.options?.map((option, i) => {
                    const isSelected = selectedOption === i;
                    const correctIdx = current.correctIndex ?? 0;
                    const isCorrect = i === correctIdx;
                    let style =
                      "bg-stone-50 border-stone-200 text-foreground";

                    if (answerState !== "idle") {
                      if (isCorrect) {
                        style =
                          "backdrop-blur-md bg-accent/[0.15] border-accent text-accent shadow-[0_0_20px_-10px_rgba(90,122,94,0.4)]";
                      } else if (isSelected && !isCorrect) {
                        style =
                          "backdrop-blur-md bg-[#C4563F]/[0.15] border-[#C4563F] text-[#C4563F] shadow-[0_0_20px_-10px_rgba(196,86,63,0.4)]";
                      } else {
                        style =
                          "bg-stone-100/50 border-stone-200 text-muted-foreground/50";
                      }
                    }

                    return (
                      <motion.button
                        key={i}
                        whileTap={
                          answerState === "idle"
                            ? { scale: 0.95 }
                            : undefined
                        }
                        transition={springTransition}
                        onClick={() => handleOptionSelect(i, current)}
                        disabled={answerState !== "idle"}
                        className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all ${style}`}
                      >
                        {option}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ─── Word Order with WordTile ─── */}
            {current.type === "word-order" && (
              <div className="space-y-5">
                {/* Drop zone */}
                <div className="bg-stone-100 border border-stone-200 rounded-2xl p-4 min-h-[60px] flex flex-wrap gap-2 items-center">
                  {orderedWords.length === 0 && (
                    <span className="text-muted-foreground/50 text-sm">
                      Tap words below to build the sentence…
                    </span>
                  )}
                  {orderedWords.map((word, i) => (
                    <WordTile
                      key={`placed-${i}`}
                      word={word}
                      state={
                        answerState === "correct"
                          ? "correct"
                          : answerState === "wrong"
                          ? "wrong"
                          : "placed"
                      }
                      onClick={() => handleWordRemove(i)}
                      layoutId={`word-${word}-${i}`}
                      disabled={answerState !== "idle"}
                    />
                  ))}
                </div>

                {/* Word bank */}
                <div className="flex flex-wrap gap-2 justify-center">
                  {availableWords.map((word, i) => (
                    <WordTile
                      key={`bank-${word}-${i}`}
                      word={word}
                      state="available"
                      onClick={() => handleWordTap(word)}
                      layoutId={`word-${word}-${i}`}
                      disabled={answerState !== "idle"}
                    />
                  ))}
                </div>

                {/* Submit */}
                {orderedWords.length > 0 && answerState === "idle" && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileTap={{ scale: 0.98 }}
                    transition={springTransition}
                    onClick={handleWordOrderSubmit}
                    className="w-full py-3.5 rounded-full backdrop-blur-xl bg-primary text-background font-semibold text-sm flex items-center justify-center gap-2 shadow-[0_0_30px_-10px_rgba(232,120,77,0.4)]"
                  >
                    Check answer
                    <ChevronRight className="w-4 h-4" />
                  </motion.button>
                )}

                {/* Correct answer on wrong */}
                {answerState === "wrong" && current.correctOrder && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center"
                  >
                    <p className="text-xs text-muted-foreground mb-1">
                      Correct answer:
                    </p>
                    <p className="text-sm text-accent font-medium">
                      {current.correctOrder.join(" ")}
                    </p>
                  </motion.div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {miniPromptReason && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={springTransition}
            className="absolute bottom-20 left-1/2 z-50 w-[92%] max-w-sm -translate-x-1/2 rounded-2xl border border-primary/35 bg-[#080807]/85 px-4 py-3 backdrop-blur-xl shadow-[0_16px_40px_rgba(0,0,0,0.45)]"
          >
            <p className="text-sm font-semibold text-foreground">
              {miniPromptReason === "voice" ? "Voice input is locked" : "Adaptive mode is locked"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Upgrade to Unlimited Practice ({formattedUpgradePrice}) to unlock this feature.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* XP Pop animation with upward drift */}
      <AnimatePresence>
        {showXpPop && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: -40, scale: 1 }}
            exit={{ opacity: 0, y: -60, scale: 0.5 }}
            transition={{ type: "spring", stiffness: 200, damping: 12 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none"
          >
            <div className="backdrop-blur-xl bg-primary rounded-2xl px-6 py-3 shadow-[0_8px_30px_rgba(232,120,77,0.5)]">
              <span className="text-background font-bold text-2xl">
                +{xpPopAmount} XP
              </span>
              {streak >= 3 && (
                <span className="block text-background/70 text-xs text-center">
                  🔥 Streak bonus!
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Correct / Wrong feedback flash */}
      <AnimatePresence>
        {answerState === "correct" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none bg-accent/5 z-40"
          />
        )}
        {answerState === "wrong" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 pointer-events-none bg-[#C4563F]/5 z-40"
          />
        )}
      </AnimatePresence>
    </div>
  );
}

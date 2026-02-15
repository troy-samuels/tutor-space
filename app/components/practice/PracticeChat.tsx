"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUp,
  Check,
  X,
  Zap,
  Heart,
  Sparkles,
  ChevronRight,
  Flame,
  Lock,
} from "lucide-react";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import ChatBubble from "./ChatBubble";
import CorrectionChip from "./CorrectionChip";
import TypingIndicator from "./TypingIndicator";
import WordTile from "./WordTile";
import ListenButton from "./ListenButton";
import VoiceInputToggle from "./VoiceInputToggle";
import WhyInsightCard from "./WhyInsightCard";
import {
  PRACTICE_SESSIONS,
  LANGUAGES,
  getPracticeExercisesForDifficulty,
  getPracticeSessionForLanguage,
} from "@/lib/practice/catalogue-bridge";
import type {
  PracticeExercise,
  ErrorCorrection,
  PracticeSession,
  PracticeDifficultyBand,
} from "@/components/practice/mock-data";

interface PracticeChatProps {
  languageCode: string;
  difficultyMultiplier: 1 | 1.5 | 2;
  correctStreak: number;
  exerciseContext?: {
    topic: string;
    vocabularyFocus: string[];
    grammarFocus: string[];
    tutorNotes?: string;
  } | null;
  onAnswerOutcome: (correct: boolean) => void;
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

const HEART_SLOTS = Object.freeze([0, 1, 2]);
const TAP_SCALE_95 = Object.freeze({ scale: 0.95 });
const TAP_SCALE_97 = Object.freeze({ scale: 0.97 });
const TAP_SCALE_98 = Object.freeze({ scale: 0.98 });

function getSessionForLanguage(languageCode: string): PracticeSession {
  return PRACTICE_SESSIONS[languageCode] || PRACTICE_SESSIONS.es;
}

function getPoolForBand(
  session: PracticeSession,
  band: PracticeDifficultyBand
): PracticeExercise[] {
  const pool = session.questionPools[band];
  if (pool && pool.length > 0) {
    return pool;
  }
  return session.exercises;
}

function getOpeningExercise(session: PracticeSession): PracticeExercise {
  return pickExerciseFromPool(
    getPoolForBand(session, "easy"),
    [],
    session.exercises
  );
}

function difficultyMultiplierToBand(multiplier: number): PracticeDifficultyBand {
  if (multiplier >= 2) return "hard";
  if (multiplier >= 1.5) return "medium";
  return "easy";
}

function pickExerciseFromPool(
  pool: PracticeExercise[],
  seen: PracticeExercise[],
  fallback: PracticeExercise[]
): PracticeExercise {
  const unseen = pool.filter((exercise) => !seen.includes(exercise));
  const source = unseen.length > 0 ? unseen : pool;
  const randomPick = source[Math.floor(Math.random() * source.length)];
  if (randomPick) {
    return randomPick;
  }
  return fallback[Math.min(seen.length, Math.max(0, fallback.length - 1))];
}

export default function PracticeChat({
  languageCode,
  difficultyMultiplier,
  correctStreak,
  exerciseContext = null,
  onAnswerOutcome,
  onComplete,
  tier = "free",
  adaptiveEnabled,
  voiceInputEnabled,
  upgradePriceCents,
}: PracticeChatProps) {
  const fallbackSession = useMemo(
    () => getSessionForLanguage(languageCode),
    [languageCode]
  );
  const language = useMemo(
    () =>
      LANGUAGES.find((languageItem) => languageItem.code === languageCode) ||
      LANGUAGES[0],
    [languageCode]
  );

  const [session, setSession] = useState<PracticeSession>(fallbackSession);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answerState, setAnswerState] = useState<AnswerState>("idle");
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [totalXp, setTotalXp] = useState(0);
  const [hearts, setHearts] = useState(3);
  const [showXpPop, setShowXpPop] = useState(false);
  const [xpPopAmount, setXpPopAmount] = useState(0);
  const [input, setInput] = useState("");
  const [showAiTyping, setShowAiTyping] = useState(false);
  const [showCorrection, setShowCorrection] = useState<ErrorCorrection | null>(
    null
  );
  const [whyInsight, setWhyInsight] = useState<string | null>(null);
  const [showDifficultyPulse, setShowDifficultyPulse] = useState(false);
  const [emailSaved, setEmailSaved] = useState(false);
  const [miniPromptReason, setMiniPromptReason] = useState<MiniPromptReason | null>(null);

  const [orderedWords, setOrderedWords] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<string[]>([]);
  const [exercisePath, setExercisePath] = useState<PracticeExercise[]>(() => {
    return [getOpeningExercise(fallbackSession)];
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const whyTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const miniPromptTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const xpPopTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const difficultyMultiplierRef = useRef(difficultyMultiplier);
  const previousMultiplierRef = useRef(difficultyMultiplier);
  const exercisePathRef = useRef(exercisePath);
  const currentIndexRef = useRef(currentIndex);

  const sessionExercises = useMemo(
    () =>
      session.exercises.length > 0
        ? session.exercises
        : fallbackSession.exercises,
    [fallbackSession.exercises, session.exercises]
  );
  const totalExercises = useMemo(
    () => Math.max(sessionExercises.length, 1),
    [sessionExercises.length]
  );
  const current = useMemo(
    () =>
      exercisePath[currentIndex] ??
      sessionExercises[Math.min(currentIndex, sessionExercises.length - 1)],
    [currentIndex, exercisePath, sessionExercises]
  );
  const progress = useMemo(
    () => (currentIndex / totalExercises) * 100,
    [currentIndex, totalExercises]
  );
  const resolvedAdaptiveEnabled = useMemo(
    () => adaptiveEnabled ?? (tier === "unlimited" || tier === "solo"),
    [adaptiveEnabled, tier]
  );
  const resolvedVoiceInputEnabled = useMemo(
    () => voiceInputEnabled ?? (tier === "unlimited" || tier === "solo"),
    [tier, voiceInputEnabled]
  );
  const formattedUpgradePrice = useMemo(() => {
    const priceCents = upgradePriceCents ?? 499;
    return `$${(priceCents / 100).toFixed(2)}/mo`;
  }, [upgradePriceCents]);
  const hasContext = useMemo(
    () =>
      Boolean(exerciseContext?.topic) ||
      Boolean(exerciseContext?.grammarFocus?.length) ||
      Boolean(exerciseContext?.vocabularyFocus?.length),
    [exerciseContext?.grammarFocus?.length, exerciseContext?.topic, exerciseContext?.vocabularyFocus?.length]
  );
  const difficultyBadgeLabel = useMemo(
    () =>
      difficultyMultiplier >= 2
        ? "HARD MODE"
        : difficultyMultiplier >= 1.5
        ? "RAMPING UP"
        : null,
    [difficultyMultiplier]
  );

  useEffect(() => {
    exercisePathRef.current = exercisePath;
  }, [exercisePath]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    setSession(fallbackSession);
  }, [fallbackSession]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const loadedSession = await getPracticeSessionForLanguage(languageCode);
        if (cancelled || loadedSession.exercises.length === 0) {
          return;
        }
        setSession(loadedSession);
      } catch {
        // Preserve fallback session when catalogue loading fails.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [languageCode]);

  useEffect(() => {
    difficultyMultiplierRef.current = difficultyMultiplier;
  }, [difficultyMultiplier]);

  useEffect(() => {
    if (difficultyMultiplier > previousMultiplierRef.current) {
      setShowDifficultyPulse(true);
      const pulseTimer = setTimeout(() => {
        setShowDifficultyPulse(false);
      }, 1200);
      previousMultiplierRef.current = difficultyMultiplier;
      return () => clearTimeout(pulseTimer);
    }

    previousMultiplierRef.current = difficultyMultiplier;
  }, [difficultyMultiplier]);

  useEffect(() => {
    const firstExercise = getOpeningExercise(session);
    setExercisePath([firstExercise]);
    setCurrentIndex(0);
    setAnswerState("idle");
    setSelectedOption(null);
    setShowCorrection(null);
    setWhyInsight(null);
    setShowAiTyping(false);
    setInput("");
    setTotalXp(0);
    setHearts(3);
    setOrderedWords([]);
    setAvailableWords([]);
    setMiniPromptReason(null);
  }, [session]);

  useEffect(() => {
    setSelectedOption(null);
    setAnswerState("idle");
    setShowCorrection(null);
    setShowAiTyping(false);
    setInput("");

    if (whyTimerRef.current) {
      clearTimeout(whyTimerRef.current);
      whyTimerRef.current = undefined;
    }
    setWhyInsight(null);

    if (current?.type === "word-order" && current.words) {
      setAvailableWords([...current.words]);
      setOrderedWords([]);
    }
    if (current?.type === "word-bank" && current.wordBank) {
      setAvailableWords([...current.wordBank]);
      setOrderedWords([]);
    }
    if (current?.type === "conversation") {
      setShowAiTyping(true);
      const typingTimer = setTimeout(() => setShowAiTyping(false), 900);
      return () => clearTimeout(typingTimer);
    }
  }, [currentIndex, current?.type, current?.words, current?.wordBank]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      if (whyTimerRef.current) {
        clearTimeout(whyTimerRef.current);
      }
      if (miniPromptTimerRef.current) {
        clearTimeout(miniPromptTimerRef.current);
      }
      if (xpPopTimerRef.current) {
        clearTimeout(xpPopTimerRef.current);
      }
    };
  }, []);

  const dismissWhyInsight = useCallback(() => {
    if (whyTimerRef.current) {
      clearTimeout(whyTimerRef.current);
      whyTimerRef.current = undefined;
    }
    setWhyInsight(null);
  }, []);

  /** Opens a short-lived inline upgrade prompt for a locked feature. */
  const showLockedFeaturePrompt = useCallback((reason: MiniPromptReason) => {
    setMiniPromptReason(reason);
    if (miniPromptTimerRef.current) {
      clearTimeout(miniPromptTimerRef.current);
    }
    miniPromptTimerRef.current = setTimeout(() => {
      setMiniPromptReason(null);
      miniPromptTimerRef.current = undefined;
    }, 2600);
  }, []);

  const handleVoiceLockedClick = useCallback(() => {
    showLockedFeaturePrompt("voice");
  }, [showLockedFeaturePrompt]);

  const handleAdaptiveLockedClick = useCallback(() => {
    showLockedFeaturePrompt("adaptive");
  }, [showLockedFeaturePrompt]);

  const awardXp = useCallback(
    (amount: number) => {
      const bonus = correctStreak >= 3 ? Math.floor(amount * 0.5) : 0;
      const total = amount + bonus;
      setTotalXp((prev) => prev + total);
      setXpPopAmount(total);
      setShowXpPop(true);
      if (xpPopTimerRef.current) {
        clearTimeout(xpPopTimerRef.current);
      }
      xpPopTimerRef.current = setTimeout(() => {
        setShowXpPop(false);
        xpPopTimerRef.current = undefined;
      }, 1200);
    },
    [correctStreak]
  );

  const pickNextExercise = useCallback(
    async (seenExercises: PracticeExercise[]) => {
      const band = difficultyMultiplierToBand(difficultyMultiplierRef.current);
      const fallbackPool = getPoolForBand(session, band);
      try {
        const pool = await getPracticeExercisesForDifficulty(
          languageCode,
          difficultyMultiplierRef.current
        );
        const activePool = pool.length > 0 ? pool : fallbackPool;
        return pickExerciseFromPool(activePool, seenExercises, sessionExercises);
      } catch {
        return pickExerciseFromPool(fallbackPool, seenExercises, sessionExercises);
      }
    },
    [languageCode, session, sessionExercises]
  );

  const advance = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      void (async () => {
        const activeIndex = currentIndexRef.current;
        if (activeIndex >= totalExercises - 1) {
          onComplete();
          return;
        }

        const nextIndex = activeIndex + 1;
        const activePath = exercisePathRef.current;
        if (!activePath[nextIndex]) {
          const nextExercise = await pickNextExercise(activePath);
          setExercisePath((prevPath) => {
            if (prevPath[nextIndex]) {
              return prevPath;
            }
            return [...prevPath, nextExercise];
          });
        }
        setCurrentIndex(nextIndex);
      })();
    }, current?.correction && answerState === "wrong" ? 2500 : 1300);
  }, [
    answerState,
    current?.correction,
    onComplete,
    pickNextExercise,
    totalExercises,
  ]);

  const handleCorrectAnswer = useCallback(
    (exercise: PracticeExercise) => {
      setAnswerState("correct");
      onAnswerOutcome(true);
      awardXp(exercise.xp);
      advance();
    },
    [advance, awardXp, onAnswerOutcome]
  );

  const handleWrongAnswer = useCallback(
    (exercise: PracticeExercise) => {
      setAnswerState("wrong");
      onAnswerOutcome(false);
      setHearts((heartCount) => Math.max(0, heartCount - 1));

      if (exercise.correction) {
        setShowCorrection(exercise.correction);
        setWhyInsight(exercise.correction.explanation);

        if (whyTimerRef.current) {
          clearTimeout(whyTimerRef.current);
        }

        whyTimerRef.current = setTimeout(() => {
          setWhyInsight(null);
          whyTimerRef.current = undefined;
        }, 5000);
      }

      advance();
    },
    [advance, onAnswerOutcome]
  );

  const handleOptionSelect = useCallback(
    (index: number, exercise: PracticeExercise) => {
      if (answerState !== "idle") return;
      setSelectedOption(index);

      const correctIndex =
        exercise.type === "fill-blank"
          ? (exercise.blankCorrectIndex ?? 0)
          : (exercise.correctIndex ?? 0);

      if (index === correctIndex) {
        handleCorrectAnswer(exercise);
      } else {
        handleWrongAnswer(exercise);
      }
    },
    [answerState, handleCorrectAnswer, handleWrongAnswer]
  );

  const handleWordTap = useCallback(
    (word: string) => {
      if (answerState !== "idle") return;
      setOrderedWords((prev) => [...prev, word]);
      setAvailableWords((prev) => {
        const wordIndex = prev.indexOf(word);
        return [...prev.slice(0, wordIndex), ...prev.slice(wordIndex + 1)];
      });
    },
    [answerState]
  );

  const handleWordRemove = useCallback(
    (index: number) => {
      if (answerState !== "idle") return;
      const word = orderedWords[index];
      setOrderedWords((prev) => [...prev.slice(0, index), ...prev.slice(index + 1)]);
      setAvailableWords((prev) => [...prev, word]);
    },
    [answerState, orderedWords]
  );

  const handleWordSubmit = useCallback(() => {
    let isCorrect = false;

    if (current.type === "word-order" && current.correctOrder) {
      isCorrect =
        orderedWords.length === current.correctOrder.length &&
        orderedWords.every((word, index) => word === current.correctOrder![index]);
    } else if (current.type === "word-bank" && current.targetSentence) {
      isCorrect = orderedWords.join(" ") === current.targetSentence;
    }

    if (isCorrect) {
      handleCorrectAnswer(current);
    } else {
      handleWrongAnswer(current);
    }
  }, [current, handleCorrectAnswer, handleWrongAnswer, orderedWords]);

  const handleConversationSubmit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      if (!input.trim() || answerState !== "idle") return;
      handleCorrectAnswer(current);
    },
    [answerState, current, handleCorrectAnswer, input]
  );

  const expectedVoiceAnswers = useMemo(() => {
    switch (current.type) {
      case "multiple-choice": {
        const answer = current.options?.[current.correctIndex ?? 0];
        return answer ? [answer] : [];
      }
      case "fill-blank": {
        const answer =
          current.correctAnswer ?? current.blankOptions?.[current.blankCorrectIndex ?? 0];
        return answer ? [answer] : [];
      }
      case "word-order":
        return current.correctOrder ? [current.correctOrder.join(" ")] : [];
      case "word-bank":
        return current.targetSentence ? [current.targetSentence] : [];
      case "conversation":
        return current.suggestedResponse ? [current.suggestedResponse] : [];
      default:
        return [];
    }
  }, [current]);

  const handleVoiceMatch = useCallback(
    (heardText: string) => {
      if (answerState !== "idle") return;

      switch (current.type) {
        case "multiple-choice":
          handleOptionSelect(current.correctIndex ?? 0, current);
          break;
        case "fill-blank":
          handleOptionSelect(current.blankCorrectIndex ?? 0, current);
          break;
        case "word-order":
          if (current.correctOrder) {
            setOrderedWords(current.correctOrder);
            setAvailableWords([]);
            handleCorrectAnswer(current);
          }
          break;
        case "word-bank":
          if (current.targetSentence) {
            setOrderedWords(current.targetSentence.split(" "));
            setAvailableWords([]);
            handleCorrectAnswer(current);
          }
          break;
        case "conversation":
          setInput(heardText);
          handleCorrectAnswer(current);
          break;
        default:
          break;
      }
    },
    [answerState, current, handleCorrectAnswer, handleOptionSelect]
  );

  const exerciseTypeLabel = useCallback((type: string) => {
    switch (type) {
      case "conversation":
        return "💬 Free Response";
      case "word-bank":
        return "🧩 Build the Sentence";
      case "word-order":
        return "🔀 Word Order";
      case "multiple-choice":
        return "🎯 Multiple Choice";
      case "fill-blank":
        return "✏️ Fill the Gap";
      default:
        return "Exercise";
    }
  }, []);

  const handleOptionButtonClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      const optionIndex = Number(event.currentTarget.dataset.optionIndex);
      if (Number.isNaN(optionIndex)) {
        return;
      }
      handleOptionSelect(optionIndex, current);
    },
    [current, handleOptionSelect]
  );

  if (!current) {
    return null;
  }

  return (
    <div className="flex flex-col h-[100dvh] relative">
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
      <div className="px-4 pt-3 pb-2 space-y-2">
        {/* Top bar: language, hearts, XP */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{language.flag}</span>
            <div>
              <p className="text-xs text-muted-foreground">{session.topic}</p>
              <p className="text-xs font-medium">
                {language.name} · {session.level}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Glassmorphic Hearts */}
            <div className="flex items-center gap-1 bg-stone-100 px-2 py-1 rounded-full border border-stone-200">
              {HEART_SLOTS.map((index) => (
                <Heart
                  key={index}
                  className={`w-4 h-4 transition-all ${
                    index < hearts
                      ? "text-[#C4563F] fill-[#C4563F]"
                      : "text-[#2D2A26]"
                  }`}
                />
              ))}
            </div>
            {/* XP */}
            <div className="flex items-center gap-1 bg-stone-100 px-2.5 py-1 rounded-full border border-stone-200">
              <Zap className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-bold text-primary tabular-nums">
                {totalXp}
              </span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 rounded-full bg-stone-100 border border-stone-200 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary to-amber-500 shadow-[0_0_20px_-5px_rgba(232,120,77,0.4)]"
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

        {/* Streak + adaptive difficulty indicator */}
        {(correctStreak >= 2 || difficultyBadgeLabel) && (
          <div className="flex items-center gap-2 flex-wrap">
            {correctStreak >= 2 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={springTransition}
                className="flex items-center gap-1.5"
              >
                <span className="text-sm">🔥</span>
                <span className="text-xs font-semibold text-primary">
                  {correctStreak} in a row!
                </span>
                {correctStreak >= 3 && (
                  <span className="text-[10px] text-[#E8A84D] backdrop-blur-md bg-[#E8A84D]/10 px-1.5 py-0.5 rounded-full border border-primary/30 shadow-[0_0_15px_-5px_rgba(232,168,77,0.3)]">
                    1.5× XP
                  </span>
                )}
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              {difficultyBadgeLabel && resolvedAdaptiveEnabled && (
                <motion.span
                  key={`difficulty-${difficultyMultiplier}`}
                  initial={{ opacity: 0, y: 6, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={springTransition}
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] tracking-[0.08em] ${
                    difficultyMultiplier >= 2
                      ? "bg-[#C4563F]/15 border-[#C4563F]/40 text-primary"
                      : "bg-[#E8A84D]/10 border-[#E8A84D]/35 text-[#E8A84D]"
                  } ${showDifficultyPulse ? "shadow-[0_0_20px_-6px_rgba(232,120,77,0.45)]" : ""}`}
                >
                  <Flame className="h-3 w-3" />
                  {difficultyBadgeLabel}
                </motion.span>
              )}
            </AnimatePresence>

            {difficultyBadgeLabel && resolvedAdaptiveEnabled && (
              <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded-full border border-primary/20">
                Adaptive ON
              </span>
            )}
          </div>
        )}
      </div>

      {/* Exercise content - card deck */}
      <div
        className="flex-1 px-4 overflow-y-auto pb-4 no-scrollbar"
        ref={scrollRef}
      >
        {hasContext ? (
          <div className="mt-2 rounded-2xl border border-stone-200 bg-stone-50 p-3">
            <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">Lesson context</p>
            {exerciseContext?.topic ? (
              <p className="mt-1 text-sm font-medium text-foreground">{exerciseContext.topic}</p>
            ) : null}
            {exerciseContext?.grammarFocus?.length ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Grammar: {exerciseContext.grammarFocus.slice(0, 3).join(", ")}
              </p>
            ) : null}
            {exerciseContext?.vocabularyFocus?.length ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Vocabulary: {exerciseContext.vocabularyFocus.slice(0, 4).join(", ")}
              </p>
            ) : null}
          </div>
        ) : null}

        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentIndex}-${difficultyMultiplier}`}
            initial={{ opacity: 0, x: 30, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -30, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="py-4 space-y-5"
          >
            {/* Exercise card - glassmorphic */}
            <div className="bg-stone-50 border border-stone-200 rounded-3xl p-5 space-y-5 shadow-lg">
              {/* Exercise type pill */}
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-stone-100 text-xs text-muted-foreground border border-stone-200">
                  {exerciseTypeLabel(current.type)}
                </span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {currentIndex + 1}/{totalExercises}
                </span>
              </div>

              {/* Prompt */}
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-base font-semibold leading-snug">{current.prompt}</h2>
                <ListenButton text={current.prompt} languageCode={languageCode} />
              </div>

              {/* Multiple Choice */}
              {current.type === "multiple-choice" && current.options && (
                <div className="space-y-2.5">
                  {current.options.map((option, index) => {
                    const isSelected = selectedOption === index;
                    const isCorrect = index === (current.correctIndex ?? 0);
                    let style =
                      "bg-stone-50 border-stone-200";

                    if (answerState !== "idle") {
                      if (isCorrect) {
                        style =
                          "backdrop-blur-md bg-accent/[0.15] border-accent shadow-[0_0_20px_-10px_rgba(90,122,94,0.4)]";
                      } else if (isSelected) {
                        style =
                          "backdrop-blur-md bg-[#C4563F]/[0.15] border-[#C4563F] shadow-[0_0_20px_-10px_rgba(196,86,63,0.4)]";
                      } else {
                        style =
                          "bg-stone-100/50 border-stone-200 opacity-50";
                      }
                    }

                    return (
                      <motion.button
                        key={index}
                        data-option-index={index}
                        whileTap={answerState === "idle" ? TAP_SCALE_97 : undefined}
                        transition={springTransition}
                        onClick={handleOptionButtonClick}
                        disabled={answerState !== "idle"}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${style}`}
                      >
                        <span
                          className={`w-7 h-7 rounded-full border flex items-center justify-center text-xs font-medium shrink-0 ${
                            answerState !== "idle" && isCorrect
                              ? "border-accent bg-accent text-background"
                              : answerState !== "idle" && isSelected
                              ? "border-[#C4563F] bg-[#C4563F] text-background"
                              : "border-stone-300 text-muted-foreground"
                          }`}
                        >
                          {answerState !== "idle" && isCorrect ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : answerState !== "idle" && isSelected ? (
                            <X className="w-3.5 h-3.5" />
                          ) : (
                            String.fromCharCode(65 + index)
                          )}
                        </span>
                        <span className="text-sm text-left">{option}</span>
                      </motion.button>
                    );
                  })}
                </div>
              )}

              {/* Fill in the Blank */}
              {current.type === "fill-blank" && current.sentence && (
                <div className="space-y-4">
                  <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5 text-center">
                    <p className="text-lg leading-relaxed">
                      {current.sentence.split("___").map((part, index, array) => (
                        <span key={index}>
                          {part}
                          {index < array.length - 1 && (
                            <span
                              className={`inline-block min-w-[70px] mx-1 px-2 py-0.5 rounded-lg border-b-2 font-semibold ${
                                answerState === "correct"
                                  ? "border-accent text-accent bg-accent/10"
                                  : answerState === "wrong"
                                  ? "border-[#C4563F] text-[#C4563F] bg-[#C4563F]/10"
                                  : "border-primary/50 text-primary/40"
                              }`}
                            >
                              {selectedOption !== null && current.blankOptions
                                ? current.blankOptions[selectedOption]
                                : "___"}
                            </span>
                          )}
                        </span>
                      ))}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {current.blankOptions?.map((option, index) => {
                      const isSelected = selectedOption === index;
                      const correctIndex = current.blankCorrectIndex ?? 0;
                      const isCorrect = index === correctIndex;
                      let style =
                        "bg-stone-50 border-stone-200 text-foreground";

                      if (answerState !== "idle") {
                        if (isCorrect) {
                          style =
                            "backdrop-blur-md bg-accent/[0.15] border-accent text-accent shadow-[0_0_20px_-10px_rgba(90,122,94,0.4)]";
                        } else if (isSelected) {
                          style =
                            "backdrop-blur-md bg-[#C4563F]/[0.15] border-[#C4563F] text-[#C4563F] shadow-[0_0_20px_-10px_rgba(196,86,63,0.4)]";
                        } else {
                          style =
                            "bg-stone-100/50 border-stone-200 text-muted-foreground/40";
                        }
                      }

                      return (
                        <motion.button
                          key={index}
                          data-option-index={index}
                          whileTap={answerState === "idle" ? TAP_SCALE_95 : undefined}
                          transition={springTransition}
                          onClick={handleOptionButtonClick}
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

              {/* Word Bank / Word Order */}
              {(current.type === "word-bank" || current.type === "word-order") && (
                <div className="space-y-4">
                  <div className="bg-stone-100 border border-stone-200 rounded-2xl p-4 min-h-[56px] flex flex-wrap gap-2 items-center">
                    {orderedWords.length === 0 && (
                      <span className="text-muted-foreground/40 text-sm">
                        Tap words to build the sentence...
                      </span>
                    )}
                    {orderedWords.map((word, index) => (
                      <WordTile
                        key={`placed-${index}`}
                        word={word}
                        state={
                          answerState === "correct"
                            ? "correct"
                            : answerState === "wrong"
                            ? "wrong"
                            : "placed"
                        }
                        onClick={() => handleWordRemove(index)}
                        layoutId={`word-${word}-${index}`}
                        disabled={answerState !== "idle"}
                      />
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2 justify-center">
                    {availableWords.map((word, index) => (
                      <WordTile
                        key={`bank-${word}-${index}`}
                        word={word}
                        state="available"
                        onClick={() => handleWordTap(word)}
                        layoutId={`word-${word}-${index}`}
                        disabled={answerState !== "idle"}
                      />
                    ))}
                  </div>

                  {orderedWords.length > 0 && answerState === "idle" && (
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileTap={TAP_SCALE_98}
                      transition={springTransition}
                      onClick={handleWordSubmit}
                      className="w-full py-3 rounded-full backdrop-blur-xl bg-primary text-background font-semibold text-sm flex items-center justify-center gap-2 shadow-[0_0_30px_-10px_rgba(232,120,77,0.4)]"
                    >
                      Check answer
                      <ChevronRight className="w-4 h-4" />
                    </motion.button>
                  )}

                  {answerState === "wrong" && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center"
                    >
                      <p className="text-xs text-muted-foreground mb-1">Correct answer:</p>
                      <p className="text-sm text-accent font-medium">
                        {current.type === "word-order"
                          ? current.correctOrder?.join(" ")
                          : current.targetSentence}
                      </p>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Conversation */}
              {current.type === "conversation" && (
                <div className="space-y-3">
                  {showAiTyping ? (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full backdrop-blur-md bg-primary/[0.15] flex items-center justify-center shrink-0">
                        <Sparkles className="w-4 h-4 text-primary" />
                      </div>
                      <div className="bg-stone-50 border border-stone-200 rounded-2xl rounded-tl-sm px-4 py-3">
                        <TypingIndicator />
                      </div>
                    </div>
                  ) : (
                    <ChatBubble type="ai" content={current.aiMessage} />
                  )}

                  {!showAiTyping &&
                    answerState === "idle" &&
                    current.suggestedResponse && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="px-4"
                      >
                        <p className="text-[10px] text-muted-foreground/60 mb-1">💡 Suggestion</p>
                        <p className="text-xs text-muted-foreground/40 italic">
                          {current.suggestedResponse}
                        </p>
                      </motion.div>
                    )}

                  {answerState !== "idle" && input && (
                    <ChatBubble type="student" content={input} />
                  )}
                </div>
              )}

              {showCorrection && (
                <motion.div
                  initial={{ opacity: 0, x: [-4, 4, -4, 4, 0] }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-2"
                >
                  <CorrectionChip correction={showCorrection} />
                  <AnimatePresence>
                    {whyInsight && (
                      <WhyInsightCard
                        explanation={whyInsight}
                        onDismiss={dismissWhyInsight}
                      />
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Input for conversation type */}
      {current.type === "conversation" &&
        answerState === "idle" &&
        !showAiTyping && (
          <div className="sticky bottom-0 px-4 pb-6 pt-3 bg-gradient-to-t from-card via-card to-transparent">
            <form onSubmit={handleConversationSubmit} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                className="flex-1 px-4 py-3.5 rounded-full bg-stone-50 border border-stone-200 text-sm placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none transition-colors"
                placeholder="Type your response..."
                autoFocus
              />
              <motion.button
                type="submit"
                disabled={!input.trim()}
                whileTap={TAP_SCALE_95}
                transition={springTransition}
                className="w-12 h-12 rounded-full backdrop-blur-xl bg-primary flex items-center justify-center shadow-[0_0_30px_-10px_rgba(232,120,77,0.4)] disabled:opacity-50"
              >
                <ArrowUp className="w-5 h-5 text-background" />
              </motion.button>
            </form>
          </div>
        )}

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
              {miniPromptReason === "voice" ? "Voice input is locked" : "Adaptive difficulty is locked"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Upgrade to Unlimited Practice ({formattedUpgradePrice}) to unlock this feature.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* XP Pop */}
      <AnimatePresence>
        {showXpPop && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: -40, scale: 1 }}
            exit={{ opacity: 0, y: -60, scale: 0.5 }}
            transition={{ type: "spring", stiffness: 200, damping: 12 }}
            className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none"
          >
            <div className="backdrop-blur-xl bg-primary rounded-2xl px-5 py-2.5 shadow-[0_8px_30px_rgba(232,120,77,0.5)]">
              <span className="text-background font-bold text-xl">+{xpPopAmount} XP</span>
              {correctStreak >= 3 && (
                <span className="block text-background/70 text-[10px] text-center">
                  🔥 Streak bonus!
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save progress email capture — shows after 3rd exercise */}
      <AnimatePresence>
        {currentIndex >= 3 && !emailSaved && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="sticky bottom-0 z-30 border-t border-stone-100 bg-white/95 px-4 py-3"
          >
            {!emailSaved && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const emailInput = form.elements.namedItem("saveEmail") as HTMLInputElement;
                  if (emailInput?.value) {
                    // Fire and forget — save email with session context
                    void fetch("/api/practice/anonymous/claim", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email: emailInput.value, language: languageCode }),
                    });
                    setEmailSaved(true);
                  }
                }}
                className="flex items-center gap-2"
              >
                <div className="flex-1">
                  <p className="text-xs font-medium text-foreground mb-1">Save your progress</p>
                  <div className="flex gap-2">
                    <input
                      name="saveEmail"
                      type="email"
                      required
                      placeholder="Enter your email"
                      className="flex-1 h-9 rounded-lg border border-stone-200 bg-stone-50 px-3 text-sm placeholder:text-muted-foreground/60 focus:border-primary/40 focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="h-9 rounded-lg bg-primary px-4 text-xs font-semibold text-white hover:bg-primary/90 transition-colors"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Email saved confirmation */}
      <AnimatePresence>
        {emailSaved && currentIndex >= 3 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="sticky bottom-0 z-30 border-t border-emerald-100 bg-emerald-50/95 px-4 py-2.5 text-center"
          >
            <p className="text-xs font-medium text-emerald-700">✓ Progress saved — check your email to continue later</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Screen flash */}
      <AnimatePresence>
        {answerState === "correct" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
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

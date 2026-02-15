"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";
import Confetti from "@/components/recap/Confetti";
import type {
  RecapSummary,
  RecapExercise,
  AttemptAnswer,
} from "@/lib/recap/types";
import { DEFAULT_UI_STRINGS } from "@/lib/recap/types";

type ResultsCardProps = {
  score: number;
  total: number;
  answers: AttemptAnswer[];
  summary: RecapSummary;
  exercises: RecapExercise[];
  startTime: Date;
  tutorDisplayName?: string | null;
  tutorUsername?: string | null;
};

const TYPE_LABELS: Record<string, string> = {
  multipleChoice: "Multiple choice",
  fillBlank: "Fill in the blank",
  wordOrder: "Word order",
  listening: "Listening",
  matching: "Matching",
  translation: "Translation",
  contextCloze: "Context cloze",
};

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs} sec`;
  return `${mins} min ${secs} sec`;
}

function buildShareText(score: number, total: number, language: string, studentName: string | null): string {
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  const name = studentName ? `${studentName} scored` : "I scored";
  return `🎯 ${name} ${score}/${total} (${percentage}%) on a ${language} lesson recap!\n\n🔥 Think you can beat that?`;
}

export default function ResultsCard({
  score,
  total,
  answers,
  summary,
  exercises,
  startTime,
  tutorDisplayName,
  tutorUsername,
}: ResultsCardProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [shareState, setShareState] = useState<"idle" | "copied">("idle");
  const animatedRef = useRef(false);

  const ui = { ...DEFAULT_UI_STRINGS, ...summary.uiStrings };
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  const timeSpent = Math.round((Date.now() - startTime.getTime()) / 1000);
  const isPerfect = score === total && total > 0;

  const emoji = percentage >= 80 ? "🎉" : percentage >= 50 ? "👏" : "💪";
  const heading =
    percentage >= 80
      ? ui.amazingWork
      : percentage >= 50
        ? ui.greatEffort
        : ui.keepGoing;

  // Animated counter
  useEffect(() => {
    if (animatedRef.current) return;
    animatedRef.current = true;

    let current = 0;
    const interval = setInterval(() => {
      current += 1;
      if (current >= score) {
        setDisplayScore(score);
        clearInterval(interval);
        // Trigger confetti on perfect score
        if (isPerfect) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 4000);
        }
      } else {
        setDisplayScore(current);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [score, isPerfect]);

  // SVG ring
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Find the longest streak
  let maxStreak = 0;
  let currentStreak = 0;
  for (const a of answers) {
    if (a.correct) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  const handleShare = useCallback(async () => {
    const text = buildShareText(score, total, summary.language, summary.studentName);
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ text, url });
        return;
      } catch {
        // Fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(`${text}\n\n${url}`);
      setShareState("copied");
      setTimeout(() => setShareState("idle"), 2000);
    } catch {
      // Ignore clipboard errors
    }
  }, [score, total, summary.language, summary.studentName]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      {/* Confetti on perfect score */}
      <Confetti active={showConfetti} />

      {/* Emoji */}
      <motion.div
        className="mb-4 text-5xl"
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
      >
        {emoji}
      </motion.div>

      {/* Heading */}
      <motion.h1
        className="mb-6 text-center font-heading text-2xl text-foreground"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {heading}
        {summary.studentName ? `, ${summary.studentName}!` : "!"}
      </motion.h1>

      {/* Score ring */}
      <motion.div
        className="relative mb-6"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
      >
        <svg width="130" height="130" className="-rotate-90">
          {/* Background ring */}
          <circle
            cx="65"
            cy="65"
            r={radius}
            fill="none"
            stroke="rgba(245, 242, 239, 0.08)"
            strokeWidth="8"
          />
          {/* Animated progress ring */}
          <motion.circle
            cx="65"
            cy="65"
            r={radius}
            fill="none"
            stroke={isPerfect ? "#22c55e" : "#E8784D"}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-foreground">
            {displayScore}/{total}
          </span>
          <span className="text-sm text-muted-foreground">{percentage}%</span>
        </div>
      </motion.div>

      {/* Stats row */}
      <motion.div
        className="mb-6 flex gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center gap-1.5 rounded-lg bg-card px-3 py-1.5 text-xs text-muted-foreground">
          ⏱️ {formatTime(timeSpent)}
        </div>
        {maxStreak > 1 && (
          <div className="flex items-center gap-1.5 rounded-lg bg-card px-3 py-1.5 text-xs text-orange-400">
            🔥 {maxStreak} streak
          </div>
        )}
      </motion.div>

      {/* Results card */}
      <motion.div
        className="w-full max-w-sm rounded-2xl border bg-card p-5"
        style={{ borderColor: "rgba(245, 242, 239, 0.08)" }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        {/* Exercise breakdown */}
        <div className="space-y-3">
          {exercises.map((exercise, i) => {
            const answer = answers.find((a) => a.exerciseIndex === i);
            const correct = answer?.correct ?? false;
            return (
              <motion.div
                key={i}
                className="flex items-center justify-between text-sm"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + i * 0.08 }}
              >
                <span className="flex items-center gap-2 text-foreground/70">
                  <span>{correct ? "✅" : "❌"}</span>
                  <span>{TYPE_LABELS[exercise.type] ?? exercise.type}</span>
                </span>
                {exercise.difficulty && (
                  <span className={cn(
                    "rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                    exercise.difficulty === "easy" && "bg-green-500/20 text-green-400",
                    exercise.difficulty === "medium" && "bg-yellow-500/20 text-yellow-400",
                    exercise.difficulty === "hard" && "bg-red-500/20 text-red-400",
                  )}>
                    {exercise.difficulty}
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Fun fact */}
      {summary.funFact && (
        <motion.div
          className="mt-4 w-full max-w-sm rounded-xl border bg-card p-4"
          style={{ borderColor: "rgba(245, 242, 239, 0.08)" }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
        >
          <p className="text-sm text-foreground">
            {ui.funFact} {summary.funFact}
          </p>
        </motion.div>
      )}

      {/* Bonus word */}
      {summary.bonusWord?.word && (
        <motion.div
          className="mt-4 w-full max-w-sm rounded-xl border bg-card p-4"
          style={{ borderColor: "rgba(245, 242, 239, 0.08)" }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3 }}
        >
          <p className="text-sm text-foreground">
            {ui.bonusWord}{" "}
            <span className="font-semibold">{summary.bonusWord.word}</span> ={" "}
            {summary.bonusWord.translation}
          </p>
        </motion.div>
      )}

      {/* Share your score */}
      <motion.button
        onClick={handleShare}
        className={cn(
          "mt-4 w-full max-w-sm rounded-xl border py-3 font-semibold text-foreground",
          "transition-all hover:bg-card active:scale-[0.98]"
        )}
        style={{ borderColor: "rgba(245, 242, 239, 0.08)" }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4 }}
      >
        {shareState === "copied" ? "✅ Copied!" : ui.shareYourScore}
      </motion.button>

      {/* Tutor profile link — the growth flywheel */}
      {(tutorDisplayName || tutorUsername) && (
        <motion.div
          className="mt-4 w-full max-w-sm rounded-xl border bg-card p-4"
          style={{ borderColor: "rgba(245, 242, 239, 0.08)" }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
        >
          {tutorUsername ? (
            <a
              href={`/${tutorUsername}`}
              className="flex items-center justify-between text-sm text-foreground transition-colors hover:text-primary"
            >
              <span>
                📚 Continue learning with{" "}
                <span className="font-semibold">{tutorDisplayName ?? tutorUsername}</span>
              </span>
              <span className="text-muted-foreground">→</span>
            </a>
          ) : (
            <p className="text-sm text-foreground/70">
              📚 This recap was created by{" "}
              <span className="font-semibold">{tutorDisplayName}</span>
            </p>
          )}
        </motion.div>
      )}

      {/* Practice again tomorrow */}
      <motion.div
        className="mt-4 w-full max-w-sm rounded-xl border bg-gradient-to-r from-primary/10 to-orange-500/10 p-4"
        style={{ borderColor: "rgba(232, 120, 77, 0.15)" }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.6 }}
      >
        <p className="mb-2 text-sm font-semibold text-foreground">
          {ui.practiceAgainTomorrow}
        </p>
        <p className="text-xs leading-relaxed text-foreground/60">
          Spaced repetition is the most effective way to retain what you&apos;ve learned.
          Bookmark this page and come back tomorrow for a quick review.
        </p>
        <button
          onClick={() => {
            if (typeof window !== "undefined") {
              // Trigger browser bookmark prompt (Ctrl+D)
              alert("Press Ctrl+D (or Cmd+D on Mac) to bookmark this page for tomorrow's practice!");
            }
          }}
          className={cn(
            "mt-3 w-full rounded-lg bg-primary/20 py-2 text-xs font-semibold text-primary",
            "transition-all hover:bg-primary/30 active:scale-[0.98]"
          )}
        >
          🔖 Bookmark this recap
        </button>
      </motion.div>

      {/* CTA */}
      {!dismissed && (
        <motion.div
          className="mt-4 w-full max-w-sm rounded-xl border bg-card p-4"
          style={{ borderColor: "rgba(245, 242, 239, 0.08)" }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8 }}
        >
          <p className="text-sm leading-relaxed text-foreground/70">
            {ui.saveProgress}
          </p>
          <button
            onClick={() => setDismissed(true)}
            className="mt-2 text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            {ui.maybeLater}
          </button>
        </motion.div>
      )}

      {/* Footer */}
      <motion.div
        className="mt-8 flex items-center justify-center gap-1.5 opacity-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ delay: 2.0 }}
      >
        <span className="text-xs text-muted-foreground">{ui.poweredBy}</span>
        <Logo variant="wordmark" className="h-4 invert" />
      </motion.div>
    </div>
  );
}

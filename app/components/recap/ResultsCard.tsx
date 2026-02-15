"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";
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
  const animatedRef = useRef(false);

  const ui = { ...DEFAULT_UI_STRINGS, ...summary.uiStrings };
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  const timeSpent = Math.round((Date.now() - startTime.getTime()) / 1000);

  const emoji = score >= 4 ? "🎉" : score >= 2 ? "👏" : "💪";
  const heading =
    score >= 4
      ? ui.amazingWork
      : score >= 2
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
      } else {
        setDisplayScore(current);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [score]);

  // SVG ring
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
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
            stroke="#E8784D"
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
                transition={{ delay: 0.7 + i * 0.1 }}
              >
                <span className="flex items-center gap-2 text-foreground/70">
                  <span>{correct ? "✅" : "❌"}</span>
                  <span>{TYPE_LABELS[exercise.type] ?? exercise.type}</span>
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* Time */}
        <motion.div
          className="mt-4 border-t pt-3 text-sm text-muted-foreground"
          style={{ borderColor: "rgba(245, 242, 239, 0.06)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          ⏱️ {formatTime(timeSpent)}
        </motion.div>
      </motion.div>

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

      {/* CTA */}
      {!dismissed && (
        <motion.div
          className="mt-4 w-full max-w-sm rounded-xl border bg-card p-4"
          style={{ borderColor: "rgba(245, 242, 239, 0.08)" }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6 }}
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
        transition={{ delay: 1.8 }}
      >
        <span className="text-xs text-muted-foreground">{ui.poweredBy}</span>
        <Logo variant="wordmark" className="h-4 invert" />
      </motion.div>
    </div>
  );
}

"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookA,
  MessageSquare,
  Mic,
  Puzzle,
  Sparkles,
  CheckCircle2,
  Clock,
  RotateCcw,
  ChevronRight,
} from "lucide-react";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ScrambleGame } from "@/components/drills/ScrambleGame";
import { MatchGame } from "@/components/drills/MatchGame";
import { GapFillGame } from "@/components/drills/GapFillGame";
import { completeDrill } from "@/lib/actions/drills";
import type {
  DrillWithContext,
  DrillType,
  ScrambleData,
  MatchData,
  GapFillData,
} from "@/lib/actions/types";

interface DrillPlayerClientProps {
  drill: DrillWithContext;
  studentId: string;
  studentName: string | null;
}

const drillTypeConfig: Record<
  DrillType,
  { label: string; icon: typeof BookA; color: string; bgColor: string }
> = {
  grammar: {
    label: "Grammar",
    icon: BookA,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  vocabulary: {
    label: "Vocabulary",
    icon: MessageSquare,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  pronunciation: {
    label: "Pronunciation",
    icon: Mic,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
  },
  fluency: {
    label: "Fluency",
    icon: Puzzle,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
  },
};

type CheckState = "idle" | "correct" | "incorrect";

export function DrillPlayerClient({
  drill,
  studentId,
}: DrillPlayerClientProps) {
  const [checkState, setCheckState] = useState<CheckState>("idle");
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(drill.is_completed);
  const [attempts, setAttempts] = useState(0);
  const [startTime] = useState(Date.now());

  // Game state
  const [scrambleAnswer, setScrambleAnswer] = useState<string[]>([]);
  const [matchesRemaining, setMatchesRemaining] = useState<number>(Infinity);
  const [gapAnswer, setGapAnswer] = useState<string | null>(null);

  const config = drillTypeConfig[drill.drill_type] || drillTypeConfig.grammar;
  const Icon = config.icon;

  const gameType = drill.content?.type;
  const gameData = drill.content?.data;

  const canCheck = useMemo(() => {
    if (gameType === "scramble") {
      return scrambleAnswer.length > 0;
    }
    if (gameType === "match") {
      return matchesRemaining < Infinity;
    }
    if (gameType === "gap-fill") {
      return Boolean(gapAnswer);
    }
    return false;
  }, [gameType, scrambleAnswer.length, matchesRemaining, gapAnswer]);

  const handleCheck = useCallback(async () => {
    let isCorrect = false;

    if (gameType === "scramble" && gameData) {
      const data = gameData as ScrambleData;
      const target = data.solution ?? data.words;
      isCorrect =
        scrambleAnswer.length === target.length &&
        scrambleAnswer.every((word, idx) => word === target[idx]);
    }

    if (gameType === "match") {
      isCorrect = matchesRemaining === 0;
    }

    if (gameType === "gap-fill" && gameData) {
      const data = gameData as GapFillData;
      isCorrect = gapAnswer === data.answer;
    }

    setAttempts((prev) => prev + 1);
    setCheckState(isCorrect ? "correct" : "incorrect");

    if (isCorrect && !isCompleted) {
      // Fire confetti
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.7 },
      });

      // Save completion to database
      setIsCompleting(true);
      const result = await completeDrill(drill.id, studentId);
      setIsCompleting(false);

      if (result.success) {
        setIsCompleted(true);
      }
    }
  }, [
    gameType,
    gameData,
    scrambleAnswer,
    matchesRemaining,
    gapAnswer,
    isCompleted,
    drill.id,
    studentId,
  ]);

  const handleReset = useCallback(() => {
    setCheckState("idle");
    setScrambleAnswer([]);
    setMatchesRemaining(Infinity);
    setGapAnswer(null);
  }, []);

  // Auto-check for match game when all pairs are matched
  useEffect(() => {
    if (gameType === "match" && matchesRemaining === 0 && checkState === "idle") {
      handleCheck();
    }
  }, [gameType, matchesRemaining, checkState, handleCheck]);

  const timeSpent = useMemo(() => {
    const seconds = Math.floor((Date.now() - startTime) / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  }, [startTime]); // Re-compute when completed

  // Show completion screen
  if (isCompleted && checkState === "correct") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 to-background">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-sm">
          <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
            <Link
              href="/student/drills"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Drills
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-lg px-4 py-12">
          <div className="text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>

            <h1 className="mt-6 text-2xl font-bold">Great job!</h1>
            <p className="mt-2 text-muted-foreground">
              You completed the {config.label.toLowerCase()} drill
            </p>

            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-border bg-background p-4 text-center">
                <p className="text-2xl font-bold">{attempts}</p>
                <p className="text-xs text-muted-foreground">
                  {attempts === 1 ? "Attempt" : "Attempts"}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-background p-4 text-center">
                <p className="text-2xl font-bold">{timeSpent}</p>
                <p className="text-xs text-muted-foreground">Time</p>
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <Link href="/student/drills" className="block">
                <Button className="w-full" size="lg">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Continue Practicing
                </Button>
              </Link>
              <Link href="/student/progress" className="block">
                <Button variant="outline" className="w-full" size="lg">
                  View Progress
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/50 to-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
          <Link
            href="/student/drills"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>

          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                config.bgColor,
                config.color
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {config.label}
            </span>
          </div>

          {!isCompleted && (
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-lg px-4 pb-32 pt-6">
        {/* Prompt/Instructions */}
        {drill.content?.prompt && (
          <div className="mb-6 rounded-xl border border-border bg-background p-4">
            <p className="text-sm font-medium text-foreground">
              {drill.content.prompt}
            </p>
          </div>
        )}

        {/* Due date indicator */}
        {drill.due_date && !isCompleted && (
          <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            Due{" "}
            {new Date(drill.due_date).toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </div>
        )}

        {/* Game Component */}
        <div className="rounded-2xl border border-border bg-background p-5">
          {gameType === "scramble" && gameData && (
            <ScrambleGame
              data={gameData as ScrambleData}
              onChange={(answer) => {
                setScrambleAnswer(answer);
                setCheckState("idle");
              }}
            />
          )}

          {gameType === "match" && gameData && (
            <MatchGame
              data={gameData as MatchData}
              onStateChange={(remaining) => {
                setMatchesRemaining(remaining);
                if (remaining > 0) {
                  setCheckState("idle");
                }
              }}
            />
          )}

          {gameType === "gap-fill" && gameData && (
            <GapFillGame
              data={gameData as GapFillData}
              onChange={(selection) => {
                setGapAnswer(selection);
                setCheckState("idle");
              }}
            />
          )}
        </div>

        {/* Feedback */}
        {checkState !== "idle" && (
          <div
            className={cn(
              "mt-4 rounded-xl p-4 text-center",
              checkState === "correct"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-amber-50 text-amber-700"
            )}
          >
            {checkState === "correct" ? (
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="h-5 w-5" />
                <span className="font-semibold">Excellent!</span>
              </div>
            ) : (
              <div>
                <span className="font-semibold">Not quite right</span>
                <p className="mt-1 text-sm opacity-80">Try again!</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background p-4 safe-area-inset-bottom">
        <div className="mx-auto max-w-lg">
          <Button
            size="lg"
            className="w-full text-lg"
            onClick={handleCheck}
            disabled={!canCheck || isCompleting || checkState === "correct"}
          >
            {isCompleting
              ? "Saving..."
              : checkState === "correct"
                ? "Completed!"
                : "Check Answer"}
          </Button>
        </div>
      </div>
    </div>
  );
}

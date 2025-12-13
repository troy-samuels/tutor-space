"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";
import { ScrambleGame } from "./ScrambleGame";
import { MatchGame } from "./MatchGame";
import { GapFillGame } from "./GapFillGame";

type ScrambleData = {
  words: string[];
  solution?: string[];
};

type MatchData = {
  pairs: Array<{ id: string; left: string; right: string }>;
};

type GapFillData = {
  sentence: string;
  answer: string;
  options: string[];
};

type DrillModalProps =
  | {
      type: "scramble";
      data: ScrambleData;
      open: boolean;
      onOpenChange: (open: boolean) => void;
      progress?: number;
    }
  | {
      type: "match";
      data: MatchData;
      open: boolean;
      onOpenChange: (open: boolean) => void;
      progress?: number;
    }
  | {
      type: "gap-fill";
      data: GapFillData;
      open: boolean;
      onOpenChange: (open: boolean) => void;
      progress?: number;
    };

type CheckState = "idle" | "correct" | "incorrect";

export function DrillModal(props: DrillModalProps) {
  const { open, onOpenChange, progress = 0 } = props;
  const [checkState, setCheckState] = useState<CheckState>("idle");
  const [scrambleAnswer, setScrambleAnswer] = useState<string[]>([]);
  const [matchesRemaining, setMatchesRemaining] = useState<number>(Infinity);
  const [gapAnswer, setGapAnswer] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setCheckState("idle");
      setScrambleAnswer([]);
      setMatchesRemaining(Infinity);
      setGapAnswer(null);
    }
  }, [open]);

  const progressPercent = useMemo(() => {
    const clamped = Math.max(0, Math.min(progress, 1));
    return Math.round(clamped * 100);
  }, [progress]);

  const handleCheck = useCallback(() => {
    let isCorrect = false;

    if (props.type === "scramble") {
      const target = props.data.solution ?? props.data.words;
      isCorrect =
        scrambleAnswer.length === target.length &&
        scrambleAnswer.every((word, idx) => word === target[idx]);
    }

    if (props.type === "match") {
      isCorrect = matchesRemaining === 0;
    }

    if (props.type === "gap-fill") {
      isCorrect = gapAnswer === props.data.answer;
    }

    setCheckState(isCorrect ? "correct" : "incorrect");

    if (isCorrect) {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.8 },
      });
    }
  }, [gapAnswer, matchesRemaining, props, scrambleAnswer]);

  const canCheck = useMemo(() => {
    if (props.type === "scramble") {
      return scrambleAnswer.length > 0;
    }
    if (props.type === "match") {
      return props.data.pairs.length > 0;
    }
    if (props.type === "gap-fill") {
      return Boolean(gapAnswer);
    }
    return true;
  }, [gapAnswer, props, scrambleAnswer.length]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "p-0 m-0 left-0 top-0 translate-x-0 translate-y-0 h-[100dvh] w-screen max-w-none rounded-none border-0",
          "sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-md sm:h-auto sm:w-full sm:rounded-3xl sm:border",
          "overflow-hidden bg-white"
        )}
      >
        <div className="relative h-full flex flex-col">
          <div className="absolute top-4 right-4 z-20">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="h-10 w-10 rounded-full bg-black/5 flex items-center justify-center text-muted-foreground hover:text-foreground transition touch-action-manipulation"
              aria-label="Close drill"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="absolute left-0 right-0 top-3 z-10 flex justify-center px-6">
            <div className="w-full max-w-xs h-2 rounded-full bg-muted/80 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-sky-500 to-blue-500 transition-[width]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 pb-32 pt-14 sm:pb-6 sm:pt-16">
            <div className="space-y-6">
              {props.type === "scramble" && (
                <ScrambleGame
                  data={props.data}
                  onChange={(answer) => {
                    setScrambleAnswer(answer);
                    setCheckState("idle");
                  }}
                />
              )}

              {props.type === "match" && (
                <MatchGame
                  data={props.data}
                  onStateChange={(remaining) => {
                    setMatchesRemaining(remaining);
                    setCheckState("idle");
                  }}
                />
              )}

              {props.type === "gap-fill" && (
                <GapFillGame
                  data={props.data}
                  onChange={(selection) => {
                    setGapAnswer(selection);
                    setCheckState("idle");
                  }}
                />
              )}
            </div>
          </div>

          <div className="fixed bottom-0 left-0 w-full bg-white border-t border-border p-4 sm:static sm:border-0 sm:p-6">
            <div className="space-y-2">
              <Button
                size="lg"
                className="w-full text-xl h-14 sm:h-12 touch-action-manipulation"
                onClick={handleCheck}
                disabled={!canCheck}
              >
                Check Answer
              </Button>

              <div className="min-h-[20px] text-center text-sm">
                {checkState === "correct" && (
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                    <Sparkles className="h-4 w-4" />
                    Nailed it!
                  </span>
                )}
                {checkState === "incorrect" && (
                  <span className="text-amber-600 font-medium">Try again</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { Coffee, MessageSquare, Mic } from "lucide-react";
import type { PracticeMode } from "./AIPracticeChat";

interface LimitReachedOverlayProps {
  mode: PracticeMode;
  otherModeAvailable: boolean;
  otherModePercentUsed: number;
  onSwitchMode?: () => void;
  onDismiss?: () => void;
}

export function LimitReachedOverlay({
  mode,
  otherModeAvailable,
  otherModePercentUsed,
  onSwitchMode,
  onDismiss,
}: LimitReachedOverlayProps) {
  const otherMode = mode === "text" ? "audio" : "text";
  const otherModeRemaining = Math.max(0, 100 - otherModePercentUsed);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm rounded-2xl border border-border bg-background p-6 shadow-lg">
        {/* Friendly icon */}
        <div className="mb-4 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <Coffee className="h-8 w-8 text-amber-600" />
          </div>
        </div>

        <h3 className="mb-2 text-center text-lg font-semibold text-foreground">
          Time for a quick break
        </h3>

        <p className="mb-6 text-center text-sm text-muted-foreground">
          You've been practicing hard!{" "}
          {otherModeAvailable && otherModeRemaining > 0
            ? `Keep the momentum going with ${otherMode === "text" ? "written" : "spoken"} practice.`
            : "0 balance remaining. Resets next month."}
        </p>

        {/* Actions */}
        <div className="space-y-3">
          {/* Switch mode option (free) - shown first */}
          {otherModeAvailable && otherModeRemaining > 0 && onSwitchMode && (
            <Button
              className="w-full"
              onClick={onSwitchMode}
            >
              <span className="flex items-center gap-2">
                {otherMode === "text" ? (
                  <MessageSquare className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
                Continue with {otherMode === "text" ? "written" : "spoken"} practice
              </span>
            </Button>
          )}

          {/* Dismiss / Back */}
          {onDismiss && (
            <Button
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={onDismiss}
            >
              Go back
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { MessageSquare, Mic, Lock } from "lucide-react";
import Link from "next/link";
import type { PracticeMode } from "./AIPracticeChat";

interface LimitReachedOverlayProps {
  mode: PracticeMode;
  otherModeAvailable: boolean;
  otherModePercentUsed: number;
  upgradeUrl?: string | null;
  onSwitchMode?: () => void;
  onDismiss?: () => void;
}

export function LimitReachedOverlay({
  mode,
  otherModeAvailable,
  otherModePercentUsed,
  upgradeUrl,
  onSwitchMode,
  onDismiss,
}: LimitReachedOverlayProps) {
  const otherMode = mode === "text" ? "audio" : "text";
  const otherModeRemaining = Math.max(0, 100 - otherModePercentUsed);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm rounded-2xl border border-border bg-background p-6 shadow-lg">
        {/* Depleted indicator */}
        <div className="mb-4 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>

        <h3 className="mb-2 text-center text-lg font-semibold text-foreground">
          {mode === "text" ? "Text" : "Audio"} practice paused
        </h3>

        {/* Depleted bar */}
        <div className="mb-4 flex items-center justify-center gap-2">
          {mode === "text" ? (
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Mic className="h-4 w-4 text-muted-foreground" />
          )}
          <Progress
            value={0}
            className="h-2 w-32"
            indicatorClassName="bg-red-500"
          />
        </div>

        <p className="mb-6 text-center text-sm text-muted-foreground">
          You've reached your monthly {mode} limit.
        </p>

        {/* Actions */}
        <div className="space-y-3">
          {/* Switch mode option */}
          {otherModeAvailable && otherModeRemaining > 0 && onSwitchMode && (
            <Button
              variant="outline"
              className="w-full"
              onClick={onSwitchMode}
            >
              <span className="flex items-center gap-2">
                {otherMode === "text" ? (
                  <MessageSquare className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
                Continue with {otherMode}
              </span>
              <Progress
                value={otherModeRemaining}
                className="ml-auto h-2 w-12"
                indicatorClassName="bg-emerald-500"
              />
            </Button>
          )}

          {/* Unlock more */}
          {upgradeUrl && (
            <Button asChild className="w-full">
              <Link href={upgradeUrl}>Unlock more practice</Link>
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

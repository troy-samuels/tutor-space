/**
 * ImportProgress — Scrape loading indicator with step progress
 *
 * Polls /api/import/status every 1.5s and shows a stepped progress animation.
 * Transitions to the review screen when status reaches 'mapped'.
 */

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Loader2, Check, Circle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PLATFORM_LABELS } from "@/lib/import/resolve-platform";
import type { Platform, ImportStatus, MappedPageBuilderData } from "@/lib/import/types";

// ── Types ────────────────────────────────────────────────────────────

type ScrapeSummary = {
  displayName: string;
  avatarUrl: string | null;
  rating: number | null;
  reviewCount: number;
  serviceCount: number;
  languageCount: number;
  hasVideo: boolean;
};

type ImportProgressProps = {
  importId: string;
  platform: Platform;
  onComplete: (mappedData: MappedPageBuilderData, importId: string) => void;
  onError: (error: string) => void;
  onRetry: () => void;
};

// ── Progress steps ───────────────────────────────────────────────────

type StepState = "pending" | "active" | "done";

type ProgressStep = {
  label: string;
  state: StepState;
};

function deriveSteps(
  status: ImportStatus,
  summary: ScrapeSummary | null
): ProgressStep[] {
  const steps: ProgressStep[] = [
    { label: "Profile info", state: "pending" },
    { label: "Teaching languages", state: "pending" },
    { label: "Services & pricing", state: "pending" },
    { label: "Reviews", state: "pending" },
    { label: "Media", state: "pending" },
  ];

  if (status === "pending") {
    steps[0].state = "active";
    return steps;
  }

  if (status === "scraping") {
    // Simulate progress based on available summary data
    if (summary) {
      steps[0].state = "done";
      steps[1].state = summary.languageCount > 0 ? "done" : "active";
      steps[2].state = summary.serviceCount > 0 ? "done" : "pending";
      steps[3].state =
        summary.serviceCount > 0
          ? summary.reviewCount > 0
            ? "done"
            : "active"
          : "pending";
      steps[4].state = "pending";
    } else {
      steps[0].state = "active";
    }
    return steps;
  }

  if (status === "scraped") {
    steps[0].state = "done";
    steps[1].state = "done";
    steps[2].state = "done";
    steps[3].state = "done";
    steps[4].state = "active";
    return steps;
  }

  // mapped or applied — all done
  return steps.map((s) => ({ ...s, state: "done" as StepState }));
}

// ── Component ────────────────────────────────────────────────────────

export function ImportProgress({
  importId,
  platform,
  onComplete,
  onError,
  onRetry,
}: ImportProgressProps) {
  const [status, setStatus] = useState<ImportStatus>("pending");
  const [summary, setSummary] = useState<ScrapeSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);

  const poll = useCallback(async () => {
    if (completedRef.current) return;

    try {
      const res = await fetch(`/api/import/status?id=${importId}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to check import status.");
        return;
      }

      setStatus(data.status);

      if (data.scrapeSummary) {
        setSummary(data.scrapeSummary);
      }

      if (data.status === "mapped" && data.mappedData) {
        completedRef.current = true;
        if (pollRef.current) clearInterval(pollRef.current);
        onComplete(data.mappedData, importId);
      }

      if (data.status === "failed") {
        completedRef.current = true;
        if (pollRef.current) clearInterval(pollRef.current);
        setError(data.error || "Import failed.");
        onError(data.error || "Import failed.");
      }
    } catch {
      // Network error — don't stop polling, it might recover
      console.warn("[ImportProgress] Poll failed, retrying…");
    }
  }, [importId, onComplete, onError]);

  useEffect(() => {
    // Start polling immediately
    poll();
    pollRef.current = setInterval(poll, 1500);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [poll]);

  const steps = deriveSteps(status, summary);
  const platformLabel = PLATFORM_LABELS[platform] || platform;

  const completedSteps = steps.filter((s) => s.state === "done").length;
  const progressPercent = Math.round((completedSteps / steps.length) * 100);

  return (
    <div className="w-full max-w-sm mx-auto py-8">
      {/* Platform header */}
      <div className="text-center mb-6">
        <p className="text-sm font-semibold text-foreground">
          Importing from {platformLabel}
        </p>
        {summary?.displayName && (
          <p className="text-xs text-muted-foreground mt-1">
            {summary.displayName}
          </p>
        )}
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mb-6">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
          style={{ width: `${Math.max(progressPercent, 10)}%` }}
        />
      </div>

      {/* Step list */}
      <div className="space-y-3">
        {steps.map((step, i) => (
          <div
            key={i}
            className={cn(
              "flex items-center gap-3 text-sm transition-opacity duration-300",
              step.state === "pending" && "opacity-40",
              step.state === "active" && "opacity-100",
              step.state === "done" && "opacity-70"
            )}
          >
            {step.state === "done" && (
              <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
            )}
            {step.state === "active" && (
              <Loader2 className="h-4 w-4 text-primary animate-spin flex-shrink-0" />
            )}
            {step.state === "pending" && (
              <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            )}
            <span
              className={cn(
                step.state === "active" && "font-medium text-foreground",
                step.state === "done" && "text-muted-foreground",
                step.state === "pending" && "text-muted-foreground"
              )}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>

      {/* Error state */}
      {error && (
        <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-destructive font-medium">
                Import failed
              </p>
              <p className="text-xs text-muted-foreground mt-1">{error}</p>
            </div>
          </div>
          <Button
            onClick={onRetry}
            variant="outline"
            size="sm"
            className="mt-3 w-full rounded-lg"
          >
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * ImportUrlInput — Frictionless URL paste component
 *
 * Shows a text input with platform auto-detection. As the user types/pastes,
 * we resolve the platform in real-time and show the platform logo/label.
 *
 * Used in: Onboarding Step 1, Page Builder header, Settings
 */

"use client";

import { useState, useCallback, useTransition } from "react";
import { ArrowRight, Link2, Loader2, AlertCircle, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  resolvePlatform,
  looksLikePlatformUrl,
  PLATFORM_LABELS,
} from "@/lib/import/resolve-platform";
import type { ResolvedPlatform } from "@/lib/import/resolve-platform";
import type { Platform } from "@/lib/import/types";

// ── Platform brand colours ───────────────────────────────────────────

const PLATFORM_COLORS: Record<Platform, string> = {
  italki: "#E83737",
  preply: "#0076FF",
  verbling: "#FF6B35",
  cambly: "#FFDE59",
  wyzant: "#2D9CDB",
  superprof: "#FF5A5F",
};

const PLATFORM_ICONS: Record<Platform, string> = {
  italki: "🗣️",
  preply: "📘",
  verbling: "🔶",
  cambly: "💛",
  wyzant: "📚",
  superprof: "🎓",
};

// ── Props ────────────────────────────────────────────────────────────

type ImportUrlInputProps = {
  onImportStart: (importId: string, platform: Platform) => void;
  className?: string;
  compact?: boolean;
};

export function ImportUrlInput({
  onImportStart,
  className,
  compact = false,
}: ImportUrlInputProps) {
  const [url, setUrl] = useState("");
  const [resolved, setResolved] = useState<ResolvedPlatform | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Real-time platform detection as user types
  const handleChange = useCallback(
    (value: string) => {
      setUrl(value);
      setError(null);

      if (!value.trim()) {
        setResolved(null);
        return;
      }

      if (looksLikePlatformUrl(value)) {
        const result = resolvePlatform(value);
        setResolved(result);
      } else {
        setResolved(null);
      }
    },
    []
  );

  // Submit handler
  const handleSubmit = useCallback(async () => {
    if (!url.trim()) {
      setError("Paste your profile URL to get started.");
      return;
    }

    const result = resolvePlatform(url.trim());
    if (!result) {
      setError(
        "We don't recognise this URL. Try pasting your full iTalki, Preply, or Verbling profile link."
      );
      return;
    }

    setError(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/import/scrape", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: url.trim() }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Something went wrong.");
          return;
        }

        onImportStart(data.importId, result.platform);
      } catch {
        setError("Network error. Please check your connection and try again.");
      }
    });
  }, [url, onImportStart]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !isPending) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit, isPending]
  );

  return (
    <div className={cn("w-full", className)}>
      {/* Header */}
      {!compact && (
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1">
            <Globe className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">
              Import your existing profile
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Paste your Preply, iTalki, or Verbling profile URL
          </p>
        </div>
      )}

      {/* Input row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          {/* Platform indicator */}
          {resolved && (
            <div
              className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 z-10"
            >
              <span className="text-sm">{PLATFORM_ICONS[resolved.platform]}</span>
              <span
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: PLATFORM_COLORS[resolved.platform] }}
              >
                {PLATFORM_LABELS[resolved.platform]}
              </span>
            </div>
          )}

          <Input
            type="url"
            placeholder={
              compact
                ? "Paste profile URL…"
                : "https://italki.com/en/teacher/12345"
            }
            value={url}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isPending}
            className={cn(
              "pr-3 transition-all rounded-xl h-11",
              resolved && "pl-[105px]",
              !resolved && "pl-10"
            )}
          />

          {/* Link icon when no platform detected */}
          {!resolved && (
            <Link2
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
            />
          )}
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isPending || !url.trim()}
          size="default"
          className="rounded-xl h-11 px-5"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <span className="mr-1.5">Import</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-start gap-2 mt-2 text-destructive">
          <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
          <p className="text-xs">{error}</p>
        </div>
      )}

      {/* Supported platforms hint */}
      {!compact && !resolved && !error && (
        <p className="text-[10px] text-muted-foreground mt-2">
          Supported: iTalki · Preply · Verbling · more coming soon
        </p>
      )}
    </div>
  );
}

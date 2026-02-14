"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Zap } from "lucide-react";
import { Logo } from "@/components/Logo";

interface PracticeHeaderProps {
  /** Where the back button should route. null = hide back button (splash screen). */
  backHref?: string | null;
  /** Custom back label for accessibility. */
  backLabel?: string;
  /** Current exercise progress 0-100. null = hide progress bar. */
  progress?: number | null;
  /** Current XP count. null = hide XP display. */
  xp?: number | null;
  /** Whether the user is authenticated (show avatar area). */
  isAuthenticated?: boolean;
  /** Callback when back is pressed instead of routing (e.g. go to previous screen). */
  onBack?: () => void;
}

/**
 * Context-aware header for Practice mode.
 * Provides navigation back to wherever the user came from,
 * progress indication, and XP display.
 */
export function PracticeHeader({
  backHref,
  backLabel = "Back",
  progress = null,
  xp = null,
  isAuthenticated = false,
  onBack,
}: PracticeHeaderProps) {
  const router = useRouter();

  const handleBack = useCallback(() => {
    if (onBack) {
      onBack();
      return;
    }
    if (backHref) {
      router.push(backHref);
      return;
    }
    // Fallback: go back in history
    router.back();
  }, [backHref, onBack, router]);

  return (
    <header className="relative z-10 flex items-center gap-3 px-4 py-3 sm:px-5">
      {/* Back button or Logo */}
      {backHref !== undefined && backHref !== null ? (
        <button
          type="button"
          onClick={handleBack}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.08] text-[hsl(30,20%,95%)] transition-colors hover:bg-white/[0.14] active:scale-95"
          aria-label={backLabel}
        >
          <ArrowLeft className="h-4.5 w-4.5" />
        </button>
      ) : (
        <div className="flex items-center gap-2 opacity-60">
          <Logo variant="icon" className="h-5 w-5 invert" />
        </div>
      )}

      {/* Progress bar */}
      {progress !== null && (
        <div className="flex-1 mx-2">
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.1]">
            <motion.div
              className="h-full rounded-full bg-[hsl(18,76%,55%)]"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          </div>
        </div>
      )}

      {/* XP counter */}
      {xp !== null && (
        <div className="flex items-center gap-1.5 rounded-full bg-white/[0.08] px-3 py-1.5 text-xs font-bold tabular-nums text-[hsl(18,76%,55%)]">
          <Zap className="h-3.5 w-3.5" />
          {xp}
        </div>
      )}

      {/* Spacer when no progress bar */}
      {progress === null && <div className="flex-1" />}
    </header>
  );
}

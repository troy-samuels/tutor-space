"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";
import type { RecapSummary } from "@/lib/recap/types";
import { DEFAULT_UI_STRINGS } from "@/lib/recap/types";

type WelcomeCardProps = {
  summary: RecapSummary;
  createdAt: string;
  onContinue: () => void;
};

export default function WelcomeCard({
  summary,
  createdAt,
  onContinue,
}: WelcomeCardProps) {
  const ui = { ...DEFAULT_UI_STRINGS, ...summary.uiStrings };
  const dateLocale = summary.tutorLanguage ?? "en-GB";
  const dateStr = new Date(createdAt).toLocaleDateString(dateLocale, {
    day: "numeric",
    month: "short",
  });

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      {/* Animated emoji */}
      <motion.div
        className="text-5xl"
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
      >
        📚
      </motion.div>

      {/* Title */}
      <motion.h1
        className="mt-4 text-center font-heading text-2xl text-foreground"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {ui.yourLessonRecap}
      </motion.h1>

      {/* Encouragement card */}
      <motion.div
        className={cn(
          "mt-6 max-w-sm rounded-2xl border bg-card p-5"
        )}
        style={{ borderColor: "rgba(245, 242, 239, 0.08)" }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <p className="text-sm italic leading-relaxed text-foreground/80">
          &ldquo;{summary.encouragement}&rdquo;
        </p>
      </motion.div>

      {/* Metadata */}
      <motion.p
        className="mt-4 text-xs text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {summary.language}
        {summary.level ? ` · ${summary.level}` : ""}
        {` · ${dateStr}`}
      </motion.p>

      {/* Covered topics */}
      {summary.covered.length > 0 && (
        <motion.div
          className="mt-6 w-full max-w-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <p className="mb-2 text-sm font-semibold text-foreground">
            {ui.whatWeCovered}
          </p>
          <div className="flex flex-wrap gap-2">
            {summary.covered.map((topic, i) => (
              <motion.span
                key={topic}
                className={cn(
                  "rounded-full border bg-card px-3 py-1 text-xs text-foreground/70"
                )}
                style={{ borderColor: "rgba(245, 242, 239, 0.08)" }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + i * 0.08 }}
              >
                {topic}
              </motion.span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Continue button */}
      <motion.button
        onClick={onContinue}
        className={cn(
          "mt-8 w-full max-w-sm rounded-xl bg-primary py-3 font-semibold text-white",
          "transition-all hover:brightness-110 active:scale-[0.98]"
        )}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
      >
        {ui.continue}
      </motion.button>

      {/* Footer */}
      <motion.div
        className="mt-4 flex items-center justify-center opacity-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ delay: 1 }}
      >
        <Logo variant="wordmark" className="h-5 invert" />
      </motion.div>
    </div>
  );
}

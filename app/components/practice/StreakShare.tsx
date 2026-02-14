"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Share2 } from "lucide-react";

type StreakShareProps = {
  streak: number;
  practiceLink?: string;
};

/**
 * Renders a streak-specific social share CTA for viral loop amplification.
 */
export function StreakShare({ streak, practiceLink = "/practice" }: StreakShareProps) {
  const [copied, setCopied] = useState(false);

  const shareMessage = useMemo(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://tutorlingua.com";
    const resolvedLink =
      practiceLink.startsWith("http")
        ? practiceLink
        : `${origin}${practiceLink.startsWith("/") ? practiceLink : `/${practiceLink}`}`;
    return `I'm on a ${streak}-day learning streak on TutorLingua! ${resolvedLink}`;
  }, [practiceLink, streak]);

  if (streak < 3) {
    return null;
  }

  const handleShare = async () => {
    try {
      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        await navigator.share({
          title: "My TutorLingua streak",
          text: shareMessage,
        });
        return;
      }

      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareMessage);
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      }
    } catch {
      // Silent: sharing should never block the UI.
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className="rounded-2xl border border-white/[0.1] bg-white/[0.05] p-4 backdrop-blur-xl"
    >
      <p className="text-sm font-semibold text-foreground">You&apos;re on a {streak}-day streak! 🔥</p>
      <motion.button
        type="button"
        whileTap={{ scale: 0.98 }}
        onClick={handleShare}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-primary/50 bg-primary/20 px-4 py-2 text-xs font-semibold text-foreground shadow-[0_0_24px_-8px_rgba(232,120,77,0.6)]"
      >
        <Share2 className="h-3.5 w-3.5" />
        {copied ? "Streak copied" : "Share your streak"}
      </motion.button>
    </motion.div>
  );
}

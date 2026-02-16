"use client";

import { motion } from "framer-motion";
import { forwardRef } from "react";

interface ShareCardProps {
  score: number;
  label: string;
  learnedPhrase: string;
  isCJK?: boolean;
  languageCode?: string;
  languageName?: string;
}

/**
 * Social share card — 320×480 branded card for sharing streaks,
 * scores, and learned phrases. CJK-friendly rendering.
 */
const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(
  function ShareCard(
    { score, label, learnedPhrase, isCJK = false, languageCode, languageName },
    ref
  ) {
    return (
      <div
        ref={ref}
        className="relative w-[320px] h-[480px] bg-background rounded-3xl overflow-hidden border border-border flex flex-col p-6 shadow-xl"
      >
        {/* Decorative gradient blob */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        {/* Header */}
        <div className="flex items-center gap-2 mb-4 relative z-10">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
            TL
          </div>
          <span className="font-bold text-foreground/80 text-sm">
            TutorLingua
          </span>
          {languageCode && (
            <span className="ml-auto text-xs font-semibold bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
              {languageCode.toUpperCase()}
            </span>
          )}
        </div>

        {/* Big stat */}
        <div className="flex-1 flex flex-col justify-center items-center relative z-10">
          <motion.span
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="text-7xl font-bold text-primary drop-shadow-md mb-2"
          >
            {score}
          </motion.span>
          <span className="text-xs text-muted-foreground uppercase tracking-[0.2em]">
            {label}
          </span>
        </div>

        {/* Learned phrase */}
        <div className="bg-card/80 rounded-xl p-4 mb-4 backdrop-blur-sm border border-border relative z-10">
          <p
            className={`text-foreground text-lg text-center break-words line-clamp-3 ${
              isCJK ? "font-medium leading-relaxed" : "font-bold"
            }`}
          >
            {learnedPhrase}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between relative z-10">
          <span className="text-[10px] text-muted-foreground">
            tutorlingua.com
          </span>
          {languageName && (
            <span className="text-[10px] text-muted-foreground">
              Learning {languageName}
            </span>
          )}
        </div>
      </div>
    );
  }
);

export default ShareCard;

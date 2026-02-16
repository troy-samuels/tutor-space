"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SentenceCategory } from "@/lib/games/data/missing-piece/types";

interface SentenceDisplayProps {
  sentence: string;
  category: SentenceCategory;
  difficulty: 1 | 2 | 3;
}

const CATEGORY_LABELS: Record<SentenceCategory, { label: string; emoji: string }> = {
  grammar: { label: "Grammar", emoji: "📐" },
  vocabulary: { label: "Vocabulary", emoji: "📖" },
  preposition: { label: "Prepositions", emoji: "📍" },
  gender: { label: "Gender", emoji: "⚧️" },
  tense: { label: "Tense", emoji: "⏰" },
  idiom: { label: "Idiom", emoji: "💬" },
};

const DIFFICULTY_DOTS: Record<number, string> = {
  1: "●○○",
  2: "●●○",
  3: "●●●",
};

export default function SentenceDisplay({
  sentence,
  category,
  difficulty,
}: SentenceDisplayProps) {
  const catInfo = CATEGORY_LABELS[category];
  // Split sentence on ___ to highlight the blank
  const parts = sentence.split("___");

  return (
    <div className="space-y-3">
      {/* Category badge + difficulty */}
      <div className="flex items-center justify-center gap-2">
        <Badge variant="outline" className="gap-1 text-xs">
          {catInfo.emoji} {catInfo.label}
        </Badge>
        <span className="text-xs text-muted-foreground tracking-wider">
          {DIFFICULTY_DOTS[difficulty]}
        </span>
      </div>

      {/* Sentence */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="rounded-2xl border border-border/50 bg-card p-6 text-center"
      >
        <p className="text-lg font-medium leading-relaxed text-foreground sm:text-xl">
          {parts.map((part, i) => (
            <span key={i}>
              {part}
              {i < parts.length - 1 && (
                <motion.span
                  animate={{
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className={cn(
                    "mx-1 inline-block rounded-lg border-2 border-dashed border-primary/50 px-4 py-0.5",
                    "bg-primary/[0.08] text-primary font-bold",
                  )}
                >
                  ???
                </motion.span>
              )}
            </span>
          ))}
        </p>
      </motion.div>
    </div>
  );
}

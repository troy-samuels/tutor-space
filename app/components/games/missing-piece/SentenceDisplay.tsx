"use client";

import { motion } from "framer-motion";
import { SPRING } from "@/lib/games/springs";
import { cn } from "@/lib/utils";
import type { SentenceCategory } from "@/lib/games/data/missing-piece/types";

interface SentenceDisplayProps {
  sentence: string;
  category: SentenceCategory;
  difficulty: 1 | 2 | 3;
  /** Language code — used to adapt gap styling for CJK/non-space languages */
  language?: string;
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

/** Languages that don't use spaces between words — use block gap instead of underline */
const NO_SPACE_LANGUAGES = new Set(["ja", "zh", "th"]);

export default function SentenceDisplay({
  sentence,
  category,
  difficulty,
  language,
}: SentenceDisplayProps) {
  const catInfo = CATEGORY_LABELS[category];
  const parts = sentence.split("___");
  const useBlockGap = language && NO_SPACE_LANGUAGES.has(language);

  return (
    <div className="space-y-3">
      {/* Category badge + difficulty */}
      <div className="flex items-center justify-center gap-2">
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "12px",
            fontWeight: 500,
            padding: "2px 10px",
            borderRadius: "9999px",
            border: "1px solid rgba(45, 42, 38, 0.15)",
            color: "#6B6560",
          }}
        >
          {catInfo.emoji} {catInfo.label}
        </span>
        <span className="text-xs tracking-wider" style={{ color: "#9C9590" }}>
          {DIFFICULTY_DOTS[difficulty]}
        </span>
      </div>

      {/* Sentence */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING.standard}
        className="rounded-2xl p-6 text-center"
        style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)" }}
      >
        <p className="text-lg font-medium leading-relaxed sm:text-xl" style={{ color: "#2D2A26" }}>
          {parts.map((part, i) => (
            <span key={i}>
              {part}
              {i < parts.length - 1 && (
                <motion.span
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className={cn(
                    "mx-1 inline-block font-bold",
                    useBlockGap
                      ? "rounded-lg border-2 border-dashed w-12 h-8 align-middle"
                      : "rounded-lg border-2 border-dashed px-4 py-0.5",
                  )}
                  style={{
                    borderColor: "rgba(211,97,53,0.45)",
                    background: "rgba(211,97,53,0.08)",
                    color: "#D36135",
                  }}
                >
                  {useBlockGap ? "\u3000" : "???"}
                </motion.span>
              )}
            </span>
          ))}
        </p>
      </motion.div>
    </div>
  );
}

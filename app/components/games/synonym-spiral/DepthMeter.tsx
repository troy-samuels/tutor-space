"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { DepthLevel } from "@/lib/games/data/synonym-spiral/types";

interface DepthMeterProps {
  currentDepth: DepthLevel | 0;
  maxDepth?: DepthLevel;
  language: string;
}

const DEPTH_LABELS: Record<string, Record<DepthLevel, string>> = {
  en: { 1: "Basic", 2: "Intermediate", 3: "Advanced", 4: "Literary", 5: "Poetic" },
  es: { 1: "Básico", 2: "Intermedio", 3: "Avanzado", 4: "Literario", 5: "Poético" },
  fr: { 1: "Basique", 2: "Intermédiaire", 3: "Avancé", 4: "Littéraire", 5: "Poétique" },
  de: { 1: "Grundstufe", 2: "Mittelstufe", 3: "Fortgeschritten", 4: "Literarisch", 5: "Poetisch" },
};

// Light-theme depth colours — readable on cream/white background
const DEPTH_COLOURS: Record<DepthLevel, { bg: string; border: string; text: string; numBg: string }> = {
  1: { bg: "bg-emerald-100", border: "border-emerald-300", text: "text-emerald-700", numBg: "bg-emerald-200" },
  2: { bg: "bg-sky-100", border: "border-sky-300", text: "text-sky-700", numBg: "bg-sky-200" },
  3: { bg: "bg-indigo-100", border: "border-indigo-300", text: "text-indigo-700", numBg: "bg-indigo-200" },
  4: { bg: "bg-purple-100", border: "border-purple-300", text: "text-purple-700", numBg: "bg-purple-200" },
  5: { bg: "bg-amber-100", border: "border-amber-300", text: "text-amber-700", numBg: "bg-amber-200" },
};

const CEFR_LABELS: Record<DepthLevel, string> = {
  1: "A1-A2",
  2: "B1",
  3: "B2",
  4: "C1",
  5: "C2",
};

export default function DepthMeter({ currentDepth, maxDepth = 5, language }: DepthMeterProps) {
  const labels = DEPTH_LABELS[language] || DEPTH_LABELS.en;

  // Render from top (5) to bottom (1)
  const levels: DepthLevel[] = [5, 4, 3, 2, 1];

  return (
    <div className="flex flex-col items-center gap-1">
      {levels.map((level) => {
        const isReached = currentDepth >= level;
        const isCurrent = currentDepth === level;
        const isTarget = currentDepth + 1 === level || (currentDepth === 0 && level === 1);
        const colours = DEPTH_COLOURS[level];

        if (level > maxDepth) return null;

        return (
          <motion.div
            key={level}
            initial={false}
            animate={{
              scale: isCurrent ? 1.05 : 1,
              opacity: isReached ? 1 : isTarget ? 0.7 : 0.35,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={cn(
              "flex w-full items-center gap-2 rounded-lg border px-2 py-1 transition-all",
              isReached
                ? `${colours.bg} ${colours.border}`
                : isTarget
                  ? "border-black/10 bg-[#F5EDE8]/60"
                  : "border-black/[0.06] bg-black/[0.02]",
            )}
          >
            <div
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold flex-shrink-0",
                isReached ? `${colours.numBg} ${colours.text}` : "bg-[#F5EDE8] text-[#9C9590]",
              )}
            >
              {level}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "truncate text-[10px] font-medium leading-tight",
                  isReached ? colours.text : "text-[#9C9590]",
                )}
              >
                {labels[level]}
              </p>
              <p
                className="text-[8px] leading-tight"
                style={{ color: isReached ? "#6B6560" : "rgba(156,149,144,0.5)" }}
              >
                {CEFR_LABELS[level]}
              </p>
            </div>
            {isReached && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                className={cn("text-[10px] flex-shrink-0", colours.text)}
              >
                ✓
              </motion.span>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

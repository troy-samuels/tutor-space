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
  es: { 1: "Básico", 2: "Intermedio", 3: "Avanzado", 4: "Literario", 5: "Poético" },
  fr: { 1: "Basique", 2: "Intermédiaire", 3: "Avancé", 4: "Littéraire", 5: "Poétique" },
  de: { 1: "Grundstufe", 2: "Mittelstufe", 3: "Fortgeschritten", 4: "Literarisch", 5: "Poetisch" },
};

const DEPTH_COLOURS: Record<DepthLevel, { bg: string; border: string; text: string; glow: string }> = {
  1: { bg: "bg-emerald-500/20", border: "border-emerald-500/50", text: "text-emerald-400", glow: "shadow-emerald-500/20" },
  2: { bg: "bg-cyan-500/20", border: "border-cyan-500/50", text: "text-cyan-400", glow: "shadow-cyan-500/20" },
  3: { bg: "bg-blue-500/20", border: "border-blue-500/50", text: "text-blue-400", glow: "shadow-blue-500/20" },
  4: { bg: "bg-purple-500/20", border: "border-purple-500/50", text: "text-purple-400", glow: "shadow-purple-500/20" },
  5: { bg: "bg-amber-500/20", border: "border-amber-500/50", text: "text-amber-400", glow: "shadow-amber-500/20" },
};

const CEFR_LABELS: Record<DepthLevel, string> = {
  1: "A1-A2",
  2: "B1",
  3: "B2",
  4: "C1",
  5: "C2",
};

export default function DepthMeter({ currentDepth, maxDepth = 5, language }: DepthMeterProps) {
  const labels = DEPTH_LABELS[language] || DEPTH_LABELS.es;

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
              opacity: isReached ? 1 : isTarget ? 0.7 : 0.3,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={cn(
              "flex w-full items-center gap-2 rounded-lg border px-2 py-1 transition-all",
              isReached
                ? `${colours.bg} ${colours.border}`
                : isTarget
                  ? "border-white/20 bg-white/[0.04]"
                  : "border-white/[0.06] bg-white/[0.02]",
              isCurrent && `shadow-lg ${colours.glow}`,
            )}
          >
            <div
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold",
                isReached ? `${colours.bg} ${colours.text}` : "bg-white/[0.06] text-muted-foreground/50",
              )}
            >
              {level}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "truncate text-[10px] font-medium leading-tight",
                  isReached ? colours.text : "text-muted-foreground/50",
                )}
              >
                {labels[level]}
              </p>
              <p
                className={cn(
                  "text-[8px] leading-tight",
                  isReached ? "text-muted-foreground" : "text-muted-foreground/30",
                )}
              >
                {CEFR_LABELS[level]}
              </p>
            </div>
            {isReached && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                className="text-[10px]"
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

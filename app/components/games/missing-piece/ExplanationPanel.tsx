"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ExplanationPanelProps {
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string;
}

export default function ExplanationPanel({
  isCorrect,
  correctAnswer,
  explanation,
}: ExplanationPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, height: 0 }}
      animate={{ opacity: 1, y: 0, height: "auto" }}
      exit={{ opacity: 0, y: -10, height: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="overflow-hidden"
    >
      <div
        className={cn(
          "rounded-xl border p-4",
          isCorrect
            ? "border-emerald-500/30 bg-emerald-500/10"
            : "border-destructive/30 bg-destructive/10",
        )}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{isCorrect ? "✅" : "❌"}</span>
          <h4 className="text-sm font-bold text-foreground">
            {isCorrect ? "Correct!" : `Answer: ${correctAnswer}`}
          </h4>
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
          {explanation}
        </p>
      </div>
    </motion.div>
  );
}

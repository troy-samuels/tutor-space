"use client";

import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import type { ErrorCorrection } from "@/components/practice/mock-data";

interface CorrectionChipProps {
  correction: ErrorCorrection;
}

const springTransition = {
  type: "spring" as const,
  stiffness: 400,
  damping: 30,
};

export default function CorrectionChip({ correction }: CorrectionChipProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springTransition}
      className="mx-0"
    >
      <div className="backdrop-blur-xl bg-primary/[0.08] border border-primary/20 rounded-xl px-4 py-3 shadow-[0_0_20px_-10px_rgba(232,120,77,0.2)]">
        <div className="flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-foreground">
              <span className="line-through text-muted-foreground">
                {correction.wrong}
              </span>
              {" → "}
              <span className="font-semibold text-primary">
                {correction.correct}
              </span>
            </p>
            {correction.explanation && (
              <p className="text-xs text-muted-foreground mt-1">
                {correction.explanation}
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

"use client";

import { motion } from "framer-motion";
import { Lightbulb } from "lucide-react";

interface WhyInsightCardProps {
  explanation: string;
  onDismiss: () => void;
}

const springTransition = {
  type: "spring" as const,
  stiffness: 400,
  damping: 30,
};

export default function WhyInsightCard({
  explanation,
  onDismiss,
}: WhyInsightCardProps) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={springTransition}
      onClick={onDismiss}
      className="w-full rounded-xl border border-white/[0.1] bg-white/[0.05] px-4 py-3 text-left backdrop-blur-xl"
    >
      <div className="flex items-start gap-3 border-l-2 border-primary/65 pl-3">
        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div>
          <p className="text-[11px] uppercase tracking-[0.08em] text-[#E8A84D]">
            Why this correction
          </p>
          <p className="mt-0.5 text-xs text-foreground">{explanation}</p>
        </div>
      </div>
    </motion.button>
  );
}

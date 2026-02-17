"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface StepChainProps {
  startWord: string;
  steps: string[];
  targetWord: string;
  isComplete: boolean;
}

const springTransition = {
  type: "spring" as const,
  stiffness: 300,
  damping: 25,
};

export default function StepChain({
  startWord,
  steps,
  targetWord,
  isComplete,
}: StepChainProps) {
  return (
    <div className="flex flex-col items-center gap-0">
      {/* Start word */}
      <motion.div
        layout
        className={cn(
          "flex h-14 w-full max-w-[240px] items-center justify-center rounded-xl border px-4 text-lg font-bold tracking-widest",
          "bg-[#A0C35A]/15 border-[#A0C35A]/30 text-[#A0C35A]",
        )}
      >
        {startWord}
      </motion.div>

      {/* Connecting dot */}
      <div className="flex h-6 w-px items-center justify-center bg-border/30">
        <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
      </div>

      {/* Steps */}
      <AnimatePresence>
        {steps.map((step, i) => (
          <motion.div
            key={`${step}-${i}`}
            initial={{ opacity: 0, scale: 0.8, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ ...springTransition, delay: 0.05 }}
            className="flex flex-col items-center"
          >
            <div
              className={cn(
                "flex h-12 w-full max-w-[240px] items-center justify-center rounded-xl border px-4 text-base font-semibold tracking-widest",
                "bg-primary/[0.12] border-primary/30 text-primary",
              )}
            >
              {step}
            </div>
            {/* Connecting dot between steps or before target */}
            <div className="flex h-6 w-px items-center justify-center bg-border/30">
              <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Empty slots (placeholder) */}
      {!isComplete && steps.length === 0 && (
        <motion.div
          layout
          className="flex flex-col items-center"
        >
          <div className="flex h-12 w-full max-w-[240px] items-center justify-center rounded-xl border border-dashed border-white/[0.1] px-4 text-base text-muted-foreground/40">
            ???
          </div>
          <div className="flex h-6 w-px items-center justify-center bg-border/30">
            <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
          </div>
        </motion.div>
      )}

      {/* Target word */}
      <motion.div
        layout
        className={cn(
          "flex h-14 w-full max-w-[240px] items-center justify-center rounded-xl border px-4 text-lg font-bold tracking-widest",
          isComplete
            ? "bg-[#F9DF6D]/20 border-[#F9DF6D]/50 text-[#F9DF6D]"
            : "bg-[#F9DF6D]/10 border-[#F9DF6D]/20 text-[#F9DF6D]/60",
        )}
      >
        {targetWord}
      </motion.div>
    </div>
  );
}

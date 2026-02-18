"use client";

import { motion, AnimatePresence } from "framer-motion";

interface StepChainProps {
  startWord: string;
  steps: string[];
  targetWord: string;
  isComplete: boolean;
  par?: number;
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
  par,
}: StepChainProps) {
  return (
    <div className="flex flex-col items-center gap-0">
      {/* Start word — brand sage green */}
      <motion.div
        layout
        className="flex h-14 w-full max-w-[240px] items-center justify-center rounded-xl border px-4 text-lg font-bold tracking-widest"
        style={{
          background: "rgba(62,86,65,0.12)",
          borderColor: "rgba(62,86,65,0.35)",
          color: "#3E5641",
        }}
      >
        {startWord}
      </motion.div>

      {/* Connecting dot */}
      <div className="flex h-6 items-center justify-center" style={{ width: 2, background: "rgba(0,0,0,0.15)" }}>
        <div
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: "rgba(0,0,0,0.2)" }}
        />
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
            {/* Step word — brand accent orange */}
            <div
              className="flex h-12 w-full max-w-[240px] items-center justify-center rounded-xl border px-4 text-base font-semibold tracking-widest"
              style={{
                background: "rgba(211,97,53,0.10)",
                borderColor: "rgba(211,97,53,0.30)",
                color: "#D36135",
              }}
            >
              {step}
            </div>
            {/* Connecting dot between steps */}
            <div className="flex h-6 items-center justify-center" style={{ width: 2, background: "rgba(0,0,0,0.15)" }}>
              <div
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: "rgba(0,0,0,0.2)" }}
              />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Placeholder — steps remaining */}
      {!isComplete && (
        <motion.div layout className="flex flex-col items-center">
          <div
            className="flex h-12 w-full max-w-[240px] items-center justify-center rounded-xl border border-dashed px-4 text-sm gap-1.5"
            style={{
              borderColor: "rgba(0,0,0,0.15)",
              color: "#9C9590",
            }}
          >
            {par != null ? (
              <span>
                {Math.max(0, (par ?? 0) - steps.length)} step
                {(par ?? 0) - steps.length !== 1 ? "s" : ""} to go
              </span>
            ) : (
              "???"
            )}
          </div>
          <div className="flex h-6 items-center justify-center" style={{ width: 2, background: "rgba(0,0,0,0.15)" }}>
            <div
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: "rgba(0,0,0,0.2)" }}
            />
          </div>
        </motion.div>
      )}

      {/* Target word — brand gold/warning */}
      <motion.div
        layout
        className="flex h-14 w-full max-w-[240px] items-center justify-center rounded-xl border px-4 text-lg font-bold tracking-widest"
        style={
          isComplete
            ? {
                background: "rgba(212,168,67,0.15)",
                borderColor: "rgba(212,168,67,0.45)",
                color: "#D4A843",
              }
            : {
                background: "rgba(212,168,67,0.08)",
                borderColor: "rgba(212,168,67,0.20)",
                color: "rgba(212,168,67,0.65)",
              }
        }
      >
        {targetWord}
      </motion.div>
    </div>
  );
}

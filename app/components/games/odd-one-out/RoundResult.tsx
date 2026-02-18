"use client";

import { motion } from "framer-motion";
import { SPRING } from "@/lib/games/springs";

interface RoundResultProps {
  isCorrect: boolean;
  category: string;
  explanation: string;
}

export default function RoundResult({
  isCorrect,
  category,
  explanation,
}: RoundResultProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, height: 0 }}
      animate={{ opacity: 1, y: 0, height: "auto" }}
      exit={{ opacity: 0, y: -10, height: 0 }}
      transition={SPRING.standard}
      className="overflow-hidden"
    >
      <div
        className="rounded-xl border p-4"
        style={
          isCorrect
            ? { background: "rgba(62,86,65,0.08)", borderColor: "rgba(62,86,65,0.25)" }
            : { background: "rgba(162,73,54,0.08)", borderColor: "rgba(162,73,54,0.25)" }
        }
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{isCorrect ? "✅" : "❌"}</span>
          <h4 className="text-sm font-bold" style={{ color: "#2D2A26" }}>
            {category}
          </h4>
        </div>
        <p className="mt-1.5 text-xs leading-relaxed" style={{ color: "#6B6560" }}>
          {explanation}
        </p>
      </div>
    </motion.div>
  );
}

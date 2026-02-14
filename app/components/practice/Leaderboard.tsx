"use client";

import { motion } from "framer-motion";
import { Crown, Flame } from "lucide-react";

type LeaderboardProps = {
  languageLabel?: string;
};

const LEADERBOARD_MOCK = [
  { name: "Sarah M.", minutes: 216 },
  { name: "Marco T.", minutes: 198 },
  { name: "Nadia R.", minutes: 187 },
];

/**
 * Shows lightweight leaderboard proof-of-competition on the practice home screen.
 */
export function Leaderboard({ languageLabel = "Spanish" }: LeaderboardProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, type: "spring", stiffness: 220, damping: 24 }}
      className="mt-6 rounded-3xl border border-white/[0.1] bg-white/[0.05] p-4 backdrop-blur-xl"
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[#E8A84D]">
          <Crown className="h-3.5 w-3.5" />
          Most Active This Week
        </p>
        <span className="text-[10px] text-muted-foreground">Live data coming soon</span>
      </div>

      <div className="space-y-2">
        {LEADERBOARD_MOCK.map((entry, index) => (
          <div
            key={entry.name}
            className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-background/60 px-3 py-2"
          >
            <p className="text-sm text-foreground">
              <span className="mr-2 text-muted-foreground">#{index + 1}</span>
              {entry.name}
            </p>
            <p className="text-xs text-muted-foreground">{entry.minutes} min</p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between rounded-xl border border-primary/30 bg-primary/10 px-3 py-2">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <Flame className="h-3.5 w-3.5 text-primary" />
          Your Rank: #47 of 312 {languageLabel} learners
        </p>
      </div>
    </motion.section>
  );
}

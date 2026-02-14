"use client";

import { motion } from "framer-motion";
import { Trophy, ArrowRight, Loader2 } from "lucide-react";

type ChallengeComparisonProps = {
  challengerName: string;
  challengerScore: number;
  yourScore: number;
  onChallengeAnother?: () => void;
  isSharingChallenge?: boolean;
};

/**
 * Displays side-by-side challenge score comparison after a challenge run.
 */
export function ChallengeComparison({
  challengerName,
  challengerScore,
  yourScore,
  onChallengeAnother,
  isSharingChallenge = false,
}: ChallengeComparisonProps) {
  const won = yourScore > challengerScore;
  const tied = yourScore === challengerScore;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 240, damping: 22 }}
      className="rounded-3xl border border-white/[0.1] bg-white/[0.05] p-5 backdrop-blur-xl"
    >
      <div className="mb-3 flex items-center gap-2 text-[#E8A84D]">
        <Trophy className="h-4 w-4" />
        <p className="text-sm font-semibold">Challenge Results</p>
      </div>
      <p className="text-sm text-foreground">
        You scored <span className="font-bold text-primary">{yourScore}</span> vs {challengerName}&apos;s{" "}
        <span className="font-bold text-muted-foreground">{challengerScore}</span>!
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        {won
          ? "You won this round. Challenge another friend."
          : tied
          ? "Tie game. Run it back and push higher."
          : "Close. Keep practising and challenge again."}
      </p>
      <button
        type="button"
        onClick={onChallengeAnother}
        disabled={isSharingChallenge}
        className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary"
      >
        {isSharingChallenge ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <ArrowRight className="h-3.5 w-3.5" />
        )}
        {isSharingChallenge ? "Creating challenge..." : "Challenge another friend"}
      </button>
    </motion.div>
  );
}

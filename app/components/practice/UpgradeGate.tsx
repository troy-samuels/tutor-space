"use client";

import { motion } from "framer-motion";
import { Sparkles, Mic, TrendingUp, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

type UpgradeGateVariant = "tutor-linked" | "solo";

interface UpgradeGateProps {
  variant: UpgradeGateVariant;
  onUpgrade: () => void;
  onDismiss?: () => void;
  isLoading?: boolean;
}

/**
 * Kinetic Slate full-screen upgrade gate shown when monthly session limits are reached.
 */
export default function UpgradeGate({
  variant,
  onUpgrade,
  onDismiss,
  isLoading = false,
}: UpgradeGateProps) {
  const isTutorLinked = variant === "tutor-linked";

  const title = isTutorLinked
    ? "You've used your 3 free sessions this month"
    : "You've used your 3 free sessions";
  const subtitle = isTutorLinked
    ? "Upgrade to Unlimited Practice - $4.99/mo"
    : "Unlock Unlimited Practice - $9.99/mo";
  const cta = isTutorLinked ? "Upgrade Now" : "Start Practising Unlimited";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#030303] px-4 py-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-[-8rem] h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -right-16 bottom-[-6rem] h-72 w-72 rounded-full bg-[#FF9E66]/15 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 160, damping: 20 }}
        className="relative w-full max-w-lg rounded-3xl border border-white/15 bg-white/[0.06] p-6 text-[#F6F3EE] shadow-[0_30px_90px_rgba(0,0,0,0.6)] backdrop-blur-2xl"
      >
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/12 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[#FFB48A]">
          <Sparkles className="h-3.5 w-3.5" />
          Practice Upgrade
        </div>

        <h2 className="text-xl font-semibold leading-tight text-white">{title}</h2>
        <p className="mt-2 text-base font-medium text-[#FFB48A]">{subtitle}</p>

        <div className="mt-6 space-y-3 rounded-2xl border border-white/10 bg-black/30 p-4">
          <FeatureRow icon={Mic} label="Unlimited sessions" />
          <FeatureRow icon={Mic} label="Voice input" />
          <FeatureRow icon={TrendingUp} label="Adaptive difficulty" />
          <FeatureRow icon={BarChart3} label="Full progress tracking" />
        </div>

        <div className="mt-6 space-y-3">
          <Button
            onClick={onUpgrade}
            disabled={isLoading}
            className="w-full rounded-2xl bg-primary py-6 text-base font-semibold text-background shadow-[0_14px_40px_rgba(232,120,77,0.35)] hover:bg-primary/80"
          >
            {cta}
          </Button>

          {!isTutorLinked && (
            <p className="px-1 text-center text-xs text-[#F1D7C8]/80">
              Have a tutor? Ask them to invite you for a lower price
            </p>
          )}

          {isTutorLinked && (
            <button
              type="button"
              onClick={onDismiss}
              className="w-full rounded-2xl border border-white/20 bg-white/5 py-3 text-sm text-[#DDD8D2] transition hover:bg-white/10 disabled:opacity-60"
              disabled={!onDismiss}
            >
              Continue next month for free
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

interface FeatureRowProps {
  icon: typeof Mic;
  label: string;
}

/**
 * Renders a single feature highlight row inside the upgrade gate.
 */
function FeatureRow({ icon: Icon, label }: FeatureRowProps) {
  return (
    <div className="flex items-center gap-2.5 text-sm text-[#F3ECE5]">
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-primary/30 bg-primary/15">
        <Icon className="h-4 w-4 text-[#FFB48A]" />
      </span>
      <span>{label}</span>
    </div>
  );
}

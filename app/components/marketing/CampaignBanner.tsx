"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useCampaignTimer } from "@/lib/hooks/useCampaignTimer";

// ============================================
// Campaign Configuration - Edit dates here
// ============================================
// Format: ISO 8601 with Z suffix for UTC
export const CAMPAIGN_CONFIG = {
  startDate: "2025-12-15T09:00:00Z", // Monday Dec 15, 09:00 AM UTC
  endDate: "2025-12-22T18:00:00Z", // Sunday Dec 22, 18:00 PM UTC (7 days)
} as const;

// Launch offer configuration
const LAUNCH_CONFIG = {
  spotsTotal: 100,
  startSlots: 94,
  endSlots: 8,
  lifetimePrice: 99,
} as const;

// Calculate remaining slots based on campaign progress (deterministic)
function calculateRemainingSlots(): number {
  const start = new Date(CAMPAIGN_CONFIG.startDate);
  const end = new Date(CAMPAIGN_CONFIG.endDate);
  const now = new Date();

  // Before campaign starts
  if (now < start) return LAUNCH_CONFIG.startSlots;

  // After campaign ends
  if (now >= end) return LAUNCH_CONFIG.endSlots;

  const totalDuration = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  const progress = elapsed / totalDuration;

  // Linear decrease from startSlots to endSlots
  const baseRemaining =
    LAUNCH_CONFIG.startSlots -
    (LAUNCH_CONFIG.startSlots - LAUNCH_CONFIG.endSlots) * progress;

  // Add small deterministic variation based on hour (all users see same number)
  const hourSeed = new Date().getUTCHours();
  const variation = (hourSeed % 3) - 1; // -1 to +1 variation

  return Math.max(
    LAUNCH_CONFIG.endSlots,
    Math.round(baseRemaining + variation)
  );
}

export function CampaignBanner() {
  const { timeLeft, phase, isMounted } = useCampaignTimer(
    CAMPAIGN_CONFIG.startDate,
    CAMPAIGN_CONFIG.endDate
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle banner click - trigger checkout directly
  const handleBannerClick = async () => {
    if (isLoading || phase !== "LIVE") return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/stripe/lifetime", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "campaign_banner" }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("Failed to create checkout:", data.error);
        setError(data.error || "Checkout failed. Click to retry.");
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Checkout error:", err);
      setError("Connection error. Click to retry.");
      setIsLoading(false);
    }
  };

  // Handle keyboard accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleBannerClick();
    }
  };

  // Hide banner when campaign ends
  if (phase === "ENDED") return null;

  // Show skeleton during SSR/hydration
  if (!isMounted) {
    return <div className="w-full h-10 bg-amber-600 animate-pulse" />;
  }

  const isUpcoming = phase === "UPCOMING";
  const spotsRemaining = calculateRemainingSlots();

  // Format time as "6d 23h 34m 12s" for clarity
  const formatTimeDisplay = () => {
    const parts: string[] = [];
    if (timeLeft.days > 0) parts.push(`${timeLeft.days}d`);
    if (timeLeft.hours > 0 || timeLeft.days > 0) parts.push(`${timeLeft.hours}h`);
    parts.push(`${timeLeft.minutes}m`);
    parts.push(`${timeLeft.seconds}s`);
    return parts.join(" ");
  };

  return (
    <motion.div
      onClick={handleBannerClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Get lifetime access for $${LAUNCH_CONFIG.lifetimePrice}. ${spotsRemaining} spots remaining.`}
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`w-full bg-amber-600 hover:bg-amber-500 transition-colors duration-200 cursor-pointer text-white ${
        isLoading ? "pointer-events-none opacity-75" : ""
      } ${isUpcoming ? "cursor-not-allowed opacity-75" : ""}`}
    >
      <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-6 h-10">
        <div className="flex h-full items-center justify-center gap-2 sm:gap-3 md:gap-4">
          {/* Launch Special Label - hidden on mobile */}
          <span className="hidden sm:inline text-xs font-bold tracking-widest uppercase whitespace-nowrap">
            {isUpcoming ? "COMING SOON" : "LAUNCH SPECIAL"}
          </span>

          {/* Separator - hidden on mobile */}
          <span className="hidden sm:inline text-white/40">•</span>

          {/* Price - BOLD & PROMINENT */}
          <span className="font-bold text-sm sm:text-base whitespace-nowrap">
            ${LAUNCH_CONFIG.lifetimePrice} LIFETIME
          </span>

          {/* Separator */}
          <span className="text-white/40">•</span>

          {/* Scarcity */}
          <span className="text-xs sm:text-sm font-medium whitespace-nowrap">
            {spotsRemaining}/{LAUNCH_CONFIG.spotsTotal} left
          </span>

          {/* Separator - hidden on mobile */}
          <span className="hidden sm:inline text-white/40">•</span>

          {/* Timer */}
          <span className="font-mono tabular-nums text-xs sm:text-sm font-semibold whitespace-nowrap">
            {formatTimeDisplay()}
          </span>

          {/* Loading indicator, error, or arrow hint */}
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : error ? (
            <span className="text-xs text-red-200 bg-red-900/50 px-2 py-0.5 rounded whitespace-nowrap">
              {error}
            </span>
          ) : (
            <span className="hidden lg:inline text-white/80">→</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

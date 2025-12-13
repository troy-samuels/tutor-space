"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useCampaignTimer } from "@/lib/hooks/useCampaignTimer";

// ============================================
// Campaign Configuration - Edit dates here
// ============================================
// 12:00 PM London in December = UTC+0 (no daylight saving)
// Format: ISO 8601 with Z suffix for UTC
export const CAMPAIGN_CONFIG = {
  startDate: "2025-12-12T12:00:00Z", // Friday Dec 12, 12:00 PM London
  endDate: "2025-12-15T12:00:00Z", // Monday Dec 15, 12:00 PM London (72 hours)
} as const;

// Launch offer configuration
const LAUNCH_CONFIG = {
  spotsTotal: 100,
  spotsRemaining: 87, // Static - update manually if needed
  lifetimePrice: 99,
} as const;

export function CampaignBanner() {
  const { timeLeft, phase, isMounted } = useCampaignTimer(
    CAMPAIGN_CONFIG.startDate,
    CAMPAIGN_CONFIG.endDate
  );
  const [isLoading, setIsLoading] = useState(false);

  // Handle banner click - trigger checkout directly
  const handleBannerClick = async () => {
    if (isLoading || phase !== "LIVE") return;

    setIsLoading(true);
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
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Checkout error:", error);
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
  const totalHours = timeLeft.days * 24 + timeLeft.hours;
  const timeSegments = [
    Math.max(0, totalHours),
    timeLeft.minutes,
    timeLeft.seconds,
  ].map((segment) => String(segment).padStart(2, "0"));

  return (
    <motion.div
      onClick={handleBannerClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Get lifetime access for $${LAUNCH_CONFIG.lifetimePrice}. ${LAUNCH_CONFIG.spotsRemaining} spots remaining.`}
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
            {LAUNCH_CONFIG.spotsRemaining}/{LAUNCH_CONFIG.spotsTotal} left
          </span>

          {/* Separator - hidden on mobile */}
          <span className="hidden sm:inline text-white/40">•</span>

          {/* Timer */}
          <span className="font-mono tabular-nums text-xs sm:text-sm font-semibold whitespace-nowrap">
            {timeSegments[0]}:{timeSegments[1]}:{timeSegments[2]}
          </span>

          {/* Loading indicator or arrow hint */}
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <span className="hidden lg:inline text-white/80">→</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

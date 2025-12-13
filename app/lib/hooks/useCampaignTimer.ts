"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { toZonedTime } from "date-fns-tz";

type CampaignPhase = "UPCOMING" | "LIVE" | "ENDED";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface UseCampaignTimerReturn {
  timeLeft: TimeLeft;
  phase: CampaignPhase;
  isMounted: boolean;
}

/**
 * A hydration-safe countdown timer hook for campaign start/end dates.
 *
 * @param startDate - ISO string for campaign start (e.g., "2025-01-15T09:00:00Z")
 * @param endDate - ISO string for campaign end (e.g., "2025-01-31T23:59:59Z")
 * @returns timeLeft (days, hours, minutes, seconds), phase, and isMounted flag
 *
 * @example
 * ```tsx
 * const { timeLeft, phase, isMounted } = useCampaignTimer(startDate, endDate);
 *
 * if (!isMounted) return <Skeleton />;
 *
 * return (
 *   <div>
 *     {phase === "LIVE" && <span>Ends in {timeLeft.days}d {timeLeft.hours}h</span>}
 *   </div>
 * );
 * ```
 */
export function useCampaignTimer(
  startDate: string,
  endDate: string
): UseCampaignTimerReturn {
  // Start with false to match server render (avoids hydration mismatch)
  const [isMounted, setIsMounted] = useState(false);
  const [phase, setPhase] = useState<CampaignPhase>("UPCOMING");
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const calculateTimeAndPhase = useCallback(() => {
    const TIMEZONE = "Europe/London";
    const now = toZonedTime(new Date(), TIMEZONE);
    const start = toZonedTime(new Date(startDate), TIMEZONE);
    const end = toZonedTime(new Date(endDate), TIMEZONE);

    let targetDate: Date;
    let newPhase: CampaignPhase;

    if (now < start) {
      // Campaign hasn't started yet - count down to start
      newPhase = "UPCOMING";
      targetDate = start;
    } else if (now >= start && now < end) {
      // Campaign is live - count down to end
      newPhase = "LIVE";
      targetDate = end;
    } else {
      // Campaign has ended
      newPhase = "ENDED";
      targetDate = end;
    }

    const diffMs = Math.max(0, targetDate.getTime() - now.getTime());
    const totalSeconds = Math.floor(diffMs / 1000);

    return {
      phase: newPhase,
      timeLeft: {
        days: Math.floor(totalSeconds / 86400),
        hours: Math.floor((totalSeconds % 86400) / 3600),
        minutes: Math.floor((totalSeconds % 3600) / 60),
        seconds: totalSeconds % 60,
      },
    };
  }, [startDate, endDate]);

  // Only run on client after mount to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true);

    // Initial calculation
    const initial = calculateTimeAndPhase();
    setPhase(initial.phase);
    setTimeLeft(initial.timeLeft);

    // Update every second
    intervalRef.current = setInterval(() => {
      const result = calculateTimeAndPhase();
      setPhase(result.phase);
      setTimeLeft(result.timeLeft);
    }, 1000);

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [calculateTimeAndPhase]);

  return { timeLeft, phase, isMounted };
}

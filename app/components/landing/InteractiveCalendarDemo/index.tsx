"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { startOfMonth, addDays } from "date-fns";
import { MiniMonthCalendar } from "./MiniMonthCalendar";
import { DayLessonsPanel } from "./DayLessonsPanel";
import { generateDemoBookings, getBookingsForDate } from "./demo-data";

// Auto-cycle timing (milliseconds)
const CYCLE_INTERVAL = 4000; // 4 seconds per date
const RESUME_DELAY = 10000; // Resume after 10s inactivity

// Demo sequence: date offsets to cycle through
const DATE_SEQUENCE = [0, 1, 4, 6, 8]; // Today, tomorrow, +4 days, +6 days, +8 days

// Hook to detect prefers-reduced-motion
function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return prefersReducedMotion;
}

export function InteractiveCalendarDemo() {
  const today = useMemo(() => new Date(), []);
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(today));
  const [selectedDate, setSelectedDate] = useState<Date | null>(today);

  // Generate demo bookings once
  const bookings = useMemo(() => generateDemoBookings(), []);

  // Auto-cycle state
  const [, setDateIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const resumeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const prefersReducedMotion = useReducedMotion();

  // Get bookings for selected date
  const selectedDateBookings = useMemo(() => {
    if (!selectedDate) return [];
    return getBookingsForDate(selectedDate, bookings);
  }, [selectedDate, bookings]);

  // Handle user interaction - pause auto-cycle
  const handleInteraction = useCallback(() => {
    setIsPaused(true);

    // Clear existing resume timer
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
    }

    // Set new resume timer
    resumeTimerRef.current = setTimeout(() => {
      setIsPaused(false);
      // Reset to beginning of sequence when resuming
      setDateIndex(0);
      setSelectedDate(today);
      setCurrentMonth(startOfMonth(today));
    }, RESUME_DELAY);
  }, [today]);

  // Handle manual date selection
  const handleDateSelect = useCallback(
    (date: Date) => {
      handleInteraction();
      setSelectedDate(date);
    },
    [handleInteraction]
  );

  // Handle manual month change
  const handleMonthChange = useCallback(
    (month: Date) => {
      handleInteraction();
      setCurrentMonth(month);
    },
    [handleInteraction]
  );

  // Auto-cycle through dates
  useEffect(() => {
    // Don't auto-cycle if paused or reduced motion
    if (isPaused || prefersReducedMotion) return;

    const timer = setInterval(() => {
      setDateIndex((currentIndex) => {
        const nextIndex = (currentIndex + 1) % DATE_SEQUENCE.length;
        const nextDateOffset = DATE_SEQUENCE[nextIndex];
        const nextDate = addDays(today, nextDateOffset);

        // Update selected date and month
        setSelectedDate(nextDate);
        setCurrentMonth(startOfMonth(nextDate));

        return nextIndex;
      });
    }, CYCLE_INTERVAL);

    return () => clearInterval(timer);
  }, [isPaused, prefersReducedMotion, today]);

  // Cleanup resume timer on unmount
  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) {
        clearTimeout(resumeTimerRef.current);
      }
    };
  }, []);

  return (
    <div
      className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-0"
      data-testid="interactive-calendar-demo"
    >
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Left: Monthly Calendar */}
        <MiniMonthCalendar
          currentMonth={currentMonth}
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
          onMonthChange={handleMonthChange}
          bookings={bookings}
        />

        {/* Right: Day's Lessons */}
        <DayLessonsPanel date={selectedDate} bookings={selectedDateBookings} />
      </div>
    </div>
  );
}

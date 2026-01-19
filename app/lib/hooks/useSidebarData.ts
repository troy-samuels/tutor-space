/**
 * useSidebarData Hook
 *
 * Manages sidebar state and data loading for daily lessons and external events
 * in the calendar component.
 *
 * Extracted from calendar-page-client.tsx to reduce component complexity.
 */

import { useState, useCallback, useEffect } from "react";
import { getDailyLessons } from "@/lib/actions/calendar-sidebar";
import { getDayEvents } from "@/lib/actions/calendar-events";
import type { DailyLesson } from "@/lib/actions/types";
import type { CalendarEvent } from "@/lib/types/calendar";

interface UseSidebarDataOptions {
  initialDate?: Date;
  refreshKey?: number;
}

interface UseSidebarDataReturn {
  // Selected date state
  selectedDate: Date | null;
  setSelectedDate: (date: Date | null) => void;

  // Sidebar visibility
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;

  // Data
  dailyLessons: DailyLesson[];
  externalEvents: CalendarEvent[];

  // Loading state
  isLoading: boolean;

  // Actions
  loadDayData: (date: Date) => Promise<void>;
  handleDateSelect: (date: Date, onActiveDateChange?: (date: Date) => void) => void;
  handleSidebarClose: () => void;
}

export function useSidebarData({
  initialDate,
  refreshKey = 0,
}: UseSidebarDataOptions = {}): UseSidebarDataReturn {
  // Selected date and sidebar state
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    initialDate || null
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Data state
  const [dailyLessons, setDailyLessons] = useState<DailyLesson[]>([]);
  const [externalEvents, setExternalEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadDayData = useCallback(async (date: Date) => {
    setIsLoading(true);
    try {
      const [lessonsResult, eventsResult] = await Promise.all([
        getDailyLessons(date),
        getDayEvents(date.toISOString()),
      ]);

      setDailyLessons(lessonsResult.lessons);

      // Filter to only external events (Google/Outlook)
      const external = (eventsResult.events || []).filter(
        (e) => e.type === "google" || e.type === "outlook"
      );
      setExternalEvents(external);
    } catch (error) {
      console.error("Failed to load day data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleDateSelect = useCallback(
    (date: Date, onActiveDateChange?: (date: Date) => void) => {
      setSelectedDate(date);
      setSidebarOpen(true);
      loadDayData(date);

      if (onActiveDateChange) {
        onActiveDateChange(date);
      }
    },
    [loadDayData]
  );

  const handleSidebarClose = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  // Reload data when refreshKey changes and sidebar is open
  useEffect(() => {
    if (selectedDate && sidebarOpen && refreshKey > 0) {
      loadDayData(selectedDate);
    }
  }, [refreshKey, selectedDate, sidebarOpen, loadDayData]);

  return {
    selectedDate,
    setSelectedDate,
    sidebarOpen,
    setSidebarOpen,
    dailyLessons,
    externalEvents,
    isLoading,
    loadDayData,
    handleDateSelect,
    handleSidebarClose,
  };
}

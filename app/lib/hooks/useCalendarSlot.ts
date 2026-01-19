/**
 * useCalendarSlot Hook
 *
 * Manages time slot selection, quick actions popover, and blocking functionality
 * for the calendar component.
 *
 * Extracted from calendar-page-client.tsx to reduce component complexity.
 */

import { useState, useCallback } from "react";
import { createBlockedTime } from "@/lib/actions/blocked-times";

interface UseCalendarSlotOptions {
  onDateSelect: (date: Date) => void;
  onRefresh: () => void;
  onFeedback: (feedback: { type: "success" | "error"; message: string }) => void;
}

interface UseCalendarSlotReturn {
  // Quick actions state
  quickActionsOpen: boolean;
  setQuickActionsOpen: (open: boolean) => void;
  quickActionsPosition: { x: number; y: number };

  // Pending slot state
  pendingSlotDate: Date | undefined;
  pendingSlotHour: number | undefined;

  // Event handlers
  handleTimeSlotClick: (
    date: Date,
    hour: number,
    clickEvent?: React.MouseEvent
  ) => void;
  handleQuickActionsBlockTime: () => { date: Date; hour: number } | null;
  handleQuickActionsCreateBooking: () => { date: Date; hour: number } | null;
  handleInstantBlock: (durationMinutes: number) => Promise<void>;

  // Utilities
  formatBlockDuration: (minutes: number) => string;
}

export function useCalendarSlot({
  onDateSelect,
  onRefresh,
  onFeedback,
}: UseCalendarSlotOptions): UseCalendarSlotReturn {
  // Quick actions popover state
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [quickActionsPosition, setQuickActionsPosition] = useState({
    x: 0,
    y: 0,
  });

  // Pending slot state (selected time slot waiting for action)
  const [pendingSlotDate, setPendingSlotDate] = useState<Date | undefined>();
  const [pendingSlotHour, setPendingSlotHour] = useState<number | undefined>();

  const formatBlockDuration = useCallback((minutes: number) => {
    if (minutes <= 0) return "0m";
    if (minutes % 60 === 0) {
      return `${minutes / 60}hr`;
    }
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    return `${hours}hr ${remainder}m`;
  }, []);

  const handleTimeSlotClick = useCallback(
    (date: Date, hour: number, clickEvent?: React.MouseEvent) => {
      setPendingSlotDate(date);
      setPendingSlotHour(hour);
      onDateSelect(date);

      if (clickEvent) {
        setQuickActionsPosition({
          x: clickEvent.clientX,
          y: clickEvent.clientY,
        });
        setQuickActionsOpen(true);
      } else {
        setQuickActionsOpen(false);
      }

    },
    [onDateSelect]
  );

  const handleQuickActionsBlockTime = useCallback(() => {
    if (!pendingSlotDate || pendingSlotHour === undefined) return null;
    return { date: pendingSlotDate, hour: pendingSlotHour };
  }, [pendingSlotDate, pendingSlotHour]);

  const handleQuickActionsCreateBooking = useCallback(() => {
    if (!pendingSlotDate || pendingSlotHour === undefined) return null;
    return { date: pendingSlotDate, hour: pendingSlotHour };
  }, [pendingSlotDate, pendingSlotHour]);

  const handleInstantBlock = useCallback(
    async (durationMinutes: number) => {
      if (!pendingSlotDate || pendingSlotHour === undefined) return;

      const startDateTime = new Date(pendingSlotDate);
      startDateTime.setHours(pendingSlotHour, 0, 0, 0);

      const endDateTime = new Date(startDateTime);
      endDateTime.setMinutes(endDateTime.getMinutes() + durationMinutes);

      const result = await createBlockedTime({
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
      });

      if (result.success) {
        onRefresh();
        onFeedback({
          type: "success",
          message: `Blocked ${formatBlockDuration(durationMinutes)} successfully.`,
        });
      } else {
        onFeedback({
          type: "error",
          message: result.error || "Failed to block time.",
        });
      }
    },
    [formatBlockDuration, onFeedback, onRefresh, pendingSlotDate, pendingSlotHour]
  );

  return {
    quickActionsOpen,
    setQuickActionsOpen,
    quickActionsPosition,
    pendingSlotDate,
    pendingSlotHour,
    handleTimeSlotClick,
    handleQuickActionsBlockTime,
    handleQuickActionsCreateBooking,
    handleInstantBlock,
    formatBlockDuration,
  };
}

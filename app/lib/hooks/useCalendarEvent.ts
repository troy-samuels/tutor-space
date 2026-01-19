/**
 * useCalendarEvent Hook
 *
 * Manages event selection, popover display, and reschedule dialog state
 * for the calendar component.
 *
 * Extracted from calendar-page-client.tsx to reduce component complexity.
 */

import { useState, useCallback } from "react";
import type { CalendarEvent } from "@/lib/types/calendar";

interface UseCalendarEventOptions {
  onDateSelect: (date: Date) => void;
}

interface UseCalendarEventReturn {
  // Event selection state
  selectedEvent: CalendarEvent | null;
  setSelectedEvent: (event: CalendarEvent | null) => void;

  // Event popover state
  eventPopoverOpen: boolean;
  setEventPopoverOpen: (open: boolean) => void;
  eventPopoverPosition: { x: number; y: number };
  popoverEvent: CalendarEvent | null;

  // Reschedule dialog state
  rescheduleOpen: boolean;
  setRescheduleOpen: (open: boolean) => void;

  // Event handlers
  handleEventClick: (
    event: CalendarEvent,
    clickEvent?: React.MouseEvent
  ) => void;
  handlePopoverReschedule: (event: CalendarEvent) => void;
  handleRescheduleSuccess: (newStartIso: string) => void;

  // Close popover
  closeEventPopover: () => void;
}

export function useCalendarEvent({
  onDateSelect,
}: UseCalendarEventOptions): UseCalendarEventReturn {
  // Event selection state
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null
  );

  // Event popover state
  const [eventPopoverOpen, setEventPopoverOpen] = useState(false);
  const [eventPopoverPosition, setEventPopoverPosition] = useState({
    x: 0,
    y: 0,
  });
  const [popoverEvent, setPopoverEvent] = useState<CalendarEvent | null>(null);

  // Reschedule dialog state
  const [rescheduleOpen, setRescheduleOpen] = useState(false);

  const closeEventPopover = useCallback(() => {
    setEventPopoverOpen(false);
    setPopoverEvent(null);
  }, []);

  const handleEventClick = useCallback(
    (event: CalendarEvent, clickEvent?: React.MouseEvent) => {
      const eventDate = new Date(event.start);
      onDateSelect(eventDate);
      setSelectedEvent(event);

      if (clickEvent) {
        setEventPopoverPosition({
          x: clickEvent.clientX,
          y: clickEvent.clientY,
        });
        setPopoverEvent(event);
        setEventPopoverOpen(true);
      } else {
        setEventPopoverOpen(false);
        setPopoverEvent(null);
      }

    },
    [onDateSelect]
  );

  const handlePopoverReschedule = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
    setRescheduleOpen(true);
  }, []);

  const handleRescheduleSuccess = useCallback(
    (newStartIso: string) => {
      if (selectedEvent) {
        setSelectedEvent({ ...selectedEvent, start: newStartIso });
      }
    },
    [selectedEvent]
  );

  return {
    selectedEvent,
    setSelectedEvent,
    eventPopoverOpen,
    setEventPopoverOpen,
    eventPopoverPosition,
    popoverEvent,
    rescheduleOpen,
    setRescheduleOpen,
    handleEventClick,
    handlePopoverReschedule,
    handleRescheduleSuccess,
    closeEventPopover,
  };
}

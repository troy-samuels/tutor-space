"use client";

import { useEffect, useCallback } from "react";

type CalendarShortcutActions = {
  onNewBooking: () => void;    // N key
  onBlockTime: () => void;     // B key
  onAvailability: () => void;  // A key
  onToday: () => void;         // T key
};

export function useCalendarKeyboardShortcuts(
  actions: CalendarShortcutActions,
  enabled: boolean = true
) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea/contenteditable
      const target = e.target as HTMLElement;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target.isContentEditable
      ) {
        return;
      }

      // Ignore if modifier keys pressed
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      switch (e.key.toLowerCase()) {
        case "n":
          e.preventDefault();
          actions.onNewBooking();
          break;
        case "b":
          e.preventDefault();
          actions.onBlockTime();
          break;
        case "a":
          e.preventDefault();
          actions.onAvailability();
          break;
        case "t":
          e.preventDefault();
          actions.onToday();
          break;
      }
    },
    [actions]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, handleKeyDown]);
}

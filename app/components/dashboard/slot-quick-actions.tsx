"use client";

import { useRef, useEffect } from "react";
import { Ban, CalendarPlus } from "lucide-react";

type SlotQuickActionsProps = {
  isOpen: boolean;
  onClose: () => void;
  position: { x: number; y: number };
  onBlockTime: () => void;
  onCreateBooking: () => void;
};

export function SlotQuickActions({
  isOpen,
  onClose,
  position,
  onBlockTime,
  onCreateBooking,
}: SlotQuickActionsProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  // Adjust position to keep popover in viewport
  useEffect(() => {
    if (!isOpen || !popoverRef.current) return;

    const popover = popoverRef.current;
    const rect = popover.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Adjust if going off right edge
    if (rect.right > viewportWidth - 16) {
      popover.style.left = `${viewportWidth - rect.width - 16}px`;
    }

    // Adjust if going off bottom edge
    if (rect.bottom > viewportHeight - 16) {
      popover.style.top = `${position.y - rect.height - 8}px`;
    }
  }, [isOpen, position]);

  if (!isOpen) return null;

  return (
    <div
      ref={popoverRef}
      className="fixed z-50 rounded-xl border border-border bg-white shadow-lg animate-in fade-in zoom-in-95 duration-150"
      style={{
        left: position.x,
        top: position.y + 8,
      }}
    >
      <div className="py-1">
        <button
          onClick={() => {
            onCreateBooking();
            onClose();
          }}
          className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          <CalendarPlus className="h-4 w-4 text-primary" />
          Create Booking
        </button>
        <button
          onClick={() => {
            onBlockTime();
            onClose();
          }}
          className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          <Ban className="h-4 w-4 text-muted-foreground" />
          Block Time
        </button>
      </div>
    </div>
  );
}

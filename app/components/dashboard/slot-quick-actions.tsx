"use client";

import { useRef, useEffect, useState } from "react";
import { Ban, CalendarPlus, Clock, Loader2 } from "lucide-react";

type SlotQuickActionsProps = {
  isOpen: boolean;
  onClose: () => void;
  position: { x: number; y: number };
  onBlockTime: () => void;
  onCreateBooking: () => void;
  onQuickBlock?: (durationMinutes: number) => Promise<void>;
  slotDate?: Date;
  slotHour?: number;
};

export function SlotQuickActions({
  isOpen,
  onClose,
  position,
  onBlockTime,
  onCreateBooking,
  onQuickBlock,
  slotDate,
  slotHour,
}: SlotQuickActionsProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [isBlocking, setIsBlocking] = useState<number | null>(null);

  const handleQuickBlock = async (minutes: number) => {
    if (!onQuickBlock) return;
    setIsBlocking(minutes);
    try {
      await onQuickBlock(minutes);
      onClose();
    } catch {
      // Error handled by parent
    } finally {
      setIsBlocking(null);
    }
  };

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

  const showQuickBlock = onQuickBlock && slotDate && slotHour !== undefined;

  return (
    <div
      ref={popoverRef}
      className="fixed z-50 w-48 rounded-xl border border-border bg-white shadow-lg animate-in fade-in zoom-in-95 duration-150"
      style={{
        left: position.x,
        top: position.y + 8,
      }}
    >
      <div className="py-1">
        {/* Quick Block Section */}
        {showQuickBlock && (
          <>
            <div className="px-3 py-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Quick Block
              </span>
            </div>
            <div className="flex gap-1.5 px-3 pb-2">
              <button
                onClick={() => handleQuickBlock(60)}
                disabled={isBlocking !== null}
                className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-border px-2 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50 transition-colors"
              >
                {isBlocking === 60 ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <>
                    <Clock className="h-3 w-3" />
                    1hr
                  </>
                )}
              </button>
              <button
                onClick={() => handleQuickBlock(120)}
                disabled={isBlocking !== null}
                className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-border px-2 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50 transition-colors"
              >
                {isBlocking === 120 ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <>
                    <Clock className="h-3 w-3" />
                    2hr
                  </>
                )}
              </button>
            </div>
            <div className="border-t border-border" />
          </>
        )}

        {/* Main Actions */}
        <button
          onClick={() => {
            onCreateBooking();
            onClose();
          }}
          disabled={isBlocking !== null}
          className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
        >
          <CalendarPlus className="h-4 w-4 text-primary" />
          Create Booking
        </button>
        <button
          onClick={() => {
            onBlockTime();
            onClose();
          }}
          disabled={isBlocking !== null}
          className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
        >
          <Ban className="h-4 w-4 text-muted-foreground" />
          Block Time...
        </button>
      </div>
    </div>
  );
}

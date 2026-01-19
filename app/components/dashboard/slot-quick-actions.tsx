"use client";

import { useEffect, useState } from "react";
import { Ban, CalendarPlus, Clock, Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetOverlay } from "@/components/ui/sheet";
import { useIsMobile } from "@/lib/hooks/useMediaQuery";
import { usePopoverClose } from "@/lib/hooks/usePopoverClose";
import { usePopoverPosition } from "@/lib/hooks/usePopoverPosition";

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
  const isMobile = useIsMobile();
  const { popoverRef, close } = usePopoverClose({
    isOpen,
    onClose,
    disableClickOutside: isMobile,
  });
  const { position: adjustedPosition, setClickPosition } = usePopoverPosition({
    popoverRef,
    offset: { x: 0, y: 8 },
  });
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

  useEffect(() => {
    if (!isOpen || !popoverRef.current || isMobile) return;
    setClickPosition(position);
  }, [isOpen, position, isMobile, setClickPosition]);

  const showQuickBlock = onQuickBlock && slotDate && slotHour !== undefined;

  // Shared action buttons content
  const ActionButtons = () => (
    <div className={isMobile ? "py-2" : "py-1"}>
      {/* Quick Block Section */}
      {showQuickBlock && (
        <>
          <div className={isMobile ? "px-4 py-2" : "px-3 py-1.5"}>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Block time
            </span>
          </div>
          <div className={isMobile ? "flex flex-wrap gap-2 px-4 pb-3" : "flex flex-wrap gap-1.5 px-3 pb-2"}>
            <button
              onClick={() => handleQuickBlock(30)}
              disabled={isBlocking !== null}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-border font-medium hover:bg-muted disabled:opacity-50 transition-colors ${
                isMobile ? "min-w-[4.5rem] px-3 py-3 text-sm" : "min-w-[3.5rem] px-2 py-1.5 text-xs"
              }`}
            >
              {isBlocking === 30 ? (
                <Loader2 className={isMobile ? "h-4 w-4 animate-spin" : "h-3 w-3 animate-spin"} />
              ) : (
                <>
                  <Clock className={isMobile ? "h-4 w-4" : "h-3 w-3"} />
                  30m
                </>
              )}
            </button>
            <button
              onClick={() => handleQuickBlock(60)}
              disabled={isBlocking !== null}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-border font-medium hover:bg-muted disabled:opacity-50 transition-colors ${
                isMobile ? "min-w-[4.5rem] px-3 py-3 text-sm" : "min-w-[3.5rem] px-2 py-1.5 text-xs"
              }`}
            >
              {isBlocking === 60 ? (
                <Loader2 className={isMobile ? "h-4 w-4 animate-spin" : "h-3 w-3 animate-spin"} />
              ) : (
                <>
                  <Clock className={isMobile ? "h-4 w-4" : "h-3 w-3"} />
                  1hr
                </>
              )}
            </button>
            <button
              onClick={() => handleQuickBlock(120)}
              disabled={isBlocking !== null}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-border font-medium hover:bg-muted disabled:opacity-50 transition-colors ${
                isMobile ? "min-w-[4.5rem] px-3 py-3 text-sm" : "min-w-[3.5rem] px-2 py-1.5 text-xs"
              }`}
            >
              {isBlocking === 120 ? (
                <Loader2 className={isMobile ? "h-4 w-4 animate-spin" : "h-3 w-3 animate-spin"} />
              ) : (
                <>
                  <Clock className={isMobile ? "h-4 w-4" : "h-3 w-3"} />
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
          close();
        }}
        disabled={isBlocking !== null}
        className={`flex w-full items-center gap-3 font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50 ${
          isMobile ? "px-4 py-4 text-base" : "px-4 py-2.5 text-sm"
        }`}
      >
        <CalendarPlus className={isMobile ? "h-5 w-5 text-primary" : "h-4 w-4 text-primary"} />
        Create Booking
      </button>
      <button
        onClick={() => {
          onBlockTime();
          close();
        }}
        disabled={isBlocking !== null}
        className={`flex w-full items-center gap-3 font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50 ${
          isMobile ? "px-4 py-4 text-base" : "px-4 py-2.5 text-sm"
        }`}
      >
        <Ban className={isMobile ? "h-5 w-5 text-muted-foreground" : "h-4 w-4 text-muted-foreground"} />
        Block Time...
      </button>
    </div>
  );

  // Mobile: Bottom sheet
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={(open) => !open && close()} side="bottom">
        <SheetOverlay onClick={close} />
        <SheetContent
          side="bottom"
          className="inset-x-0 w-full rounded-t-2xl pb-safe"
        >
          {/* Drag handle */}
          <div className="flex justify-center py-3">
            <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
          </div>
          <ActionButtons />
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Floating popover
  if (!isOpen) return null;

  return (
    <div
      ref={popoverRef}
      className="fixed z-50 w-48 rounded-xl border border-border bg-white shadow-lg animate-in fade-in zoom-in-95 duration-150"
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
      }}
    >
      <ActionButtons />
    </div>
  );
}

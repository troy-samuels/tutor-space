"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Globe, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GroupedSlots } from "@/lib/actions/student-bookings";

type TimeSlotSelectorProps = {
  slots: GroupedSlots;
  selectedSlot: { start: string; end: string } | null;
  onSelectSlot: (slot: { start: string; end: string }) => void;
  timezone: string;
  isLoading?: boolean;
};

export function TimeSlotSelector({
  slots,
  selectedSlot,
  onSelectSlot,
  timezone,
  isLoading = false,
}: TimeSlotSelectorProps) {
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const dateScrollRef = useRef<HTMLDivElement>(null);

  // Reset to first date when slots change
  useEffect(() => {
    setSelectedDateIndex(0);
  }, [slots]);

  // Scroll selected date into view
  useEffect(() => {
    if (dateScrollRef.current) {
      const selectedButton = dateScrollRef.current.querySelector(
        `[data-index="${selectedDateIndex}"]`
      );
      if (selectedButton) {
        selectedButton.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [selectedDateIndex]);

  const scrollDates = (direction: "left" | "right") => {
    if (dateScrollRef.current) {
      const scrollAmount = 200;
      dateScrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (slots.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-muted/30 p-6 text-center">
        <CalendarDays className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
        <p className="text-sm font-medium text-foreground">No Available Times</p>
        <p className="mt-1 text-xs text-muted-foreground">
          This tutor has no available slots in the next 14 days.
        </p>
      </div>
    );
  }

  const currentDate = slots[selectedDateIndex];
  const currentSlots = currentDate?.slots || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Select a Time</h3>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Globe className="h-3.5 w-3.5" />
          <span>{timezone}</span>
        </div>
      </div>

      {/* Date selector */}
      <div className="relative">
        <button
          type="button"
          onClick={() => scrollDates("left")}
          className="absolute left-0 top-1/2 z-10 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md border border-border hover:bg-muted"
          aria-label="Scroll dates left"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div
          ref={dateScrollRef}
          className="flex gap-2 overflow-x-auto scrollbar-hide px-10 py-1 -mx-2"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {slots.map((day, index) => (
            <button
              key={day.date}
              type="button"
              data-index={index}
              onClick={() => setSelectedDateIndex(index)}
              className={cn(
                "flex min-w-[80px] flex-col items-center rounded-xl border px-4 py-2 transition shrink-0",
                selectedDateIndex === index
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "border-border bg-white hover:border-primary/40"
              )}
            >
              <span className="text-xs text-muted-foreground">
                {day.displayDate.split(",")[0]}
              </span>
              <span className="text-sm font-semibold text-foreground">
                {day.displayDate.split(", ")[1] || day.displayDate}
              </span>
              <span className="mt-0.5 text-[10px] text-muted-foreground">
                {day.slots.length} slot{day.slots.length !== 1 ? "s" : ""}
              </span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => scrollDates("right")}
          className="absolute right-0 top-1/2 z-10 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md border border-border hover:bg-muted"
          aria-label="Scroll dates right"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Time slots grid */}
      <div className="rounded-xl border border-border bg-white p-4">
        {currentSlots.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No available times on this date.
          </p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {currentSlots.map((slot) => {
              const isSelected =
                selectedSlot?.start === slot.start && selectedSlot?.end === slot.end;
              return (
                <button
                  key={slot.start}
                  type="button"
                  onClick={() => onSelectSlot({ start: slot.start, end: slot.end })}
                  disabled={isLoading}
                  className={cn(
                    "rounded-lg border px-3 py-2.5 text-sm font-medium transition",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-white text-foreground hover:border-primary/50 hover:bg-primary/5",
                    isLoading && "opacity-60 cursor-not-allowed"
                  )}
                >
                  {slot.displayTime}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useMemo } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import type { DemoBooking } from "./demo-data";
import { getBookingCountForDate } from "./demo-data";

type MiniMonthCalendarProps = {
  currentMonth: Date;
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  onMonthChange: (date: Date) => void;
  bookings: DemoBooking[];
};

export function MiniMonthCalendar({
  currentMonth,
  selectedDate,
  onDateSelect,
  onMonthChange,
  bookings,
}: MiniMonthCalendarProps) {
  // Generate grid dates for the month view
  const gridDates = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const handlePrev = () => {
    onMonthChange(subMonths(currentMonth, 1));
  };

  const handleNext = () => {
    onMonthChange(addMonths(currentMonth, 1));
  };

  // Day names - abbreviated on mobile, full on larger screens
  const dayNames = [
    { short: "S", medium: "Sun" },
    { short: "M", medium: "Mon" },
    { short: "T", medium: "Tue" },
    { short: "W", medium: "Wed" },
    { short: "T", medium: "Thu" },
    { short: "F", medium: "Fri" },
    { short: "S", medium: "Sat" },
  ];

  return (
    <section
      className="rounded-2xl sm:rounded-3xl border border-border bg-background/90 p-3 sm:p-5 shadow-sm"
      data-testid="mini-month-calendar"
    >
      {/* Header - mobile optimized */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          <div>
            <p className="text-[10px] sm:text-xs uppercase tracking-wide text-muted-foreground">
              Lesson calendar
            </p>
            <p className="text-base sm:text-lg font-semibold">
              {format(currentMonth, "MMMM yyyy")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={handlePrev}
            className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-border text-sm text-foreground transition hover:bg-muted active:scale-95"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-border text-sm text-foreground transition hover:bg-muted active:scale-95"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Day headers - single letters on mobile */}
      <div className="mt-4 sm:mt-6 grid grid-cols-7 gap-0.5 sm:gap-1 text-center text-[10px] sm:text-xs font-semibold text-muted-foreground">
        {dayNames.map((day, index) => (
          <div key={index} className="py-1">
            <span className="sm:hidden">{day.short}</span>
            <span className="hidden sm:inline">{day.medium}</span>
          </div>
        ))}
      </div>

      {/* Date grid - mobile optimized */}
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
        {gridDates.map((date) => {
          const bookingCount = getBookingCountForDate(date, bookings);
          const isCurrentMonth = isSameMonth(date, currentMonth);
          const selected = selectedDate ? isSameDay(date, selectedDate) : false;
          const isTodayDate = isToday(date);

          return (
            <button
              key={format(date, "yyyy-MM-dd")}
              type="button"
              onClick={() => {
                if (isCurrentMonth) {
                  onDateSelect(date);
                }
              }}
              disabled={!isCurrentMonth}
              className={[
                "relative aspect-square rounded-lg sm:rounded-xl border text-xs sm:text-sm font-medium transition-all active:scale-95",
                isCurrentMonth
                  ? "border-transparent hover:bg-muted"
                  : "border-transparent text-muted-foreground/40 cursor-default",
                selected ? "bg-primary text-white shadow-md" : "",
                isTodayDate && !selected ? "ring-2 ring-primary/30" : "",
              ].join(" ")}
              aria-label={`${format(date, "MMMM d, yyyy")}${bookingCount > 0 ? `, ${bookingCount} lesson${bookingCount > 1 ? "s" : ""}` : ""}`}
              aria-pressed={selected}
            >
              <span>{format(date, "d")}</span>
              {/* Booking indicators - mobile optimized */}
              <div className="mt-0.5 sm:mt-1 flex items-center justify-center gap-0.5">
                {bookingCount === 0 ? null : bookingCount <= 3 ? (
                  Array.from({ length: bookingCount }).map((_, index) => (
                    <span
                      key={index}
                      className={`h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-full ${selected ? "bg-white/80" : "bg-primary/70"}`}
                    />
                  ))
                ) : (
                  <span
                    className={`min-w-[1.2rem] sm:min-w-[1.4rem] rounded-full px-0.5 sm:px-1 text-[8px] sm:text-[10px] font-semibold ${
                      selected
                        ? "bg-white/80 text-primary"
                        : "bg-primary/15 text-primary"
                    }`}
                  >
                    {bookingCount}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

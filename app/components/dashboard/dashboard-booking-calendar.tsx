"use client";

import { useEffect, useMemo, useState } from "react";
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isBefore, isSameDay, isSameMonth, isToday, startOfDay, startOfMonth, startOfWeek, subMonths } from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { getMonthlyBookingCounts, type DayBookingInfo } from "@/lib/actions/calendar-sidebar";
import { PACKAGE_COLORS, type PackageType } from "@/lib/types/calendar";

type DashboardBookingCalendarProps = {
  signupDate?: string | null;
  selectedDate?: Date | null;
  onDateSelect?: (date: Date) => void;
  showBuiltInSidebar?: boolean;
};

const formatKey = (date: Date) => format(date, "yyyy-MM-dd");

// Get up to 3 dot colors for a day based on package types
function getDotColors(packageTypes: PackageType[], selected: boolean): string[] {
  // Priority order: subscription > trial > one_off/lesson_block
  const priorityOrder: PackageType[] = ["subscription", "trial", "lesson_block", "one_off"];

  // Sort and dedupe package types by priority
  const sorted = priorityOrder.filter((pt) => packageTypes.includes(pt));

  // Take up to 3 unique colors
  const colors: string[] = [];
  for (const pt of sorted) {
    const color = selected ? "bg-white/80" : PACKAGE_COLORS[pt].dot;
    if (!colors.includes(color)) {
      colors.push(color);
    }
    if (colors.length >= 3) break;
  }

  return colors;
}

export function DashboardBookingCalendar({
  signupDate,
  selectedDate: controlledSelectedDate,
  onDateSelect,
  showBuiltInSidebar = false,
}: DashboardBookingCalendarProps) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const earliest = useMemo(() => (signupDate ? startOfMonth(new Date(signupDate)) : startOfMonth(today)), [signupDate, today]);

  const initialSelected = isBefore(today, earliest) ? earliest : today;
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(initialSelected));
  const [internalSelectedDate, setInternalSelectedDate] = useState(initialSelected);
  const [bookingsByDay, setBookingsByDay] = useState<Record<string, DayBookingInfo>>({});
  const [loadingCounts, setLoadingCounts] = useState(false);

  // Use controlled date if provided, otherwise internal state
  const selectedDate = controlledSelectedDate ?? internalSelectedDate;

  useEffect(() => {
    let mounted = true;
    async function loadCounts() {
      setLoadingCounts(true);
      const response = await getMonthlyBookingCounts(currentMonth.getFullYear(), currentMonth.getMonth());
      if (mounted) {
        setBookingsByDay(response.bookingsByDay);
        setLoadingCounts(false);
      }
    }
    loadCounts();
    return () => {
      mounted = false;
    };
  }, [currentMonth]);

  const handleDateSelect = (date: Date) => {
    setInternalSelectedDate(date);
    onDateSelect?.(date);
  };

  const gridDates = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const canGoPrev = startOfMonth(currentMonth).getTime() > earliest.getTime();

  const handlePrev = () => {
    if (!canGoPrev) return;
    const nextMonthDate = subMonths(currentMonth, 1);
    setCurrentMonth(nextMonthDate);
    if (!isSameMonth(selectedDate, nextMonthDate)) {
      const targetDate = startOfMonth(nextMonthDate);
      setInternalSelectedDate(targetDate);
    }
  };

  const handleNext = () => {
    const nextMonthDate = addMonths(currentMonth, 1);
    setCurrentMonth(nextMonthDate);
    if (!isSameMonth(selectedDate, nextMonthDate)) {
      setInternalSelectedDate(startOfMonth(nextMonthDate));
    }
  };

  return (
    <section className="rounded-3xl border border-border bg-background/90 p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Lesson calendar</p>
            <p className="text-lg font-semibold">{format(currentMonth, "MMMM yyyy")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrev}
            disabled={!canGoPrev}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-sm text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-sm text-foreground transition hover:bg-muted"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted-foreground">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="py-1">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {gridDates.map((date) => {
          const key = formatKey(date);
          const dayInfo = bookingsByDay[key];
          const bookingCount = dayInfo?.count || 0;
          const packageTypes = dayInfo?.packageTypes || [];
          const disabled = isBefore(date, earliest);
          const isCurrentMonth = isSameMonth(date, currentMonth);
          const selected = isSameDay(date, selectedDate);
          const isTodayDate = isToday(date);

          // Get dot colors based on package types
          const dotColors = getDotColors(packageTypes, selected);

          return (
            <button
              key={key}
              type="button"
              onClick={() => {
                if (disabled || !isCurrentMonth) return;
                handleDateSelect(date);
              }}
              disabled={disabled || !isCurrentMonth}
              className={[
                "relative aspect-square rounded-xl border text-sm font-medium transition-all",
                isCurrentMonth ? "border-transparent hover:bg-muted" : "border-transparent text-muted-foreground/40 cursor-default",
                selected ? "bg-primary text-white shadow-md" : "",
                disabled ? "cursor-not-allowed opacity-40" : "",
                isTodayDate && !selected ? "ring-2 ring-primary/30" : "",
              ].join(" ")}
            >
              <span>{format(date, "d")}</span>
              <div className="mt-1 flex items-center justify-center gap-0.5">
                {bookingCount === 0 ? null : bookingCount <= 3 ? (
                  // Show colored dots based on package types
                  dotColors.length > 0 ? (
                    dotColors.map((color, index) => (
                      <span
                        key={index}
                        className={`h-1.5 w-1.5 rounded-full ${color}`}
                      />
                    ))
                  ) : (
                    // Fallback to count-based dots if no package types
                    Array.from({ length: bookingCount }).map((_, index) => (
                      <span
                        key={index}
                        className={`h-1.5 w-1.5 rounded-full ${selected ? "bg-white/80" : "bg-primary/70"}`}
                      />
                    ))
                  )
                ) : (
                  <span
                    className={`min-w-[1.4rem] rounded-full px-1 text-[10px] font-semibold ${
                      selected ? "bg-white/80 text-primary" : "bg-primary/15 text-primary"
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

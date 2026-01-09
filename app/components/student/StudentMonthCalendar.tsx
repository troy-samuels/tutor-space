"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { getStudentMonthlyLessonCounts, type DayLessonInfo } from "@/lib/actions/student-schedule";
import { PACKAGE_COLORS, type PackageType } from "@/lib/types/calendar";

type StudentMonthCalendarProps = {
  selectedDate?: Date | null;
  onDateSelect?: (date: Date) => void;
  tutorId?: string;
};

const formatKey = (date: Date) => format(date, "yyyy-MM-dd");

// Get up to 3 dot colors for a day based on package types
function getDotColors(packageTypes: PackageType[], selected: boolean): string[] {
  // Priority order: subscription > trial > one_off/lesson_block
  const priorityOrder: PackageType[] = ["subscription", "trial", "lesson_block", "one_off", "external"];

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

export function StudentMonthCalendar({
  selectedDate: controlledSelectedDate,
  onDateSelect,
  tutorId,
}: StudentMonthCalendarProps) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(today));
  const [internalSelectedDate, setInternalSelectedDate] = useState(today);
  const [lessonsByDay, setLessonsByDay] = useState<Record<string, DayLessonInfo>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Use controlled date if provided, otherwise internal state
  const selectedDate = controlledSelectedDate ?? internalSelectedDate;

  // Fetch lesson counts when month or tutor filter changes
  useEffect(() => {
    let mounted = true;
    async function loadCounts() {
      setIsLoading(true);
      const response = await getStudentMonthlyLessonCounts(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1, // month is 1-indexed in our action
        tutorId
      );
      if (mounted) {
        setLessonsByDay(response.counts);
        setIsLoading(false);
      }
    }
    loadCounts();
    return () => {
      mounted = false;
    };
  }, [currentMonth, tutorId]);

  // Sync controlled date with internal state
  useEffect(() => {
    if (!controlledSelectedDate) return;
    const nextMonth = startOfMonth(controlledSelectedDate);
    setCurrentMonth((prev) => (isSameMonth(prev, nextMonth) ? prev : nextMonth));
    setInternalSelectedDate(controlledSelectedDate);
  }, [controlledSelectedDate]);

  const handleDateSelect = (date: Date) => {
    setInternalSelectedDate(date);
    onDateSelect?.(date);
  };

  const gridDates = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const handlePrev = () => {
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
    <section className="flex-1 flex flex-col min-h-0 rounded-3xl border border-border bg-background/70 p-0 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">My Schedule</p>
            <p className="text-lg font-semibold">{format(currentMonth, "MMMM yyyy")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrev}
            className="flex h-9 w-9 items-center justify-center rounded-full text-sm text-foreground transition hover:bg-muted"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="flex h-9 w-9 items-center justify-center rounded-full text-sm text-foreground transition hover:bg-muted"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 flex flex-col min-h-0 px-4 pb-2">
        {/* Day Headers */}
        <div className="grid grid-cols-7 text-center text-xs font-semibold text-muted-foreground shrink-0">
          {[
            { short: "S", full: "Sun" },
            { short: "M", full: "Mon" },
            { short: "T", full: "Tue" },
            { short: "W", full: "Wed" },
            { short: "T", full: "Thu" },
            { short: "F", full: "Fri" },
            { short: "S", full: "Sat" },
          ].map(({ short, full }) => (
            <div key={full} className="py-2" aria-label={full}>
              <span className="sm:hidden">{short}</span>
              <span className="hidden sm:inline">{full}</span>
            </div>
          ))}
        </div>

        {/* Date Grid */}
        <div className={`flex-1 grid grid-cols-7 auto-rows-fr min-h-0 ${isLoading ? "opacity-50" : ""}`}>
          {gridDates.map((date) => {
            const key = formatKey(date);
            const dayInfo = lessonsByDay[key];
            const lessonCount = dayInfo?.count || 0;
            const packageTypes = dayInfo?.packageTypes || [];
            const isCurrentMonth = isSameMonth(date, currentMonth);
            const selected = isSameDay(date, selectedDate);
            const isTodayDate = isToday(date);
            const isPast = date < today && !isTodayDate;

            // Get dot colors based on package types
            const dotColors = getDotColors(packageTypes, selected).slice(0, 3);

            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  if (!isCurrentMonth) return;
                  handleDateSelect(date);
                }}
                disabled={!isCurrentMonth}
                className={[
                  "relative flex h-full min-h-[60px] flex-col items-center justify-between rounded-2xl p-2 text-center text-sm font-medium transition-all",
                  isCurrentMonth ? "text-foreground" : "text-muted-foreground/40 cursor-default",
                  isPast && isCurrentMonth ? "text-muted-foreground" : "",
                  selected && isCurrentMonth ? "bg-primary/10 ring-2 ring-primary/30" : "",
                  isCurrentMonth && !selected ? "hover:bg-stone-100" : "",
                ].join(" ")}
              >
                <div
                  className={[
                    "flex h-7 w-7 sm:h-8 sm:w-8 lg:h-9 lg:w-9 items-center justify-center rounded-full text-sm sm:text-base font-semibold shrink-0",
                    isTodayDate ? "bg-primary text-white" : "text-foreground",
                    selected && !isTodayDate ? "ring-2 ring-primary/40" : "",
                  ].join(" ")}
                >
                  {format(date, "d")}
                </div>

                {/* Lesson indicator dots */}
                <div className="mt-auto flex items-center justify-center gap-0.5 sm:gap-1">
                  {lessonCount === 0 ? null : dotColors.length > 0 ? (
                    dotColors.map((color, index) => (
                      <span
                        key={index}
                        className={`h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full ${color} ring-1 sm:ring-2 ring-white`}
                      />
                    ))
                  ) : (
                    Array.from({ length: Math.min(lessonCount, 3) }).map((_, index) => (
                      <span
                        key={index}
                        className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-primary ring-1 sm:ring-2 ring-white"
                      />
                    ))
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

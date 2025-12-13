"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

type StudentBookingRecord = {
  id: string;
  scheduled_at: string | null;
  duration_minutes: number | null;
  status: string;
  payment_status: string | null;
  payment_amount: number | null;
  currency: string | null;
  service: {
    name: string | null;
  } | null;
};

type StudentLessonsCalendarProps = {
  studentId: string;
  bookings: StudentBookingRecord[];
};

// Check if two dates are the same day
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

// Get days in month
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

// Get first day of month (0 = Sunday)
function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

// Format month name
function formatMonth(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

// Format selected date
function formatSelectedDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric"
  });
}

export function StudentLessonsCalendar({
  studentId,
  bookings,
}: StudentLessonsCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = new Date();

  // Get bookings grouped by date for current month
  const bookingsByDate = useMemo(() => {
    const map = new Map<string, StudentBookingRecord[]>();
    bookings.forEach((booking) => {
      if (!booking.scheduled_at) return;
      const date = new Date(booking.scheduled_at);
      if (date.getMonth() === month && date.getFullYear() === year) {
        const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(booking);
      }
    });
    return map;
  }, [bookings, month, year]);

  // Get lessons for selected date
  const lessonsOnSelectedDate = useMemo(() => {
    return bookings
      .filter((b) => {
        if (!b.scheduled_at) return false;
        return isSameDay(new Date(b.scheduled_at), selectedDate);
      })
      .sort((a, b) => {
        if (!a.scheduled_at || !b.scheduled_at) return 0;
        return new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime();
      });
  }, [bookings, selectedDate]);

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const handleDateClick = (day: number) => {
    setSelectedDate(new Date(year, month, day));
  };

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  if (bookings.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-white/90 p-6 text-center">
        <p className="text-sm font-semibold text-foreground">No lessons yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Book a first session to start this calendar.
        </p>
        <Button asChild className="mt-3">
          <a href={`/bookings?student=${studentId}`}>Book a lesson</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="py-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between px-4 mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePrevMonth}
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium text-foreground">
          {formatMonth(currentMonth)}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleNextMonth}
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Day Names */}
      <div className="grid grid-cols-7 gap-1 px-2 mb-2">
        {dayNames.map((day) => (
          <div
            key={day}
            className="text-center text-xs text-muted-foreground font-medium py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 px-2">
        {/* Empty cells for days before first of month */}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="h-10" />
        ))}

        {/* Day cells */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const date = new Date(year, month, day);
          const dateKey = `${year}-${month}-${day}`;
          const hasBookings = bookingsByDate.has(dateKey);
          const isToday = isSameDay(date, today);
          const isSelected = isSameDay(date, selectedDate);

          return (
            <motion.button
              key={day}
              onClick={() => handleDateClick(day)}
              whileTap={{ scale: 0.95 }}
              className={`
                relative h-10 flex flex-col items-center justify-center rounded-lg
                transition-colors duration-150
                ${isSelected
                  ? "bg-primary text-primary-foreground"
                  : isToday
                    ? "ring-1 ring-primary/50"
                    : "hover:bg-muted/50"
                }
              `}
            >
              <span className={`text-sm ${isSelected ? "font-medium" : ""}`}>
                {day}
              </span>
              {/* Booking dot */}
              {hasBookings && (
                <span
                  className={`
                    absolute bottom-1 w-1 h-1 rounded-full
                    ${isSelected ? "bg-primary-foreground" : "bg-primary"}
                  `}
                />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Divider */}
      <div className="border-t border-border/30 my-6 mx-4" />

      {/* Selected Date Lessons */}
      <div className="px-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
          {formatSelectedDate(selectedDate)}
        </p>

        {lessonsOnSelectedDate.length > 0 ? (
          <div className="space-y-2">
            {lessonsOnSelectedDate.map((lesson, index) => (
              <motion.div
                key={lesson.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3 text-sm"
              >
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {lesson.scheduled_at
                    ? new Date(lesson.scheduled_at).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })
                    : ""}
                </span>
                <span className="text-foreground">
                  {lesson.service?.name ?? "Lesson"}
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {lesson.duration_minutes}m
                </span>
                <span
                  className={`text-xs capitalize ${
                    lesson.status === "completed"
                      ? "text-green-600 dark:text-green-400"
                      : lesson.status === "cancelled"
                        ? "text-red-500 dark:text-red-400"
                        : "text-muted-foreground"
                  }`}
                >
                  {lesson.status}
                </span>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-3">
            No lessons on this date
          </p>
        )}
      </div>
    </div>
  );
}

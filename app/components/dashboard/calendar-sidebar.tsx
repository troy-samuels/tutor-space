"use client";

import { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Video,
  CalendarDays,
  Instagram,
  Globe,
  Share2,
} from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths } from "date-fns";
import { getDailyLessons, getMonthlyBookingCounts, type DailyLesson } from "@/lib/actions/calendar-sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";

export function CalendarSidebar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dailyLessons, setDailyLessons] = useState<DailyLesson[]>([]);
  const [monthlyCounts, setMonthlyCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad start of month to align with week grid
  const firstDayOfMonth = monthStart.getDay(); // 0 = Sunday
  const paddingDays = Array.from({ length: firstDayOfMonth }, (_, i) => {
    const date = new Date(monthStart);
    date.setDate(date.getDate() - (firstDayOfMonth - i));
    return date;
  });

  const allDays = [...paddingDays, ...daysInMonth];

  // Fetch monthly counts when month changes
  useEffect(() => {
    async function fetchMonthlyCounts() {
      const { counts } = await getMonthlyBookingCounts(
        currentDate.getFullYear(),
        currentDate.getMonth()
      );
      setMonthlyCounts(counts);
    }
    fetchMonthlyCounts();
  }, [currentDate]);

  // Fetch daily lessons when selected date changes
  useEffect(() => {
    async function fetchDailyLessons() {
      setLoading(true);
      const { lessons } = await getDailyLessons(selectedDate);
      setDailyLessons(lessons);
      setLoading(false);
    }
    fetchDailyLessons();
  }, [selectedDate]);

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const previousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const nextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const getDateKey = (date: Date) => format(date, "yyyy-MM-dd");
  const getLessonCount = (date: Date) => monthlyCounts[getDateKey(date)] || 0;

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex-1 space-y-6 overflow-y-auto p-6">
        {/* Calendar Widget */}
        <div className="rounded-2xl border border-border bg-background shadow-sm">
          {/* Month Navigation */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <button
              onClick={previousMonth}
              className="p-1.5 hover:bg-muted rounded-full transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h3 className="font-semibold text-sm">
              {format(currentDate, "MMMM yyyy")}
            </h3>
            <button
              onClick={nextMonth}
              className="p-1.5 hover:bg-muted rounded-full transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="p-4">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                <div
                  key={i}
                  className="text-center text-xs font-semibold text-muted-foreground py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {allDays.map((date, index) => {
                const lessonCount = getLessonCount(date);
                const isSelected = isSameDay(date, selectedDate);
                const isCurrentDay = isToday(date);
                const isCurrentMonth = isSameMonth(date, currentDate);

                return (
                  <button
                    key={index}
                    onClick={() => isCurrentMonth && handleDateClick(date)}
                    disabled={!isCurrentMonth}
                    className={`
                      relative aspect-square flex flex-col items-center justify-center rounded-lg text-xs font-medium transition-all
                      ${!isCurrentMonth ? "text-muted-foreground/30 cursor-not-allowed" : "cursor-pointer"}
                      ${isSelected ? "bg-brand-brown text-white shadow-md scale-105" : "hover:bg-muted"}
                      ${isCurrentDay && !isSelected ? "ring-2 ring-brand-brown/40 ring-inset" : ""}
                    `}
                  >
                    <span className="block">{format(date, "d")}</span>
                    {lessonCount > 0 && isCurrentMonth && (
                      <div className="absolute bottom-1">
                        {lessonCount === 1 ? (
                          <span
                            className={`block h-1 w-1 rounded-full ${
                              isSelected ? "bg-white" : "bg-brand-brown"
                            }`}
                          />
                        ) : (
                          <span
                            className={`inline-flex items-center justify-center rounded-full text-[9px] font-bold px-1 min-w-[16px] h-4 ${
                              isSelected
                                ? "bg-white text-brand-brown"
                                : "bg-brand-brown text-white"
                            }`}
                          >
                            {lessonCount}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Selected Date Lessons */}
        <div className="rounded-2xl border border-border bg-background shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
            <h4 className="font-semibold text-sm flex items-center gap-2 text-foreground">
              <CalendarDays className="h-4 w-4 text-brand-brown shrink-0" />
              <span className="truncate">{format(selectedDate, "EEE, MMM d")}</span>
            </h4>
            {dailyLessons.length > 0 && (
              <span className="text-xs text-muted-foreground shrink-0 ml-2">
                {dailyLessons.length} {dailyLessons.length === 1 ? "lesson" : "lessons"}
              </span>
            )}
          </div>

          <div className="p-4 min-h-[200px] flex items-center justify-center">
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-brand-brown border-r-transparent" />
                <p className="text-xs text-muted-foreground mt-2">Loading...</p>
              </div>
            ) : dailyLessons.length === 0 ? (
              <div className="text-center py-8">
                <CalendarDays className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-sm font-medium text-foreground mb-1">No lessons scheduled</p>
                <p className="text-xs text-muted-foreground">Select a different date to view lessons</p>
              </div>
            ) : (
              <div className="w-full">
                <div className="space-y-2 max-h-96 overflow-y-auto">
                {dailyLessons.map((lesson) => {
                  const time = format(new Date(lesson.scheduled_at), "h:mm a");
                  const initials = lesson.student?.full_name
                    ? lesson.student.full_name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()
                    : "?";

                  return (
                    <Link
                      key={lesson.id}
                      href={`/students/${lesson.student?.id || "#"}`}
                      className="flex items-start gap-3 p-3 rounded-xl border border-border/50 bg-muted/30 hover:bg-muted/60 hover:border-border transition-all group"
                    >
                      <Avatar className="h-9 w-9 shrink-0 ring-2 ring-background">
                        <AvatarFallback className="text-xs">
                          {initials}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate group-hover:text-brand-brown transition-colors">
                          {lesson.student?.full_name || "Unknown Student"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {lesson.service?.name || "Lesson"}
                        </p>
                        
                        <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {time}
                          </span>
                          <span>•</span>
                          <span>{lesson.duration_minutes}m</span>
                          {lesson.meeting_url && (
                            <>
                              <span>•</span>
                              <Video className="h-3 w-3 text-brand-brown" />
                            </>
                          )}
                        </div>

                        {/* Status badge */}
                        <div className="flex items-center gap-2 mt-2">
                          <span
                            className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              lesson.status === "confirmed"
                                ? "bg-green-100 text-green-700"
                                : lesson.status === "pending"
                                ? "bg-yellow-100 text-yellow-700"
                                : lesson.status === "completed"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {lesson.status}
                          </span>
                          {lesson.payment_status === "paid" && (
                            <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                              Paid
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="rounded-2xl border border-border bg-gradient-to-br from-brand-cream/30 to-brand-brown/5 p-4 shadow-sm">
          <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            This Month
          </h4>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">Total Lessons</span>
              <span className="text-lg font-bold text-foreground">
                {Object.values(monthlyCounts).reduce((sum, count) => sum + count, 0)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">Days with Lessons</span>
              <span className="text-lg font-bold text-foreground">
                {Object.keys(monthlyCounts).length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

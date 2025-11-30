"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock, Video, CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { getDailyLessons, type DailyLesson } from "@/lib/actions/calendar-sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";

export function CalendarSidebar() {
  const today = useMemo(() => new Date(), []);
  const [dailyLessons, setDailyLessons] = useState<DailyLesson[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function fetchDailyLessons() {
      setLoading(true);
      const { lessons } = await getDailyLessons(today);
      if (mounted) {
        setDailyLessons(lessons);
        setLoading(false);
      }
    }
    fetchDailyLessons();
    return () => {
      mounted = false;
    };
  }, [today]);

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex-1 space-y-6 overflow-y-auto p-6">
        {/* Lessons */}
        <div className="rounded-2xl bg-background shadow-sm">
          <div className="flex items-center justify-between shadow-sm px-4 py-3.5">
            <h4 className="font-semibold text-sm flex items-center gap-2 text-foreground">
              <CalendarDays className="h-4 w-4 text-primary shrink-0" />
              <span className="truncate">{format(today, "EEE, MMM d")}</span>
            </h4>
            {dailyLessons.length > 0 ? (
              <span className="text-xs text-muted-foreground shrink-0 ml-2">
                {dailyLessons.length} {dailyLessons.length === 1 ? "lesson" : "lessons"}
              </span>
            ) : null}
          </div>

          <div className="p-4 min-h-[200px] flex items-center justify-center">
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent" />
                <p className="text-xs text-muted-foreground mt-2">Loading...</p>
              </div>
            ) : dailyLessons.length === 0 ? (
              <div className="text-center py-8">
                <CalendarDays className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-sm font-medium text-foreground mb-1">No lessons scheduled</p>
                <p className="text-xs text-muted-foreground">Once bookings are confirmed they’ll appear here.</p>
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
                      className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/60 shadow-sm transition-all group"
                    >
                      <Avatar className="h-9 w-9 shrink-0 ring-2 ring-background">
                        <AvatarFallback className="text-xs">
                          {initials}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
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
                              <Video className="h-3 w-3 text-primary" />
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

      </div>
    </div>
  );
}

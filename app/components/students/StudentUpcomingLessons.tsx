"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
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

type StudentUpcomingLessonsProps = {
  studentId: string;
  bookings: StudentBookingRecord[];
};

// Format date for display (e.g., "Sat, Dec 7")
function formatLessonDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

// Format time for display (e.g., "10:00 AM")
function formatLessonTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function StudentUpcomingLessons({
  studentId,
  bookings,
}: StudentUpcomingLessonsProps) {
  // Filter to upcoming lessons (future + confirmed/pending)
  const upcomingLessons = useMemo(() => {
    const now = new Date();
    return bookings
      .filter((booking) => {
        if (!booking.scheduled_at) return false;
        const bookingDate = new Date(booking.scheduled_at);
        const isFuture = bookingDate > now;
        const isUpcoming = booking.status === "confirmed" || booking.status === "pending";
        return isFuture && isUpcoming;
      })
      .sort((a, b) => {
        if (!a.scheduled_at || !b.scheduled_at) return 0;
        return new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime();
      })
      .slice(0, 4); // Show max 4 lessons
  }, [bookings]);

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">Upcoming Lessons</h3>
        <Link
          href={`/bookings?student=${studentId}`}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          View all
        </Link>
      </div>

      {/* Lessons List */}
      {upcomingLessons.length > 0 ? (
        <div className="space-y-4">
          {upcomingLessons.map((lesson, index) => (
            <motion.div
              key={lesson.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="space-y-0.5"
            >
              <p className="text-xs text-muted-foreground">
                {lesson.scheduled_at ? formatLessonDate(lesson.scheduled_at) : ""}
              </p>
              <p className="text-sm text-foreground">
                {lesson.service?.name ?? "Lesson"} · {lesson.duration_minutes}m
              </p>
              <p className="text-xs text-muted-foreground">
                {lesson.scheduled_at ? formatLessonTime(lesson.scheduled_at) : ""}
              </p>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-xs text-muted-foreground mb-3">No upcoming lessons</p>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/bookings?student=${studentId}`}>Book session</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

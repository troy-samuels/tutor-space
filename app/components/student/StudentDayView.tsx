"use client";

import { useEffect, useState } from "react";
import { format, isToday, isTomorrow, isPast } from "date-fns";
import { CalendarDays, Plus, Loader2 } from "lucide-react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import Link from "next/link";
import { getStudentDayLessons, type StudentScheduleEvent } from "@/lib/actions/student-schedule";
import { StudentLessonBlock } from "./StudentLessonBlock";

type StudentDayViewProps = {
  date: Date | null;
  tutorId?: string;
  onClose?: () => void;
};

// Animation variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const cardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      damping: 20,
      stiffness: 300,
    },
  },
};

function formatDateHeader(date: Date): string {
  if (isToday(date)) {
    return `Today, ${format(date, "MMMM d")}`;
  }
  if (isTomorrow(date)) {
    return `Tomorrow, ${format(date, "MMMM d")}`;
  }
  return format(date, "EEEE, MMMM d");
}

export function StudentDayView({ date, tutorId, onClose }: StudentDayViewProps) {
  const [lessons, setLessons] = useState<StudentScheduleEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!date) return;

    const currentDate = date; // Capture for closure
    let mounted = true;
    async function loadLessons() {
      setIsLoading(true);
      setError(null);

      const result = await getStudentDayLessons(
        format(currentDate, "yyyy-MM-dd"),
        tutorId
      );

      if (mounted) {
        if (result.error) {
          setError(result.error);
        } else {
          setLessons(result.lessons);
        }
        setIsLoading(false);
      }
    }

    loadLessons();
    return () => {
      mounted = false;
    };
  }, [date, tutorId]);

  if (!date) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
        <CalendarDays className="h-12 w-12 text-muted-foreground/30 mb-3" />
        <p className="text-muted-foreground">Select a day to view lessons</p>
      </div>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isPastDate = date < today && !isToday(date);
  const upcomingLessons = lessons.filter((l) => !isPast(new Date(l.end)));
  const pastLessons = lessons.filter((l) => isPast(new Date(l.end)));

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">{formatDateHeader(date)}</h3>
        </div>
        {lessons.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {lessons.length} lesson{lessons.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        ) : lessons.length === 0 ? (
          <div className="text-center py-8">
            <CalendarDays className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">
              {isPastDate ? "No lessons on this day" : "No lessons scheduled"}
            </p>
            {!isPastDate && (
              <Link
                href="/student/calendar"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition"
              >
                <Plus className="h-4 w-4" />
                Book a Lesson
              </Link>
            )}
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* Upcoming/Current Lessons */}
            {upcomingLessons.length > 0 && (
              <div>
                {!isPastDate && pastLessons.length > 0 && (
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                    Upcoming
                  </h4>
                )}
                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {upcomingLessons.map((lesson) => (
                      <motion.div key={lesson.id} variants={cardVariants} layout>
                        <StudentLessonBlock lesson={lesson} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Past Lessons (on the same day) */}
            {pastLessons.length > 0 && (
              <div>
                {upcomingLessons.length > 0 && (
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                    Completed
                  </h4>
                )}
                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {pastLessons.map((lesson) => (
                      <motion.div key={lesson.id} variants={cardVariants} layout>
                        <StudentLessonBlock lesson={lesson} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Book More CTA (for non-past dates with lessons) */}
      {!isPastDate && lessons.length > 0 && (
        <div className="border-t p-4">
          <Link
            href="/student/calendar"
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5 text-sm font-medium text-primary hover:bg-primary/10 transition"
          >
            <Plus className="h-4 w-4" />
            Book Another Lesson
          </Link>
        </div>
      )}
    </div>
  );
}

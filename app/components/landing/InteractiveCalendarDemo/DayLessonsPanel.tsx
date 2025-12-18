"use client";

import { Clock, CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import type { DemoBooking } from "./demo-data";

type DayLessonsPanelProps = {
  date: Date | null;
  bookings: DemoBooking[];
};

// Animation variants for staggered children
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
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
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.95,
    transition: {
      duration: 0.15,
    },
  },
};

const headerVariants: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      damping: 25,
      stiffness: 300,
    },
  },
  exit: {
    opacity: 0,
    x: 10,
    transition: { duration: 0.15 },
  },
};

export function DayLessonsPanel({
  date,
  bookings,
}: DayLessonsPanelProps) {
  // Create a unique key for the date to trigger animations
  const dateKey = date ? format(date, "yyyy-MM-dd") : "no-date";

  return (
    <div
      className="rounded-2xl sm:rounded-3xl border border-border bg-background/90 shadow-sm overflow-hidden"
      data-testid="day-lessons-panel"
    >
      {/* Header with animated date */}
      <div className="flex items-center justify-between border-b px-3 sm:px-4 py-2.5 sm:py-3.5">
        <h4 className="font-semibold text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 text-foreground">
          <CalendarDays className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0" />
          <AnimatePresence mode="wait">
            <motion.span
              key={dateKey}
              variants={headerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="truncate"
            >
              {date ? format(date, "EEE, MMM d") : "Select a date"}
            </motion.span>
          </AnimatePresence>
        </h4>
        <AnimatePresence mode="wait">
          {date && bookings.length > 0 ? (
            <motion.span
              key={`count-${dateKey}-${bookings.length}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="text-[10px] sm:text-xs text-muted-foreground shrink-0 ml-1 sm:ml-2"
            >
              {bookings.length} {bookings.length === 1 ? "lesson" : "lessons"}
            </motion.span>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Content with animated lessons */}
      <div className="p-3 sm:p-4 h-[280px] sm:h-[320px] flex items-start justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          {!date ? (
            // No date selected
            <motion.div
              key="no-date"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-6 sm:py-8"
            >
              <CalendarDays className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-2 sm:mb-3 text-muted-foreground/40" />
              <p className="text-xs sm:text-sm font-medium text-foreground mb-1">
                Select a date
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                Tap a date to see scheduled lessons.
              </p>
            </motion.div>
          ) : bookings.length === 0 ? (
            // Empty state
            <motion.div
              key={`empty-${dateKey}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="text-center py-6 sm:py-8"
            >
              <CalendarDays className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-2 sm:mb-3 text-muted-foreground/40" />
              <p className="text-xs sm:text-sm font-medium text-foreground mb-1">
                No lessons scheduled
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                This day is free for new bookings.
              </p>
            </motion.div>
          ) : (
            // Lessons list with staggered animation
            <motion.div
              key={`lessons-${dateKey}`}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full"
            >
              <div
                className="space-y-1.5 sm:space-y-2 max-h-72 sm:max-h-96 overflow-y-auto"
                tabIndex={0}
                role="region"
                aria-label="Scheduled lessons"
              >
                {bookings.map((booking) => (
                  <motion.div
                    key={booking.id}
                    variants={cardVariants}
                    className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg sm:rounded-xl shadow-sm bg-muted/30 group w-full"
                    data-testid="lesson-card"
                  >
                  {/* Avatar - mobile optimized */}
                  <div className="h-7 w-7 sm:h-9 sm:w-9 shrink-0 rounded-full bg-primary/10 ring-2 ring-background flex items-center justify-center">
                    <span className="text-[10px] sm:text-xs font-semibold text-primary">
                      {booking.student.initials}
                    </span>
                  </div>

                  {/* Content - mobile optimized */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-xs sm:text-sm truncate group-hover:text-primary transition-colors">
                      {booking.student.name}
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                      {booking.service}
                    </p>

                    {/* Time & Duration - mobile optimized */}
                    <div className="flex items-center gap-1.5 sm:gap-2 mt-1 sm:mt-1.5 text-[10px] sm:text-xs text-muted-foreground">
                      <span className="flex items-center gap-0.5 sm:gap-1">
                        <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        {booking.time}
                      </span>
                      <span>•</span>
                      <span>{booking.duration}m</span>
                    </div>

                    {/* Status badges - mobile optimized */}
                    <div className="flex items-center gap-1 sm:gap-2 mt-1.5 sm:mt-2">
                      <span
                        className={`inline-block text-[8px] sm:text-[10px] font-semibold px-1.5 sm:px-2 py-0.5 rounded-full ${
                          booking.status === "confirmed"
                            ? "bg-green-100 text-green-700"
                            : booking.status === "pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : booking.status === "completed"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {booking.status}
                      </span>
                      {booking.paymentStatus === "paid" && (
                        <span className="inline-block text-[8px] sm:text-[10px] font-semibold px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                          paid
                        </span>
                      )}
                    </div>
                  </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

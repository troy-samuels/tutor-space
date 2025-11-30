"use client";

import { CalendarDays, X } from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import type { DailyLesson } from "@/lib/actions/calendar-sidebar";
import type { CalendarEvent } from "@/lib/types/calendar";
import { StudentLessonCard } from "./student-lesson-card";

type CalendarDayPanelProps = {
  date: Date | null;
  lessons: DailyLesson[];
  externalEvents?: CalendarEvent[];
  isOpen: boolean;
  onClose: () => void;
  onReschedule?: (lessonId: string) => void;
};

// Animation variants for the sidebar panel
const panelVariants: Variants = {
  hidden: {
    x: "100%",
    opacity: 0,
  },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: "spring",
      damping: 25,
      stiffness: 300,
    },
  },
  exit: {
    x: "100%",
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  },
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

export function CalendarDayPanel({
  date,
  lessons,
  externalEvents = [],
  isOpen,
  onClose,
  onReschedule,
}: CalendarDayPanelProps) {
  const dateKey = date ? format(date, "yyyy-MM-dd") : "no-date";
  const totalCount = lessons.length + externalEvents.length;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={panelVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="w-full h-full bg-background border-l border-border flex flex-col overflow-hidden transition-all duration-300 lg:w-[26rem] xl:w-[30rem]"
          data-testid="calendar-day-panel"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3 bg-background">
            <h4 className="font-semibold text-sm flex items-center gap-2 text-foreground">
              <CalendarDays className="h-4 w-4 text-primary shrink-0" />
              <AnimatePresence mode="wait">
                <motion.span
                  key={dateKey}
                  variants={headerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="truncate"
                >
                  {date ? format(date, "EEEE, MMMM d") : "Select a date"}
                </motion.span>
              </AnimatePresence>
            </h4>
            <div className="flex items-center gap-2">
              <AnimatePresence mode="wait">
                {date && totalCount > 0 && (
                  <motion.span
                    key={`count-${dateKey}-${totalCount}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                    className="text-xs text-muted-foreground shrink-0"
                  >
                    {totalCount} {totalCount === 1 ? "event" : "events"}
                  </motion.span>
                )}
              </AnimatePresence>
              <button
                onClick={onClose}
                className="p-1.5 rounded-md hover:bg-muted transition-colors"
                aria-label="Close panel"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            <AnimatePresence mode="wait">
              {!date ? (
                // No date selected
                <motion.div
                  key="no-date"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-12"
                >
                  <CalendarDays className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
                  <p className="text-sm font-medium text-foreground mb-1">
                    Select a date
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Click on a date to see scheduled lessons.
                  </p>
                </motion.div>
              ) : totalCount === 0 ? (
                // Empty state
                <motion.div
                  key={`empty-${dateKey}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="text-center py-12"
                >
                  <CalendarDays className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
                  <p className="text-sm font-medium text-foreground mb-1">
                    No lessons scheduled
                  </p>
                  <p className="text-xs text-muted-foreground">
                    This day is free for new bookings.
                  </p>
                </motion.div>
              ) : (
                // Lessons and events list with staggered animation
                <motion.div
                  key={`lessons-${dateKey}`}
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-3"
                >
                  {/* TutorLingua Lessons */}
                  {lessons.length > 0 && (
                    <div className="space-y-2">
                      {lessons.map((lesson) => (
                        <motion.div key={lesson.id} variants={cardVariants}>
                          <StudentLessonCard
                            lesson={lesson}
                            onReschedule={onReschedule}
                          />
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* External Events Section */}
                  {externalEvents.length > 0 && (
                    <>
                      {lessons.length > 0 && (
                        <div className="border-t pt-3 mt-3">
                          <p className="text-xs font-medium text-muted-foreground mb-2">
                            External Calendar Events
                          </p>
                        </div>
                      )}
                      <div className="space-y-2">
                        {externalEvents.map((event) => (
                          <motion.div
                            key={event.id}
                            variants={cardVariants}
                            className="p-3 rounded-lg bg-gray-50 border border-gray-200"
                          >
                            <div className="flex items-start gap-2">
                              <div className="h-2 w-2 mt-1.5 rounded-full bg-gray-400 shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-gray-700 truncate">
                                  {event.title}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {format(new Date(event.start), "h:mm a")} -{" "}
                                  {format(new Date(event.end), "h:mm a")}
                                </p>
                                <span className="inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 mt-1">
                                  {event.source}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

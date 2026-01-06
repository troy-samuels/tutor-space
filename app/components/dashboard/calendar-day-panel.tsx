"use client";

import { Ban, CalendarDays, Plus, X } from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import type { DailyLesson } from "@/lib/actions/types";
import type { CalendarEvent } from "@/lib/types/calendar";
import { StudentLessonCard } from "./student-lesson-card";

type CalendarDayPanelProps = {
  date: Date | null;
  lessons: DailyLesson[];
  externalEvents?: CalendarEvent[];
  isOpen: boolean;
  onClose: () => void;
  onReschedule?: (lessonId: string) => void;
  onQuickAdd?: () => void;
  onQuickBlock?: () => void;
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
      damping: 30,
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
  onQuickAdd,
  onQuickBlock,
}: CalendarDayPanelProps) {
  const dateKey = date ? format(date, "yyyy-MM-dd") : "no-date";
  const totalCount = lessons.length + externalEvents.length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-transparent"
          />
          {/* Panel */}
          <motion.div
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed right-0 top-0 z-50 m-4 h-[95vh] w-full max-w-md rounded-3xl border border-white/20 bg-background shadow-2xl flex flex-col overflow-hidden sm:w-[24rem] lg:w-[26rem]"
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
                  className="truncate text-base font-semibold tracking-tight text-foreground"
                >
                  {date ? format(date, "EEEE, MMM d") : "Select a date"}
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

          {/* Quick Action Bar */}
          {date && (
            <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
              <button
                onClick={onQuickAdd}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
                Add Lesson
              </button>
              <button
                onClick={onQuickBlock}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <Ban className="h-4 w-4" />
                Block
              </button>
            </div>
          )}

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
                // Empty state (simplified - quick action bar handles adding lessons)
                <motion.div
                  key={`empty-${dateKey}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/80 p-8 text-center shadow-sm"
                >
                  <div className="pointer-events-none absolute inset-0 opacity-25">
                    <div className="absolute -left-10 -top-10 h-48 w-48 rounded-full bg-gradient-to-br from-primary/10 via-orange-200/30 to-transparent blur-2xl" />
                    <CalendarDays className="absolute left-6 top-6 h-16 w-16 text-muted-foreground/20" />
                  </div>
                  <div className="relative space-y-2">
                    <p className="text-sm font-medium text-foreground">
                      No lessons scheduled
                    </p>
                    <p className="text-xs text-muted-foreground">
                      This day is open for booking
                    </p>
                  </div>
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
        </>
      )}
    </AnimatePresence>
  );
}

"use client";

import { X, CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { StudentDayView } from "./StudentDayView";

type StudentDayPanelProps = {
  date: Date | null;
  tutorId?: string;
  studentTimezone?: string;
  isOpen: boolean;
  onClose: () => void;
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

export function StudentDayPanel({
  date,
  tutorId,
  studentTimezone,
  isOpen,
  onClose,
}: StudentDayPanelProps) {
  const dateKey = date ? format(date, "yyyy-MM-dd") : "no-date";

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
            className="fixed inset-0 z-40 bg-black/20"
          />
          {/* Panel */}
          <motion.div
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed right-0 top-0 z-50 m-4 h-[calc(100vh-2rem)] w-[calc(100%-2rem)] max-w-md rounded-3xl border border-border/50 bg-background shadow-2xl flex flex-col overflow-hidden sm:w-[24rem] lg:w-[26rem]"
            data-testid="student-day-panel"
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
              <button
                onClick={onClose}
                className="p-1.5 rounded-md hover:bg-muted transition-colors"
                aria-label="Close panel"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {/* Content - StudentDayView without its own header */}
            <div className="flex-1 overflow-hidden">
              <StudentDayView
                date={date}
                tutorId={tutorId}
                studentTimezone={studentTimezone}
                onClose={onClose}
                hideHeader
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

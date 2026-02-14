"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface WeeklyCalendarProps {
  practiceDays: boolean[]; // 7 days, Mon-Sun
  compact?: boolean;
}

const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function WeeklyCalendar({
  practiceDays,
  compact = false,
}: WeeklyCalendarProps) {
  const todayIndex = (new Date().getDay() + 6) % 7; // Convert to Mon=0 format

  return (
    <div className={`grid grid-cols-7 gap-2 ${compact ? "" : "p-4"}`}>
      {dayLabels.map((label, index) => {
        const isPracticed = practiceDays[index] || false;
        const isToday = index === todayIndex;

        return (
          <div key={label} className="flex flex-col items-center gap-1">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              className={`
                ${compact ? "w-8 h-8" : "w-12 h-12"}
                rounded-full flex items-center justify-center border-2 transition-all
                ${
                  isPracticed
                    ? "bg-primary border-primary text-white"
                    : isToday
                    ? "border-primary border-dashed text-muted-foreground"
                    : "border-border text-muted-foreground"
                }
              `}
            >
              {isPracticed ? (
                <Check className={compact ? "w-4 h-4" : "w-5 h-5"} />
              ) : (
                <span className={compact ? "text-xs" : "text-sm"}>
                  {label[0]}
                </span>
              )}
            </motion.div>
            <span
              className={`text-[10px] ${
                isToday ? "text-primary font-semibold" : "text-muted-foreground"
              }`}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

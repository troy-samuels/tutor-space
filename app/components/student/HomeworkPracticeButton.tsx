"use client";

import Link from "next/link";
import { Bot, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type HomeworkPracticeButtonProps = {
  practiceAssignmentId: string;
  status: "assigned" | "in_progress" | "completed";
  sessionsCompleted: number;
  className?: string;
};

/**
 * Button shown on homework items in student portal when homework has linked practice.
 * Provides a CTA to practice the topic with AI before homework is due.
 */
export function HomeworkPracticeButton({
  practiceAssignmentId,
  status,
  sessionsCompleted,
  className,
}: HomeworkPracticeButtonProps) {
  const isCompleted = status === "completed";
  const hasStarted = sessionsCompleted > 0;

  return (
    <Link
      href={`/student/practice/${practiceAssignmentId}`}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition",
        isCompleted
          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
          : hasStarted
            ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
            : "bg-primary/10 text-primary hover:bg-primary/20",
        className
      )}
    >
      {isCompleted ? (
        <>
          <Bot className="h-3.5 w-3.5" />
          <span>Done</span>
        </>
      ) : hasStarted ? (
        <>
          <Bot className="h-3.5 w-3.5" />
          <span>Continue</span>
        </>
      ) : (
        <>
          <Sparkles className="h-3.5 w-3.5" />
          <span>Start chatting</span>
        </>
      )}
    </Link>
  );
}

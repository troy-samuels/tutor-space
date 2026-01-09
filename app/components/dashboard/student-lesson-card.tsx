"use client";

import { useState } from "react";
import { Clock, MessageSquare, Calendar, Video, User } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import type { DailyLesson } from "@/lib/actions/types";
import { QuickMessageDialog } from "./quick-message-dialog";

type StudentLessonCardProps = {
  lesson: DailyLesson;
  onReschedule?: (lessonId: string) => void;
};

// Helper to get initials from name
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function StudentLessonCard({ lesson, onReschedule }: StudentLessonCardProps) {
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);

  const time = format(new Date(lesson.scheduled_at), "h:mm a");
  const hasPending = lesson.status === "pending";
  const isUnpaid = lesson.payment_status === "unpaid";
  const studentName = lesson.student?.full_name || "Unknown Student";
  const serviceName = lesson.service?.name || "Lesson";

  return (
    <div
      className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
      data-testid="student-lesson-card"
    >
      {/* Top row: Avatar + Info */}
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-muted text-lg font-semibold text-foreground shadow-sm">
          {lesson.student ? getInitials(lesson.student.full_name) : "?"}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="truncate text-2xl font-semibold tracking-tight text-foreground">
            {studentName}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {serviceName} • {time}
          </p>

          {/* Exceptional states */}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold">
            {hasPending && (
              <span className="text-amber-600">Pending</span>
            )}
            {isUnpaid && (
              <span className="text-destructive">Unpaid</span>
            )}
            <span className="flex items-center gap-1 text-muted-foreground font-medium">
              <Clock className="h-3.5 w-3.5" />
              {lesson.duration_minutes}m
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-4 flex items-center gap-2">
        {lesson.student && (
          <button
            onClick={() => setIsMessageDialogOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/50 text-foreground transition hover:bg-secondary"
            title="Message student"
            aria-label="Message student"
          >
            <MessageSquare className="h-4 w-4" />
          </button>
        )}

        {onReschedule && lesson.status !== "completed" && (
          <button
            onClick={() => onReschedule(lesson.id)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/50 text-foreground transition hover:bg-secondary"
            title="Reschedule"
            aria-label="Reschedule"
          >
            <Calendar className="h-4 w-4" />
          </button>
        )}

        {lesson.student && (
          <Link
            href={`/students/${lesson.student.id}`}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/50 text-foreground transition hover:bg-secondary"
            title="View profile"
            aria-label="View profile"
          >
            <User className="h-4 w-4" />
          </Link>
        )}

        {lesson.meeting_url && (
          <a
            href={lesson.meeting_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/50 text-foreground transition hover:bg-secondary"
            title="Join classroom"
            aria-label="Join classroom"
          >
            <Video className="h-4 w-4" />
          </a>
        )}
      </div>

      {/* Quick Message Dialog */}
      {lesson.student && (
        <QuickMessageDialog
          isOpen={isMessageDialogOpen}
          onClose={() => setIsMessageDialogOpen(false)}
          studentId={lesson.student.id}
          studentName={lesson.student.full_name}
        />
      )}
    </div>
  );
}

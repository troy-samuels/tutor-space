"use client";

import { Clock, MessageSquare, Calendar, Video, User } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import type { DailyLesson } from "@/lib/actions/calendar-sidebar";
import { getPackageColors } from "@/lib/types/calendar";

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
  const packageColors = getPackageColors(lesson.packageType);
  const time = format(new Date(lesson.scheduled_at), "h:mm a");

  return (
    <div
      className={`p-3 rounded-xl border ${packageColors.border} ${packageColors.bg} transition-shadow hover:shadow-md`}
      data-testid="student-lesson-card"
    >
      {/* Top row: Avatar + Info */}
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="h-10 w-10 shrink-0 rounded-full bg-white ring-2 ring-white/80 shadow-sm flex items-center justify-center">
          <span className={`text-sm font-semibold ${packageColors.text}`}>
            {lesson.student ? getInitials(lesson.student.full_name) : "?"}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-foreground truncate">
            {lesson.student?.full_name || "Unknown Student"}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {lesson.service?.name || "Lesson"}
          </p>

          {/* Time & Duration */}
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {time}
            </span>
            <span>•</span>
            <span>{lesson.duration_minutes}m</span>
          </div>

          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            {/* Package Type Badge */}
            <span
              className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${packageColors.bg} ${packageColors.text} border ${packageColors.border}`}
            >
              {packageColors.label}
            </span>

            {/* Status Badge */}
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

            {/* Payment Badge */}
            {lesson.payment_status === "paid" && (
              <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                paid
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-1 mt-3 pt-2 border-t border-black/5">
        {/* Message */}
        {lesson.student && (
          <Link
            href={`/messages?student=${lesson.student.id}`}
            className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-white/50 rounded-md transition-colors"
            title="Send message"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Message</span>
          </Link>
        )}

        {/* Reschedule */}
        {onReschedule && lesson.status !== "completed" && (
          <button
            onClick={() => onReschedule(lesson.id)}
            className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-white/50 rounded-md transition-colors"
            title="Reschedule"
          >
            <Calendar className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Reschedule</span>
          </button>
        )}

        {/* Join Call */}
        {lesson.meeting_url && (
          <a
            href={lesson.meeting_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-primary hover:text-primary/80 hover:bg-primary/5 rounded-md transition-colors"
            title="Join video call"
          >
            <Video className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Join</span>
          </a>
        )}

        {/* View Profile */}
        {lesson.student && (
          <Link
            href={`/students/${lesson.student.id}`}
            className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-white/50 rounded-md transition-colors ml-auto"
            title="View student profile"
          >
            <User className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Profile</span>
          </Link>
        )}
      </div>
    </div>
  );
}

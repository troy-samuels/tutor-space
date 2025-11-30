"use client";

import { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import {
  ChevronDown,
  ChevronUp,
  Calendar,
  Clock,
  Video,
  BookOpen,
  CheckCircle,
} from "lucide-react";
import type { StudentLessonHistoryData } from "@/lib/actions/student-lessons";
import { RescheduleDialog } from "@/components/bookings/reschedule-dialog";

interface StudentLessonHistoryProps {
  data: StudentLessonHistoryData;
  tutorName: string;
  tutorTimezone: string;
}

export function StudentLessonHistory({
  data,
  tutorName,
  tutorTimezone,
}: StudentLessonHistoryProps) {
  const [showUpcoming, setShowUpcoming] = useState(true);
  const [showPast, setShowPast] = useState(false);
  const [stats, setStats] = useState(data.stats);
  const [upcoming, setUpcoming] = useState(data.upcoming);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState<typeof data.upcoming[number] | null>(null);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const past = data.past;

  // Convert total minutes to hours and minutes
  const totalHours = Math.floor(stats.total_minutes / 60);
  const remainingMinutes = stats.total_minutes % 60;

  const handleRescheduleSuccess = (newStartIso: string) => {
    if (!rescheduleTarget) return;

    setUpcoming((prev) =>
      [...prev].map((lesson) =>
        lesson.id === rescheduleTarget.id
          ? { ...lesson, scheduled_at: newStartIso }
          : lesson
      ).sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
    );

    setStats((prev) => {
      const nextLesson =
        prev.next_lesson && prev.next_lesson.id === rescheduleTarget.id
          ? { ...prev.next_lesson, scheduled_at: newStartIso }
          : prev.next_lesson;

      return { ...prev, next_lesson: nextLesson };
    });

    setStatus({ type: "success", message: "Lesson rescheduled." });
  };

  const openReschedule = (lesson: typeof data.upcoming[number]) => {
    setRescheduleTarget(lesson);
    setRescheduleOpen(true);
    setStatus(null);
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="bg-gradient-to-br from-primary/10 to-muted/30 rounded-2xl border-2 border-border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Your Lesson Journey with {tutorName}
        </h3>

        <div className="grid grid-cols-2 gap-4">
          {/* Total Lessons */}
          <div className="bg-white rounded-xl p-4 border border-border/40">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <p className="text-xs font-medium text-gray-600">
                Total Lessons
              </p>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {stats.total_lessons}
            </p>
          </div>

          {/* Total Time */}
          <div className="bg-white rounded-xl p-4 border border-border/40">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
              <p className="text-xs font-medium text-gray-600">Total Time</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {totalHours > 0 && `${totalHours}h `}
              {remainingMinutes}m
            </p>
          </div>
        </div>

        {/* Next Lesson Highlight */}
        {stats.next_lesson && (
          <div className="mt-4 bg-white rounded-xl p-4 border-2 border-border">
            <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">
              Next Lesson
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="font-semibold text-gray-900">
                  {stats.next_lesson.service_name}
                </p>
                <p className="text-sm text-gray-600">
                  {format(new Date(stats.next_lesson.scheduled_at), "EEEE, MMMM d 'at' h:mm a")}
                </p>
                <p className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(stats.next_lesson.scheduled_at), {
                    addSuffix: true,
                  })}
                </p>
              </div>
              {stats.next_lesson.meeting_url && (
                <a
                  href={stats.next_lesson.meeting_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold hover:bg-primary/90 transition text-sm"
                >
                  <Video className="h-4 w-4" />
                  Join Meeting
                </a>
              )}
            </div>
          </div>
        )}

        {/* Last Lesson */}
        {stats.last_lesson && !stats.next_lesson && (
          <div className="mt-4 bg-white rounded-xl p-4 border border-gray-200">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
              Last Lesson
            </p>
            <p className="font-semibold text-gray-900">
              {stats.last_lesson.service_name}
            </p>
            <p className="text-sm text-gray-600">
              {format(new Date(stats.last_lesson.scheduled_at), "MMMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
        )}
      </div>

      {status ? (
        <p
          className={`rounded-xl px-4 py-3 text-sm ${
            status.type === "success"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-destructive/10 text-destructive"
          }`}
        >
          {status.message}
        </p>
      ) : null}

      {/* Upcoming Lessons */}
      {upcoming.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <button
            onClick={() => setShowUpcoming(!showUpcoming)}
            className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-900">
                  Upcoming Lessons
                </h3>
                <p className="text-sm text-gray-600">
                  {upcoming.length} {upcoming.length === 1 ? "lesson" : "lessons"} scheduled
                </p>
              </div>
            </div>
            {showUpcoming ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </button>

          {showUpcoming && (
            <div className="border-t border-gray-200 p-5 space-y-3">
              {upcoming.map((lesson) => (
                <div
                  key={lesson.id}
                  className="border border-gray-200 rounded-xl p-4 hover:border-primary/30 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-gray-900">
                          {lesson.service_name}
                        </p>
                        {lesson.status === "pending" && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Pending
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {format(new Date(lesson.scheduled_at), "EEEE, MMMM d 'at' h:mm a")}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {lesson.duration_minutes} minutes • {formatDistanceToNow(new Date(lesson.scheduled_at), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openReschedule(lesson)}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition whitespace-nowrap"
                      >
                        <Calendar className="h-4 w-4" />
                        Reschedule
                      </button>
                      {lesson.meeting_url && lesson.status === "confirmed" && (
                        <a
                          href={lesson.meeting_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold hover:bg-primary/90 transition text-sm whitespace-nowrap"
                        >
                          <Video className="h-4 w-4" />
                          Join Meeting
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Past Lessons */}
      {past.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <button
            onClick={() => setShowPast(!showPast)}
            className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-green-600" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-900">Past Lessons</h3>
                <p className="text-sm text-gray-600">
                  {past.length} completed {past.length === 1 ? "lesson" : "lessons"}
                </p>
              </div>
            </div>
            {showPast ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </button>

          {showPast && (
            <div className="border-t border-gray-200 p-5 space-y-3">
              {past.map((lesson) => (
                <div
                  key={lesson.id}
                  className="border border-gray-200 rounded-xl p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">
                        {lesson.service_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {format(new Date(lesson.scheduled_at), "MMMM d, yyyy 'at' h:mm a")}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {lesson.duration_minutes} minutes
                      </p>
                      {lesson.lesson_notes && (
                        <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs font-semibold text-gray-700 mb-1">
                            Lesson Notes:
                          </p>
                          <p className="text-sm text-gray-600">
                            {lesson.lesson_notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {upcoming.length === 0 && past.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Lessons Yet
          </h3>
          <p className="text-sm text-gray-600">
            Book your first lesson from the calendar above to get started!
          </p>
        </div>
      )}

      <RescheduleDialog
        open={rescheduleOpen}
        onOpenChange={(open) => {
          setRescheduleOpen(open);
          if (!open) setRescheduleTarget(null);
        }}
        bookingId={rescheduleTarget?.id ?? null}
        defaultStart={rescheduleTarget?.scheduled_at}
        timezone={tutorTimezone}
        durationMinutes={rescheduleTarget?.duration_minutes}
        title={rescheduleTarget ? `Move ${rescheduleTarget.service_name}` : "Reschedule lesson"}
        subtitle={`Times shown in ${tutorTimezone}`}
        onSuccess={handleRescheduleSuccess}
      />
    </div>
  );
}

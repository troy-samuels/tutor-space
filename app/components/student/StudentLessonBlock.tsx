"use client";

import { format, isPast, differenceInMinutes, addMinutes } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { Video, ExternalLink, Clock, User, CheckCircle, Circle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { PACKAGE_COLORS, type PackageType } from "@/lib/types/calendar";
import type { StudentScheduleEvent } from "@/lib/actions/student-schedule";
import { isClassroomUrl } from "@/lib/utils/classroom-links";
import { getJoinEarlyMinutes, getJoinGraceMinutes } from "@/lib/utils/lesson-join-window";

type StudentLessonBlockProps = {
  lesson: StudentScheduleEvent;
  compact?: boolean;
  studentTimezone?: string;
};

function getProviderName(provider: string | null | undefined): string {
  switch (provider) {
    case "zoom_personal":
    case "zoom":
      return "Zoom";
    case "google_meet":
      return "Google Meet";
    case "microsoft_teams":
      return "Teams";
    case "livekit":
      return "Classroom";
    case "calendly":
      return "Calendly";
    case "custom":
      return "Video Call";
    default:
      return "Video Call";
  }
}

function canJoinLesson(
  startTime: Date,
  durationMinutes: number,
  joinEarlyMinutes: number,
  joinGraceMinutes: number
): boolean {
  const now = new Date();
  const endTime = addMinutes(startTime, durationMinutes);
  const endWithGrace = addMinutes(endTime, joinGraceMinutes);
  const minutesUntilStart = differenceInMinutes(startTime, now);

  // Can join shortly before start until the grace window ends
  return minutesUntilStart <= joinEarlyMinutes && now < endWithGrace;
}

function getLessonStatus(
  startTime: Date,
  durationMinutes: number,
  bookingStatus: string | undefined,
  joinEarlyMinutes: number,
  joinGraceMinutes: number
): { label: string; color: string; icon: React.ReactNode } {
  const now = new Date();
  const endTime = addMinutes(startTime, durationMinutes);
  const endWithGrace = addMinutes(endTime, joinGraceMinutes);
  const minutesUntilStart = differenceInMinutes(startTime, now);

  if (bookingStatus === "completed" || now > endWithGrace) {
    return {
      label: "Completed",
      color: "text-green-600 bg-green-50",
      icon: <CheckCircle className="h-3.5 w-3.5" />,
    };
  }

  if (minutesUntilStart <= 0 && now < endWithGrace) {
    return {
      label: "In Progress",
      color: "text-blue-600 bg-blue-50",
      icon: <Circle className="h-3.5 w-3.5 animate-pulse" />,
    };
  }

  if (minutesUntilStart <= joinEarlyMinutes) {
    return {
      label: "Starting Soon",
      color: "text-orange-600 bg-orange-50",
      icon: <Clock className="h-3.5 w-3.5" />,
    };
  }

  return {
    label: "Upcoming",
    color: "text-muted-foreground bg-muted",
    icon: <Clock className="h-3.5 w-3.5" />,
  };
}

function formatLessonTime(date: Date, timezone?: string, includeZone = false): string {
  if (!timezone) return format(date, "h:mm a");
  try {
    return formatInTimeZone(date, timezone, includeZone ? "h:mm a zzz" : "h:mm a");
  } catch (error) {
    console.warn("[StudentSchedule] Invalid timezone for time formatting", error);
    return format(date, "h:mm a");
  }
}

export function StudentLessonBlock({
  lesson,
  compact = false,
  studentTimezone,
}: StudentLessonBlockProps) {
  const startTime = new Date(lesson.start);
  const joinEarlyMinutes = getJoinEarlyMinutes();
  const joinGraceMinutes = getJoinGraceMinutes();
  const lessonEndWithGrace = addMinutes(new Date(lesson.end), joinGraceMinutes);
  const isLessonPast = isPast(lessonEndWithGrace);
  const isJoinable = canJoinLesson(
    startTime,
    lesson.durationMinutes || 60,
    joinEarlyMinutes,
    joinGraceMinutes
  );
  const status = getLessonStatus(
    startTime,
    lesson.durationMinutes || 60,
    lesson.bookingStatus,
    joinEarlyMinutes,
    joinGraceMinutes
  );
  const packageColors = PACKAGE_COLORS[lesson.packageType || "one_off"];
  const resolvedStudentTimezone =
    studentTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const tutorTimezone = lesson.tutorTimezone || null;
  const showTutorTime = !!tutorTimezone && tutorTimezone !== resolvedStudentTimezone;
  const studentTimeLabel = formatLessonTime(startTime, resolvedStudentTimezone);
  const tutorTimeLabel = showTutorTime
    ? formatLessonTime(startTime, tutorTimezone, true)
    : null;

  if (compact) {
    return (
      <div
        className={`flex items-center gap-3 rounded-xl border p-3 ${packageColors.bg} ${packageColors.border}`}
      >
        {/* Time */}
        <div className="text-sm font-medium text-foreground min-w-[60px]">
          {studentTimeLabel}
        </div>

        {/* Lesson Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{lesson.title}</p>
          <p className="text-xs text-muted-foreground truncate">
            with {lesson.tutorName}
          </p>
        </div>

        {/* Status Badge */}
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.color}`}>
          {status.label}
        </span>
      </div>
    );
  }

  const isClassroomLink = isClassroomUrl(lesson.meetingUrl);

  return (
    <div
      className={`rounded-2xl border p-4 ${packageColors.bg} ${packageColors.border} transition-shadow hover:shadow-md`}
    >
      {/* Header: Time + Status */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">
            {studentTimeLabel}
          </span>
          <span className="text-xs text-muted-foreground">
            ({lesson.durationMinutes} min)
          </span>
        </div>
        <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${status.color}`}>
          {status.icon}
          {status.label}
        </span>
      </div>

      {tutorTimeLabel && (
        <div className="mb-3 text-xs text-muted-foreground">
          Tutor time: {tutorTimeLabel}
        </div>
      )}

      {/* Lesson Title */}
      <h4 className="font-semibold text-foreground mb-2">{lesson.title}</h4>

      {/* Tutor Info */}
      <div className="flex items-center gap-2 mb-3">
        {lesson.tutorAvatar ? (
          <Image
            src={lesson.tutorAvatar}
            alt={lesson.tutorName}
            width={28}
            height={28}
            className="rounded-full object-cover"
          />
        ) : (
          <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="h-4 w-4 text-primary" />
          </div>
        )}
        <span className="text-sm text-muted-foreground">with {lesson.tutorName}</span>
      </div>

      {/* Package Type Badge */}
      <div className="flex items-center gap-2 mb-3">
        <span className={`h-2 w-2 rounded-full ${packageColors.dot}`} />
        <span className="text-xs text-muted-foreground">{packageColors.label}</span>
      </div>

      {/* Join Button or Review Link */}
      {isLessonPast ? (
        <Link
          href={`/student/review/${lesson.id}`}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-muted px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted/80"
        >
          View Lesson Details
        </Link>
      ) : lesson.meetingUrl ? (
        isJoinable ? (
          <a
            href={lesson.meetingUrl}
            target={isClassroomLink ? "_self" : "_blank"}
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            <Video className="h-4 w-4" />
            Join {getProviderName(isClassroomLink ? "livekit" : undefined)}
            {!isClassroomLink && (
              <ExternalLink className="h-3.5 w-3.5 ml-1" />
            )}
          </a>
        ) : (
          <button
            disabled
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-muted px-4 py-2.5 text-sm font-medium text-muted-foreground cursor-not-allowed"
          >
            <Video className="h-4 w-4" />
            Join available {joinEarlyMinutes} min before
          </button>
        )
      ) : (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
          <p className="text-xs text-amber-700 text-center">
            Your tutor will share the meeting link before the lesson
          </p>
        </div>
      )}
    </div>
  );
}

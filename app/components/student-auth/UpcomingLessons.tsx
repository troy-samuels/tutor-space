"use client";

import { useState, useEffect } from "react";
import { format, differenceInMinutes, isPast, addMinutes } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { Video, Clock, Calendar, Loader2, ExternalLink } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getStudentBookings } from "@/lib/actions/student-bookings";
import Link from "next/link";
import { hasStudioAccess } from "@/lib/payments/subscriptions";
import type { PlatformBillingPlan } from "@/lib/types/payments";
import { buildClassroomUrl, isClassroomUrl, resolveBookingMeetingUrl } from "@/lib/utils/classroom-links";
import { getJoinEarlyMinutes, getJoinGraceMinutes } from "@/lib/utils/lesson-join-window";

type Booking = {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  notes: string | null;
  meeting_url: string | null;
  meeting_provider: string | null;
  short_code: string | null;
  tutor: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
    tier: string | null;
    plan?: string | null;
  };
  service: {
    id: string;
    name: string;
  };
};

function getProviderName(provider: string | null): string {
  switch (provider) {
    case "zoom_personal":
      return "Zoom";
    case "google_meet":
      return "Google Meet";
    case "microsoft_teams":
      return "Microsoft Teams";
    case "calendly":
      return "Calendly";
    case "livekit":
      return "Classroom";
    case "custom":
      return "Video Call";
    default:
      return "Video Call";
  }
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function UpcomingLessons() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());
  const joinEarlyMinutes = getJoinEarlyMinutes();
  const joinGraceMinutes = getJoinGraceMinutes();

  // Update "now" every minute to refresh join button availability
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function loadBookings() {
      const result = await getStudentBookings();
      if (result.error) {
        setError(result.error);
      } else if (result.bookings) {
        setBookings(result.bookings);
      }
      setLoading(false);
    }
    loadBookings();
  }, []);

  // Check if the join button should be active (within join window)
  const canJoinLesson = (booking: Booking): boolean => {
    const startTime = new Date(booking.scheduled_at);
    const endTime = addMinutes(startTime, booking.duration_minutes);
    const minutesToStart = differenceInMinutes(startTime, now);

    // Can join shortly before until the grace window ends
    return (
      minutesToStart <= joinEarlyMinutes &&
      !isPast(addMinutes(endTime, joinGraceMinutes))
    );
  };

  // Format time until lesson
  const getTimeUntilLesson = (booking: Booking): string => {
    const startTime = new Date(booking.scheduled_at);
    const minutesToStart = differenceInMinutes(startTime, now);

    if (minutesToStart <= 0) {
      return "Now";
    } else if (minutesToStart < 60) {
      return `in ${minutesToStart} min`;
    } else if (minutesToStart < 1440) {
      const hours = Math.floor(minutesToStart / 60);
      return `in ${hours} hour${hours > 1 ? "s" : ""}`;
    } else {
      const days = Math.floor(minutesToStart / 1440);
      return `in ${days} day${days > 1 ? "s" : ""}`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm">
        {error}
      </div>
    );
  }

  if (bookings.length === 0) {
    return null; // Don't show anything if no upcoming lessons
  }

  // Show only the next 3 upcoming lessons
  const upcomingBookings = bookings.slice(0, 3);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Upcoming Lessons</h2>

      <div className="space-y-3">
        {upcomingBookings.map((booking) => {
          const isJoinable = canJoinLesson(booking);
          const timeUntil = getTimeUntilLesson(booking);
          const startTime = new Date(booking.scheduled_at);
          const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          const zonedTime = toZonedTime(startTime, userTimezone);
          const tutorPlan =
            (booking.tutor.plan as PlatformBillingPlan | null) ?? "professional";
          const tutorHasStudio =
            booking.tutor.tier === "studio" || hasStudioAccess(tutorPlan);
          const resolvedMeetingUrl = resolveBookingMeetingUrl({
            meetingUrl: booking.meeting_url,
            bookingId: booking.id,
            shortCode: booking.short_code,
            tutorHasStudio,
          });
          const meetingIsClassroom = isClassroomUrl(resolvedMeetingUrl);
          const classroomUrl = tutorHasStudio
            ? buildClassroomUrl(booking.id, booking.short_code)
            : null;
          const classroomIsExternal = classroomUrl ? classroomUrl.startsWith("http") : false;
          const showExternalJoin = !!resolvedMeetingUrl && !meetingIsClassroom;

          return (
            <div
              key={booking.id}
              className={`rounded-2xl border p-4 transition ${
                isJoinable
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border bg-white"
              }`}
            >
              {/* Header with time indicator */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={booking.tutor.avatar_url || undefined}
                      alt={booking.tutor.full_name || "Tutor"}
                    />
                    <AvatarFallback className="bg-primary/20 text-primary">
                      {getInitials(booking.tutor.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {booking.service.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      with {booking.tutor.full_name || `@${booking.tutor.username}`}
                    </p>
                  </div>
                </div>

                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    isJoinable
                      ? "bg-primary text-primary-foreground animate-pulse"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {timeUntil}
                </span>
              </div>

              {/* Date and time */}
              <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {format(zonedTime, "EEEE, MMM d")}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {format(zonedTime, "h:mm a")} ({booking.duration_minutes} min)
                </span>
              </div>

              {/* Join Button - External Provider */}
              {showExternalJoin && (
                <div className="mt-4">
                  {isJoinable ? (
                    <a
                      href={resolvedMeetingUrl ?? undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                    >
                      <Video className="h-5 w-5" />
                      Join on {getProviderName(booking.meeting_provider)}
                      <ExternalLink className="h-4 w-4 ml-1" />
                    </a>
                  ) : (
                    <button
                      disabled
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-muted px-4 py-3 text-sm font-medium text-muted-foreground cursor-not-allowed"
                    >
                      <Video className="h-5 w-5" />
                      Join available {joinEarlyMinutes} min before
                    </button>
                  )}
                </div>
              )}

              {/* Join Button - Native Classroom (Studio tier tutors only) */}
              {classroomUrl && (
                <div className="mt-3">
                  {isJoinable ? (
                    classroomIsExternal ? (
                      <a
                        href={classroomUrl}
                        target="_self"
                        rel="noopener noreferrer"
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-purple-700"
                      >
                        <Video className="h-5 w-5" />
                        Join Native Classroom
                      </a>
                    ) : (
                      <Link
                        href={classroomUrl}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-purple-700"
                      >
                        <Video className="h-5 w-5" />
                        Join Native Classroom
                      </Link>
                    )
                  ) : (
                    <button
                      disabled
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-100 px-4 py-3 text-sm font-medium text-purple-400 cursor-not-allowed"
                    >
                      <Video className="h-5 w-5" />
                      Classroom available {joinEarlyMinutes} min before
                    </button>
                  )}
                </div>
              )}

              {/* No meeting link message */}
              {!showExternalJoin && !classroomUrl && (
                <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-3">
                  <p className="text-sm text-amber-700">
                    Your tutor will share the meeting link before the lesson.
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {bookings.length > 3 && (
        <p className="text-center text-sm text-muted-foreground">
          +{bookings.length - 3} more upcoming lesson{bookings.length - 3 > 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}

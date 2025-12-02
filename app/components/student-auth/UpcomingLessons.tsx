"use client";

import { useState, useEffect } from "react";
import { format, differenceInMinutes, isPast, addMinutes } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { Video, Clock, Calendar, Loader2, ExternalLink } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getStudentBookings } from "@/lib/actions/student-bookings";

type Booking = {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  notes: string | null;
  meeting_url: string | null;
  meeting_provider: string | null;
  tutor: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
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
    case "calendly":
      return "Calendly";
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

  // Check if the join button should be active (within 15 minutes of start or during the lesson)
  const canJoinLesson = (booking: Booking): boolean => {
    const startTime = new Date(booking.scheduled_at);
    const endTime = addMinutes(startTime, booking.duration_minutes);
    const minutesToStart = differenceInMinutes(startTime, now);

    // Can join 15 minutes before until lesson ends
    return minutesToStart <= 15 && !isPast(endTime);
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
      <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
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
      <h2 className="text-lg font-semibold text-gray-900">Upcoming Lessons</h2>

      <div className="space-y-3">
        {upcomingBookings.map((booking) => {
          const isJoinable = canJoinLesson(booking);
          const timeUntil = getTimeUntilLesson(booking);
          const startTime = new Date(booking.scheduled_at);
          const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          const zonedTime = toZonedTime(startTime, userTimezone);

          return (
            <div
              key={booking.id}
              className={`rounded-xl border p-4 transition ${
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
                    <h3 className="font-semibold text-gray-900">
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

              {/* Join Button */}
              {booking.meeting_url && (
                <div className="mt-4">
                  {isJoinable ? (
                    <a
                      href={booking.meeting_url}
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
                      Join available 15 min before
                    </button>
                  )}
                </div>
              )}

              {/* No meeting link message */}
              {!booking.meeting_url && (
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

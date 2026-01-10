"use client";

import Link from "next/link";
import { CalendarDays, MapPin, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/hooks/useAuth";
import { isClassroomUrl, resolveBookingMeetingUrl } from "@/lib/utils/classroom-links";

export type UpcomingSession = {
  id: string;
  studentName?: string | null;
  serviceName?: string | null;
  scheduledLabel: string;
  location?: string | null;
  status?: string | null;
  meetingUrl?: string | null;
  meetingProvider?: string | null;
  shortCode?: string | null;
};

type UpcomingSessionsProps = {
  sessions: UpcomingSession[];
  className?: string;
};

export function UpcomingSessions({ sessions, className }: UpcomingSessionsProps) {
  const hasSessions = sessions.length > 0;
  const { entitlements } = useAuth();
  const hasStudioAccess = entitlements?.hasStudioAccess ?? false;

  return (
    <div className={cn("space-y-5", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Today & Tomorrow</h3>
        <Button asChild size="sm" variant="ghost">
          <Link href="/bookings">View all</Link>
        </Button>
      </div>
      {hasSessions ? (
        <ul className="space-y-4">
          {sessions.map((session) => (
            <li
              key={session.id}
              className="rounded-xl border border-stone-200 bg-white p-5 transition-colors hover:border-primary/30"
            >
              {(() => {
                const joinUrl = resolveBookingMeetingUrl({
                  meetingUrl: session.meetingUrl,
                  bookingId: session.id,
                  shortCode: session.shortCode,
                  tutorHasStudio: hasStudioAccess,
                  allowClassroomFallback: true,
                });
                const meetingIsClassroom = isClassroomUrl(joinUrl);
                const joinUrlIsAbsolute = Boolean(joinUrl?.startsWith("http"));
                const joinTarget =
                  joinUrlIsAbsolute && !isClassroomUrl(joinUrl) ? "_blank" : "_self";
                const joinLabel = meetingIsClassroom ? "Join classroom" : "Join meeting";

                return (
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-semibold">
                    {session.studentName ?? "Upcoming session"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {session.serviceName ?? "Service pending confirmation"}
                  </p>
                </div>
                {joinUrl ? (
                  joinUrlIsAbsolute ? (
                    <Button asChild size="icon" variant="ghost" className="text-primary/70 hover:text-primary hover:bg-primary/5">
                      <a
                        href={joinUrl}
                        target={joinTarget}
                        rel={joinTarget === "_blank" ? "noopener noreferrer" : undefined}
                        aria-label={joinLabel}
                      >
                        <Video className="h-4 w-4" />
                        <span className="sr-only">{joinLabel}</span>
                      </a>
                    </Button>
                  ) : (
                    <Button asChild size="icon" variant="ghost" className="text-primary/70 hover:text-primary hover:bg-primary/5">
                      <Link href={joinUrl} aria-label={joinLabel}>
                        <Video className="h-4 w-4" />
                        <span className="sr-only">{joinLabel}</span>
                      </Link>
                    </Button>
                  )
                ) : (
                  <Button size="icon" variant="ghost" className="text-primary/40 cursor-not-allowed" disabled>
                    <Video className="h-4 w-4" />
                    <span className="sr-only">No meeting link</span>
                  </Button>
                )}
              </div>
                );
              })()}
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  {session.scheduledLabel}
                </span>
                {session.location ? (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {session.location}
                  </span>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-xl border border-dashed border-stone-300 bg-white p-8 text-center">
          <CalendarDays className="mx-auto h-6 w-6 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium">No sessions scheduled</p>
          <p className="text-xs text-muted-foreground">
            Add your availability so students can book times that work for them.
          </p>
          <Button className="mt-4" size="sm" asChild>
            <Link href="/availability">Add availability</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

UpcomingSessions.Skeleton = function UpcomingSessionsSkeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Today & Tomorrow</h3>
        <div className="h-5 w-10 rounded bg-muted/30" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-20 animate-pulse rounded-xl bg-muted/30" />
        ))}
      </div>
    </div>
  );
};

"use client";

import Link from "next/link";
import { CalendarDays, MapPin, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export type UpcomingSession = {
  id: string;
  studentName?: string | null;
  serviceName?: string | null;
  scheduledLabel: string;
  location?: string | null;
  status?: string | null;
};

type UpcomingSessionsProps = {
  sessions: UpcomingSession[];
  className?: string;
};

export function UpcomingSessions({ sessions, className }: UpcomingSessionsProps) {
  const hasSessions = sessions.length > 0;

  return (
    <Card className={cn(className)}>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base font-semibold">Today &amp; Tomorrow</CardTitle>
        <Button asChild size="sm" variant="ghost">
          <Link href="/bookings">View all</Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasSessions ? (
          <ul className="space-y-3">
            {sessions.map((session) => (
              <li
                key={session.id}
                className="rounded-lg border border-border bg-card px-4 py-3 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">
                      {session.studentName ?? "Upcoming session"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {session.serviceName ?? "Service pending confirmation"}
                    </p>
                  </div>
                  <Button size="icon" variant="ghost">
                    <Video className="h-4 w-4" />
                    <span className="sr-only">Join session</span>
                  </Button>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
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
                  {session.status ? (
                    <span className="inline-flex items-center gap-1 uppercase tracking-wide text-muted-foreground/80">
                      {session.status}
                    </span>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center">
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
      </CardContent>
    </Card>
  );
}

UpcomingSessions.Skeleton = function UpcomingSessionsSkeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Upcoming sessions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-20 animate-pulse rounded-lg bg-muted/40" />
        ))}
      </CardContent>
    </Card>
  );
};

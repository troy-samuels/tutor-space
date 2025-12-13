"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";

type StudentOverviewProps = {
  student: {
    id: string;
    full_name: string | null;
    email: string;
    status: string | null;
  };
  nextBooking?: {
    id: string;
    scheduled_at: string;
    duration_minutes: number | null;
    services?: { name: string | null } | null;
  } | null;
  stats: {
    total_lessons: number;
    lessons_completed: number;
    lessons_cancelled: number;
  };
  recentHomework: Array<{
    id: string;
    created_at: string | null;
    title?: string;
    homework?: string | null;
    status?: string | null;
  }>;
  practiceScenarios: Array<{
    id: string;
    title?: string;
    language?: string;
    level?: string;
  }>;
};

export function StudentOverview({
  student,
  nextBooking,
  stats,
  recentHomework,
  practiceScenarios,
}: StudentOverviewProps) {
  const upcoming = nextBooking
    ? {
        label: nextBooking.services?.name || "Lesson",
        when: format(new Date(nextBooking.scheduled_at), "EEE, MMM d · h:mm a"),
        duration: nextBooking.duration_minutes ? `${nextBooking.duration_minutes} min` : "",
      }
    : null;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <p className="text-lg font-semibold text-foreground">
              {student.status ? formatLabel(student.status) : "Active"}
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/students/${student.id}/edit`}>Edit profile</Link>
          </Button>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
          <Stat label="Total" value={stats.total_lessons} />
          <Stat label="Completed" value={stats.lessons_completed} />
          <Stat label="Cancelled" value={stats.lessons_cancelled} />
        </div>
      </Card>

      <Card className="p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Next lesson</p>
            <p className="text-lg font-semibold text-foreground">
              {upcoming ? upcoming.label : "No upcoming lesson"}
            </p>
            {upcoming ? (
              <p className="text-sm text-muted-foreground">
                {upcoming.when} {upcoming.duration ? `· ${upcoming.duration}` : ""}
              </p>
            ) : null}
          </div>
          <Button asChild size="sm">
            <Link href={`/bookings?student=${student.id}`}>Book</Link>
          </Button>
        </div>
      </Card>

      <Card className="p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">Homework</p>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/lesson-notes/new?student=${student.id}`}>Assign</Link>
          </Button>
        </div>
        <div className="mt-3 space-y-2">
          {recentHomework.length === 0 ? (
            <p className="text-sm text-muted-foreground">No homework yet.</p>
          ) : (
            recentHomework.map((item) => (
              <div key={item.id} className="rounded-lg border border-border/60 p-3 text-sm">
                <p className="font-medium text-foreground">{item.title || "Homework"}</p>
                <p className="text-xs text-muted-foreground">
                  {item.created_at ? format(new Date(item.created_at), "MMM d, yyyy") : ""}
                </p>
              </div>
            ))
          )}
        </div>
      </Card>

      <Card className="p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">Practice</p>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/practice`}>Assign</Link>
          </Button>
        </div>
        <div className="mt-3 space-y-2">
          {practiceScenarios.length === 0 ? (
            <p className="text-sm text-muted-foreground">No practice scenarios.</p>
          ) : (
            practiceScenarios.map((scenario) => (
              <div key={scenario.id} className="rounded-lg border border-border/60 p-3 text-sm">
                <p className="font-medium text-foreground">{scenario.title || "Scenario"}</p>
                <p className="text-xs text-muted-foreground">
                  {[scenario.language, scenario.level].filter(Boolean).join(" · ")}
                </p>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border/60 p-3 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}

function formatLabel(text: string | null): string {
  if (!text) return "";
  return text
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

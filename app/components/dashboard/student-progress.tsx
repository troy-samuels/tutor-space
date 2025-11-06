import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type StudentProgressSummary = {
  id: string;
  name: string;
  proficiency: string | null;
  status: string | null;
  completedLessons: number;
  upcomingLessons: number;
  outstandingBalanceCents: number;
  outstandingBalanceFormatted: string;
  performance: string | null;
  lastLessonAt: Date | null;
  lastLessonLabel: string | null;
};

type StudentProgressListProps = {
  students: StudentProgressSummary[];
  className?: string;
};

const performanceStyles: Record<
  NonNullable<StudentProgressSummary["performance"]>,
  { label: string; className: string }
> = {
  excellent: { label: "Thriving", className: "bg-emerald-100 text-emerald-700" },
  good: { label: "On track", className: "bg-sky-100 text-sky-700" },
  needs_improvement: { label: "Needs focus", className: "bg-amber-100 text-amber-700" },
};

export function StudentProgressList({ students, className }: StudentProgressListProps) {
  if (students.length === 0) {
    return (
      <Card className="border border-dashed border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-base font-semibold">No student insights yet</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Add at least one student and log a lesson to unlock progress insights.</p>
          <Link
            href="/students"
            className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            Open student CRM
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("grid gap-4 sm:grid-cols-2", className)}>
      {students.map((student) => {
        const performanceBadge = student.performance
          ? performanceStyles[student.performance]
          : null;

        return (
          <Card key={student.id} className="border border-border bg-background/80 shadow-sm backdrop-blur">
            <CardHeader className="space-y-3">
              <div className="flex flex-col gap-1">
                <CardTitle className="text-base font-semibold text-foreground">
                  {student.name}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {student.proficiency ? `Level ${student.proficiency}` : "Level TBD"} ·{" "}
                  {student.status ? student.status.replace(/_/g, " ") : "Active"}
                </p>
              </div>
              {performanceBadge ? (
                <span
                  className={cn(
                    "inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-semibold",
                    performanceBadge.className,
                  )}
                >
                  {performanceBadge.label}
                </span>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Completed</p>
                  <p className="mt-1 text-xl font-semibold text-foreground">
                    {student.completedLessons}
                  </p>
                  <p className="text-[11px] text-muted-foreground/80">
                    Lifetime lessons logged with notes
                  </p>
                </div>
                <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Upcoming</p>
                  <p className="mt-1 text-xl font-semibold text-foreground">
                    {student.upcomingLessons}
                  </p>
                  <p className="text-[11px] text-muted-foreground/80">
                    Sessions scheduled in the pipeline
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Outstanding balance
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {student.outstandingBalanceFormatted}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Last lesson
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {student.lastLessonLabel ?? "Not yet recorded"}
                  </p>
                </div>
              </div>
              <Link
                href={`/students/${student.id}`}
                className="inline-flex w-full items-center justify-center rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted"
              >
                View student profile
              </Link>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

StudentProgressList.Skeleton = function StudentProgressSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: 2 }).map((_, index) => (
        <div key={index} className="h-48 animate-pulse rounded-2xl bg-muted/40" />
      ))}
    </div>
  );
};

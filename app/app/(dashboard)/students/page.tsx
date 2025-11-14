import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import {
  Users,
  CalendarDays,
  Wallet,
  Mail,
  Phone,
  BookOpenCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getTutorStudentInsights } from "@/lib/data/student-insights";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const performanceStyles: Record<string, { label: string; className: string }> = {
  excellent: { label: "Thriving", className: "bg-emerald-100 text-emerald-700" },
  good: { label: "On track", className: "bg-sky-100 text-sky-700" },
  needs_improvement: { label: "Needs focus", className: "bg-amber-100 text-amber-700" },
};

export default async function StudentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/students");
  }

  const students = await getTutorStudentInsights(user.id, supabase);

  const totalStudents = students.length;
  const totalUpcomingLessons = students.reduce(
    (sum, student) => sum + student.upcomingLessons,
    0
  );
  const totalCompletedLessons = students.reduce(
    (sum, student) => sum + student.completedLessons,
    0
  );

  const outstandingByCurrency = new Map<string, number>();
  students.forEach((student) => {
    if (student.outstandingBalanceCents > 0) {
      outstandingByCurrency.set(
        student.currency,
        (outstandingByCurrency.get(student.currency) ?? 0) + student.outstandingBalanceCents
      );
    }
  });

  const outstandingSummary =
    outstandingByCurrency.size === 0
      ? "All paid"
      : Array.from(outstandingByCurrency.entries())
          .map(([currency, amount]) => formatCurrency(amount, currency))
          .join(" · ");

  const lastUpdate = students
    .map((student) => student.updatedAt)
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2 flex-1">
          <h1 className="text-3xl font-bold text-foreground">Students</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Track every learner&apos;s progress, payments, and lesson notes in one tutor-focused CRM.
          </p>
          {lastUpdate ? (
            <p className="text-xs text-muted-foreground/80">
              Last updated {formatDate(lastUpdate)}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-3 shrink-0">
          <Button variant="outline" asChild className="whitespace-nowrap">
            <Link href="/students/import">Import students</Link>
          </Button>
          <Button asChild className="whitespace-nowrap bg-brand-brown hover:bg-brand-brown/90 text-white">
            <Link href="/bookings/new">Schedule lesson</Link>
          </Button>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <OverviewCard
          icon={<Users className="h-5 w-5 text-primary" />}
          label="Active students"
          value={totalStudents}
          helper="Learners assigned to you"
        />
        <OverviewCard
          icon={<CalendarDays className="h-5 w-5 text-primary" />}
          label="Upcoming lessons"
          value={totalUpcomingLessons}
          helper="Sessions scheduled ahead"
        />
        <OverviewCard
          icon={<BookOpenCheck className="h-5 w-5 text-primary" />}
          label="Lessons completed"
          value={totalCompletedLessons}
          helper="Logged with lesson notes"
        />
        <OverviewCard
          icon={<Wallet className="h-5 w-5 text-primary" />}
          label="Outstanding balance"
          value={outstandingSummary}
          helper="Across pending invoices"
        />
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-foreground">Student roster</h2>
          <p className="text-sm text-muted-foreground">
            Review each student’s status, upcoming workload, and next steps.
          </p>
        </div>

        {students.length === 0 ? (
          <Card className="border border-dashed border-muted-foreground/30 bg-muted/20">
            <CardContent className="space-y-4 p-8 text-center">
              <p className="text-sm text-muted-foreground">No students yet. Import your roster or invite a learner from your booking link.</p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Button asChild className="bg-brand-brown hover:bg-brand-brown/90 text-white">
                  <Link href="/students/import">Add students</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/bookings/new">Invite a learner</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {students.map((student) => {
              const performanceBadge =
                student.performance && performanceStyles[student.performance]
                  ? performanceStyles[student.performance]
                  : null;
              const lastLessonLabel = student.lastLessonAt
                ? `${formatDate(student.lastLessonAt)}`
                : "No lesson logged";
              const lastNoteLabel = student.lastNoteAt
                ? formatDate(student.lastNoteAt)
                : "No notes yet";

              return (
                <Card
                  key={student.id}
                  className="flex flex-col justify-between border border-border bg-background/80 shadow-sm backdrop-blur"
                >
                  <CardHeader className="space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-lg font-semibold text-foreground">
                          {student.fullName}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {student.proficiency ? `Level ${student.proficiency}` : "Level TBD"} ·{" "}
                          {student.status ?? "Active"}
                        </p>
                      </div>
                      {performanceBadge ? (
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${performanceBadge.className}`}
                        >
                          {performanceBadge.label}
                        </span>
                      ) : null}
                    </div>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p className="inline-flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span className="truncate">{student.email ?? "Email not set"}</span>
                      </p>
                      {student.phone ? (
                        <p className="inline-flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span>{student.phone}</span>
                        </p>
                      ) : null}
                      {student.learningGoals ? (
                        <p className="text-xs italic text-muted-foreground/80">
                          Goal: {student.learningGoals}
                        </p>
                      ) : null}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <MetricPill label="Completed" value={student.completedLessons} />
                      <MetricPill label="Upcoming" value={student.upcomingLessons} />
                      <MetricPill
                        label="Outstanding"
                        value={student.outstandingBalanceFormatted}
                      />
                    </div>
                    <div className="flex flex-wrap justify-between gap-3 text-xs text-muted-foreground">
                      <span>Last lesson: {lastLessonLabel}</span>
                      <span>Last note: {lastNoteLabel}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/students/${student.id}`}>View details</Link>
                      </Button>
                      <Button size="sm" asChild>
                        <Link href={`/bookings/new?student=${student.id}`}>Book lesson</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function OverviewCard({
  icon,
  label,
  value,
  helper,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  helper: string;
}) {
  return (
    <Card className="flex h-full flex-col rounded-3xl border border-border/60 bg-white/90 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4 pt-4 pb-1.5">
        <CardTitle className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </CardTitle>
        <div className="rounded-full bg-muted/60 p-1.5 text-muted-foreground">
          {icon}
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-1.5">
        <p className="text-2xl font-semibold leading-tight text-foreground">{value}</p>
        <p className="mt-1 text-[11px] text-muted-foreground">{helper}</p>
      </CardContent>
    </Card>
  );
}

function MetricPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-white/80 p-2.5 shadow-sm">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

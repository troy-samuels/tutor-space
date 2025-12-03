import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Clock, DollarSign, Globe, NotebookPen, AlertTriangle, User } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getTutorStudentProgress, getTutorStudentPracticeData, getStudentPracticeAnalytics } from "@/lib/actions/progress";
import { StudentProgressPanel } from "@/components/students/StudentProgressPanel";
import { HomeworkPlanner } from "@/components/students/HomeworkPlanner";
import { PracticeAssignmentPanel } from "@/components/students/PracticeAssignmentPanel";
import { AIPracticeAnalytics } from "@/components/students/AIPracticeAnalytics";

type StudentDetailPageProps = {
  params: Promise<{
    studentId: string;
  }>;
};

type StudentBookingRecord = {
  id: string;
  scheduled_at: string | null;
  duration_minutes: number | null;
  status: string;
  payment_status: string | null;
  payment_amount: number | null;
  currency: string | null;
  service: {
    name: string | null;
  } | null;
};

type StudentLessonNoteRecord = {
  id: string;
  created_at: string | null;
  notes: string | null;
  homework: string | null;
  student_performance: string | null;
  areas_to_focus: string[] | null;
  topics_covered: string[] | null;
};

export default async function StudentDetailPage({ params }: StudentDetailPageProps) {
  const { studentId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const { data: student } = await supabase
    .from("students")
    .select(
      "id, tutor_id, full_name, email, phone, proficiency_level, learning_goals, native_language, notes, status, timezone, created_at, updated_at, parent_name, parent_email, parent_phone"
    )
    .eq("tutor_id", user.id)
    .eq("id", studentId)
    .single();

  if (!student) {
    notFound();
  }

  const { data: bookings } = await supabase
    .from("bookings")
    .select(
      "id, scheduled_at, duration_minutes, status, payment_status, payment_amount, currency, service:services(name)"
    )
    .eq("tutor_id", user.id)
    .eq("student_id", student.id)
    .order("scheduled_at", { ascending: false });

  const { data: lessonNotes } = await supabase
    .from("lesson_notes")
    .select(
      "id, created_at, notes, homework, student_performance, areas_to_focus, topics_covered"
    )
    .eq("tutor_id", user.id)
    .eq("student_id", student.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const [progress, practiceData, practiceAnalytics] = await Promise.all([
    getTutorStudentProgress(student.id),
    getTutorStudentPracticeData(student.id),
    getStudentPracticeAnalytics(student.id),
  ]);

  const bookingRecords: StudentBookingRecord[] = (bookings as StudentBookingRecord[] | null) ?? [];
  const lessonNoteRecords: StudentLessonNoteRecord[] =
    (lessonNotes as StudentLessonNoteRecord[] | null) ?? [];

  const totalPaidCents = bookingRecords
    .filter((booking) => booking.payment_status === "paid" && booking.payment_amount)
    .reduce((sum, booking) => sum + (booking.payment_amount ?? 0), 0);

  const outstandingCents = bookingRecords
    .filter((booking) => booking.payment_status === "unpaid" && booking.payment_amount)
    .reduce((sum, booking) => sum + (booking.payment_amount ?? 0), 0);

  const nextBooking = bookingRecords.find((booking) => {
    if (!booking.scheduled_at) return false;
    const isFuture = new Date(booking.scheduled_at) > new Date();
    return isFuture && (booking.status === "confirmed" || booking.status === "pending");
  });

  const currency = nextBooking?.currency ?? bookingRecords[0]?.currency ?? "USD";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <Link
            href="/students"
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to students
          </Link>
          <h1 className="text-3xl font-semibold text-foreground">{student.full_name}</h1>
          <p className="text-sm text-muted-foreground">
            {student.proficiency_level ? `Level ${student.proficiency_level}` : "Level TBD"} ·{" "}
            {student.status}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href={`/bookings?student=${student.id}`}>Book session</Link>
          </Button>
          <Button asChild>
            <Link href={`/lesson-notes/new?student=${student.id}`}>Add lesson note</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total paid"
          value={formatCurrency(totalPaidCents, currency)}
          helper="Across completed invoices"
        />
        <SummaryCard
          title="Outstanding balance"
          value={
            outstandingCents > 0 ? formatCurrency(outstandingCents, currency) : "All paid"
          }
          helper="Includes upcoming sessions"
        />
        <SummaryCard
          title="Next lesson"
          value={
            nextBooking?.scheduled_at
              ? `${formatDate(nextBooking.scheduled_at)} · ${new Date(
                  nextBooking.scheduled_at
                ).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
              : "No session scheduled"
          }
          helper={nextBooking?.service?.name ?? "Choose a service to schedule"}
        />
        <SummaryCard
          title="Last update"
          value={formatDate(student.updated_at ?? student.created_at ?? new Date())}
          helper="Based on profile changes or notes"
        />
      </div>

      {/* Parent/Guardian Contact Info - Shown prominently for minor students */}
      {(student.parent_name || student.parent_email || student.parent_phone) && (
        <Card className="border-2 border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-amber-800 dark:text-amber-200">
              <AlertTriangle className="h-5 w-5" />
              Minor Student - Parent/Guardian Contact
            </CardTitle>
            <p className="text-xs text-amber-700 dark:text-amber-300">
              This student has parent/guardian contact information on file. Use this for important communications.
            </p>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            {student.parent_name && (
              <div className="flex items-start gap-2">
                <User className="mt-0.5 h-4 w-4 text-amber-600 dark:text-amber-400" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-amber-700 dark:text-amber-300">
                    Parent/Guardian Name
                  </p>
                  <p className="mt-0.5 font-medium text-amber-900 dark:text-amber-100">
                    {student.parent_name}
                  </p>
                </div>
              </div>
            )}
            {student.parent_email && (
              <div className="flex items-start gap-2">
                <div className="mt-0.5 h-4 w-4 text-amber-600 dark:text-amber-400">@</div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-amber-700 dark:text-amber-300">
                    Parent Email
                  </p>
                  <a
                    href={`mailto:${student.parent_email}`}
                    className="mt-0.5 block font-medium text-amber-900 hover:underline dark:text-amber-100"
                  >
                    {student.parent_email}
                  </a>
                </div>
              </div>
            )}
            {student.parent_phone && (
              <div className="flex items-start gap-2">
                <div className="mt-0.5 h-4 w-4 text-amber-600 dark:text-amber-400">📞</div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-amber-700 dark:text-amber-300">
                    Parent Phone
                  </p>
                  <a
                    href={`tel:${student.parent_phone}`}
                    className="mt-0.5 block font-medium text-amber-900 hover:underline dark:text-amber-100"
                  >
                    {student.parent_phone}
                  </a>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border border-border bg-background/80 shadow-sm backdrop-blur">
          <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Lesson history</CardTitle>
              <p className="text-xs text-muted-foreground">
                Track attendance, payments, and status for each session.
              </p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/bookings?student=${student.id}`}>View all bookings</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {bookingRecords.length > 0 ? (
              <div className="space-y-4">
                {bookingRecords.slice(0, 8).map((booking) => (
                  <div
                    key={booking.id}
                    className="flex flex-col gap-2 rounded-xl border border-border px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-semibold text-foreground">
                        {booking.service?.name ?? "Service"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {booking.scheduled_at
                          ? `${formatDate(booking.scheduled_at)} · ${new Date(
                              booking.scheduled_at
                            ).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
                          : "Date TBD"}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {booking.status}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {booking.duration_minutes} min
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <DollarSign className="h-3.5 w-3.5" />
                        {booking.payment_status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
                No sessions yet. Schedule a lesson to start tracking progress and payments.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-border bg-background/80 shadow-sm backdrop-blur">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Student details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Contact</p>
              <p className="mt-1 text-foreground">{student.email}</p>
              {student.phone ? <p className="text-muted-foreground">{student.phone}</p> : null}
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Timezone</p>
              <p className="mt-1 inline-flex items-center gap-1.5 text-foreground">
                <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                {student.timezone ?? "UTC"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Goals</p>
              <p className="mt-1 text-foreground">
                {student.learning_goals ?? "Goal not recorded"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Native language</p>
              <p className="mt-1 text-foreground">
                {student.native_language ?? "Not set"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Private notes</p>
              <p className="mt-1 whitespace-pre-wrap text-foreground">
                {student.notes ?? "No tutor notes yet"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <StudentProgressPanel
          studentId={student.id}
          studentName={student.full_name ?? "Student"}
          stats={progress.stats}
          goals={progress.goals}
          assessments={progress.assessments}
        />
        <HomeworkPlanner
          studentId={student.id}
          studentName={student.full_name ?? "Student"}
          assignments={progress.homework}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <PracticeAssignmentPanel
          studentId={student.id}
          studentName={student.full_name ?? "Student"}
          assignments={practiceData.assignments}
          scenarios={practiceData.scenarios}
          pendingHomework={practiceData.pendingHomework}
          studentHasSubscription={practiceData.isSubscribed}
        />
        <AIPracticeAnalytics
          studentId={student.id}
          studentName={student.full_name ?? "Student"}
          isSubscribed={practiceAnalytics.isSubscribed}
          summary={practiceAnalytics.summary}
        />
      </div>

      <Card className="border border-border bg-background/80 shadow-sm backdrop-blur">
        <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Recent lesson notes</CardTitle>
            <p className="text-xs text-muted-foreground">
              Latest reflections, action items, and homework.
            </p>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/lesson-notes?student=${student.id}`}>View all notes</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {lessonNoteRecords.length > 0 ? (
            lessonNoteRecords.map((note) => (
              <div
                key={note.id}
                className="rounded-xl border border-border/60 bg-muted/20 p-4 text-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <NotebookPen className="h-3.5 w-3.5" />
                    {formatDate(note.created_at ?? new Date())}
                  </span>
                  <span className="inline-flex items-center gap-1 uppercase tracking-wide">
                    {note.student_performance ?? "Unrated"}
                  </span>
                </div>
                <p className="mt-3 text-foreground">{note.notes}</p>
                {note.homework ? (
                  <div className="mt-3 rounded-lg border border-dashed border-border/50 bg-background/60 p-3 text-xs text-muted-foreground">
                    <p className="font-semibold uppercase tracking-wide text-muted-foreground">
                      Homework
                    </p>
                    <p className="mt-1 text-muted-foreground/90">{note.homework}</p>
                  </div>
                ) : null}
                {note.areas_to_focus && note.areas_to_focus.length > 0 ? (
                  <div className="mt-3 text-xs text-muted-foreground">
                    <p className="font-semibold uppercase tracking-wide">Areas to focus</p>
                    <ul className="mt-1 list-disc space-y-1 pl-4">
                      {note.areas_to_focus.map((area) => (
                        <li key={area}>{area}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
              Add lesson notes to capture progress over time.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

type SummaryCardProps = {
  title: string;
  value: string;
  helper?: string;
};

function SummaryCard({ title, value, helper }: SummaryCardProps) {
  return (
    <Card className="border border-border bg-background/80 shadow-sm backdrop-blur">
      <CardHeader className="space-y-1">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <p className="text-2xl font-semibold text-foreground">{value}</p>
      </CardHeader>
      {helper ? (
        <CardContent className="text-xs text-muted-foreground">{helper}</CardContent>
      ) : null}
    </Card>
  );
}

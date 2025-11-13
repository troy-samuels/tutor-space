import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Users, Wallet, CalendarDays, TrendingUp, Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils";
import { MetricCards, type MetricCardConfig } from "@/components/dashboard/metric-cards";
import { UpcomingSessions, type UpcomingSession } from "@/components/dashboard/upcoming-sessions";
import { EmptyStates } from "@/components/dashboard/empty-states";
import { GrowthOpportunities } from "@/components/dashboard/growth-opportunities";
import {
  StudentProgressList,
  type StudentProgressSummary,
} from "@/components/dashboard/student-progress";
import { getTutorStudentInsights } from "@/lib/data/student-insights";
import { DashboardAnalytics } from "@/components/dashboard/dashboard-analytics";
import { NAV_SECTIONS } from "@/components/dashboard/nav-config";
import type { PlanName as SidebarPlanName } from "@/components/dashboard/nav-config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import { CountdownBanner } from "@/components/dashboard/countdown-banner";
import { NavigationTileGrid } from "@/components/dashboard/navigation-tile-grid";

const REQUIRED_PROFILE_FIELDS = ["username", "bio", "tagline"] as const;

type DashboardPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

type UpcomingBookingRecord = {
  id: string;
  scheduled_at: string;
  status: string;
  payment_status: string | null;
  payment_amount: number | null;
  currency: string | null;
  student: {
    full_name: string | null;
    proficiency_level: string | null;
  } | null;
  service: {
    name: string | null;
  } | null;
};

type ActionTile = {
  href: string;
  label: string;
  description: string;
  Icon: LucideIcon;
  section: string;
};

const ACTION_DESCRIPTIONS: Record<string, string> = {
  "/bookings": "Manage upcoming lessons, payments, and reminders.",
  "/students": "Open your CRM to review notes and progress.",
  "/services": "Publish or edit the lessons and packages you sell.",
  "/messages": "Respond to student requests and lead inquiries.",
  "/digital-products": "Sell printable resources and async lessons.",
  "/availability": "Update your booking windows and time buffers.",
  "/marketing/links": "Refresh your link hub and social CTAs.",
  "/marketing/email": "Send nurture sequences and broadcasts.",
  "/analytics": "Watch revenue, conversion, and channel trends.",
  "/ai": "Generate copy, lesson notes, and parent updates with AI.",
  "/dashboard": "See KPIs and sprint metrics at a glance.",
};

const AVAILABLE_TILE_DESTINATIONS = new Set<string>([
  "/bookings",
  "/students",
  "/services",
  "/messages",
  "/digital-products",
  "/availability",
  "/marketing/links",
  "/marketing/email",
  "/analytics",
  "/ai",
  "/settings/profile",
]);

function buildActionTiles(plan: "professional" | "growth" | "studio"): ActionTile[] {
  const canAccessSection = (required?: SidebarPlanName) => {
    if (!required) return true;
    if (required === "growth") {
      return plan === "growth" || plan === "studio";
    }
    return plan === "studio";
  };

  const tiles: ActionTile[] = [];

  NAV_SECTIONS.forEach((section) => {
    if (!canAccessSection(section.plan)) {
      return;
    }

    section.items.forEach((item) => {
      if (item.disabled) return;
      if (item.href === "/dashboard") return;
      if (!AVAILABLE_TILE_DESTINATIONS.has(item.href)) return;

      const cleanedLabel = item.label.replace(/\s+\(Soon\)$/i, "");
      const description = ACTION_DESCRIPTIONS[item.href] ?? `Open ${cleanedLabel}`;

      tiles.push({
        href: item.href,
        label: cleanedLabel,
        description,
        Icon: item.icon,
        section: section.label,
      });
    });
  });

  const uniqueTiles = Array.from(
    new Map(tiles.map((tile) => [tile.href, tile])).values()
  );

  uniqueTiles.push({
    href: "/settings/profile",
    label: "Profile & socials",
    description: "Refresh your bio, website, and social handles.",
    Icon: Settings,
    section: "Run the Business",
  });

  return uniqueTiles;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const bypassOnboarding = searchParams?.skipOnboarding === "1";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, bio, tagline, full_name, plan, email, created_at")
    .eq("id", user?.id ?? "")
    .single();

  const profileComplete =
    Boolean(profile) && REQUIRED_PROFILE_FIELDS.every((field) => Boolean(profile?.[field]));

  const createdAt = profile?.created_at ? new Date(profile.created_at) : null;
  const withinFirst30Days = createdAt
    ? Date.now() - createdAt.getTime() <= 30 * 24 * 60 * 60 * 1000
    : true;

  // Calculate days remaining for countdown banner
  const daysRemaining = createdAt
    ? Math.max(0, Math.ceil((30 * 24 * 60 * 60 * 1000 - (Date.now() - createdAt.getTime())) / (24 * 60 * 60 * 1000)))
    : 30;

  if (!profileComplete && !bypassOnboarding) {
    redirect("/onboarding");
  }

  const nowIso = new Date().toISOString();

  const { data: upcomingBookings } = await supabase
    .from("bookings")
    .select(
      "id, scheduled_at, status, payment_status, payment_amount, currency, student_id, student:students(full_name, proficiency_level), service:services(name)"
    )
    .eq("tutor_id", user?.id ?? "")
    .gte("scheduled_at", nowIso)
    .order("scheduled_at", { ascending: true })
    .limit(3);
  const normalizedUpcomingBookings: UpcomingBookingRecord[] =
    (upcomingBookings as UpcomingBookingRecord[] | null) ?? [];

  const { count: totalLeads } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("tutor_id", user?.id ?? "");

  const { count: serviceCount } = await supabase
    .from("services")
    .select("id", { count: "exact", head: true })
    .eq("tutor_id", user?.id ?? "");

  const { count: availabilityCount } = await supabase
    .from("availability")
    .select("id", { count: "exact", head: true })
    .eq("tutor_id", user?.id ?? "");

  const { data: paidInvoices } = await supabase
    .from("invoices")
    .select("total_due_cents, status, due_date")
    .eq("tutor_id", user?.id ?? "")
    .eq("status", "paid");
  // TODO: Replace ad-hoc Supabase queries with consolidated data loaders once RPCs are in place.
  const now = new Date();
  const thisMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const revenueThisMonth = (paidInvoices ?? []).reduce((total, invoice) => {
    const dueDate = invoice.due_date ? new Date(invoice.due_date) : now;
    if (dueDate.getMonth() === thisMonth && dueDate.getFullYear() === currentYear) {
      return total + (invoice.total_due_cents ?? 0);
    }
    return total;
  }, 0);

  const studentInsights = user?.id ? await getTutorStudentInsights(user.id, supabase) : [];
  const nextBooking = normalizedUpcomingBookings[0];
  const nextLessonLabel = nextBooking
    ? `${formatDate(nextBooking.scheduled_at)} · ${new Date(nextBooking.scheduled_at).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      })}`
    : "No lessons scheduled";

  const metrics: MetricCardConfig[] = [
    {
      label: "Active students",
      value: studentInsights.length,
      helperText: "Students with at least one lesson",
      icon: Users,
    },
    {
      label: "Leads in pipeline",
      value: totalLeads ?? 0,
      helperText: "Warm prospects across channels",
      icon: TrendingUp,
    },
    {
      label: "Revenue this month",
      value: formatCurrency(revenueThisMonth),
      helperText: "Based on paid invoices",
      icon: Wallet,
    },
    {
      label: "Next lesson",
      value: nextLessonLabel,
      helperText: nextBooking
        ? `${normalizedUpcomingBookings.length} lessons upcoming`
        : "Set availability to start booking",
      icon: CalendarDays,
    },
  ];

  const sessions: UpcomingSession[] = normalizedUpcomingBookings.map((booking) => ({
    id: booking.id,
    studentName: booking.student?.full_name ?? undefined,
    serviceName: booking.service?.name ?? undefined,
    scheduledLabel: `${formatDate(booking.scheduled_at)} · ${new Date(booking.scheduled_at).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    })}`,
    status: booking.status,
  }));

  const rawPlan = profile?.plan;
  const planName: "professional" | "growth" | "studio" =
    rawPlan === "growth" || rawPlan === "studio" ? rawPlan : "professional";
  const publicProfileUrl = profile?.username ? `/@${profile.username}` : null;
  const actionTiles = buildActionTiles(planName);

  const hasServices = (serviceCount ?? 0) > 0;
  const hasAvailability = (availabilityCount ?? 0) > 0;
  const hasStudents = studentInsights.length > 0;

  const studentProgressSummaries: StudentProgressSummary[] = studentInsights.map((student) => {
    const lastLessonDate = student.lastLessonAt ? new Date(student.lastLessonAt) : null;

    return {
      id: student.id,
      name: student.fullName,
      proficiency: student.proficiency,
      status: student.status,
      completedLessons: student.completedLessons,
      upcomingLessons: student.upcomingLessons,
      outstandingBalanceCents: student.outstandingBalanceCents,
      outstandingBalanceFormatted: student.outstandingBalanceFormatted,
      performance: student.performance,
      lastLessonAt: lastLessonDate,
      lastLessonLabel: lastLessonDate ? formatDate(lastLessonDate) : null,
    };
  });

  const prioritizedStudentProgress = studentProgressSummaries
    .filter(
      (summary) =>
        summary.completedLessons > 0 ||
        summary.upcomingLessons > 0 ||
        summary.outstandingBalanceCents > 0 ||
        summary.performance
    )
    .sort((a, b) => {
      if (b.outstandingBalanceCents !== a.outstandingBalanceCents) {
        return b.outstandingBalanceCents - a.outstandingBalanceCents;
      }
      if (b.upcomingLessons !== a.upcomingLessons) {
        return b.upcomingLessons - a.upcomingLessons;
      }
      const aTime = a.lastLessonAt ? a.lastLessonAt.getTime() : 0;
      const bTime = b.lastLessonAt ? b.lastLessonAt.getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, 4);

  const studentProgressContent = <StudentProgressList students={prioritizedStudentProgress} />;

  return (
    <div className="space-y-8">
      <DashboardAnalytics
        plan={planName}
        studentCount={studentInsights.length}
        upcomingSessions={normalizedUpcomingBookings.length}
        revenueThisMonthCents={revenueThisMonth}
      />

      {/* Countdown Banner - Only visible during first 30 days */}
      {withinFirst30Days && <CountdownBanner daysRemaining={daysRemaining} />}

      <section className="relative overflow-hidden rounded-3xl border border-primary/20 bg-background/80 p-8 shadow-sm backdrop-blur">
        <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-primary/10" />
        <div className="absolute -right-28 bottom-0 h-28 w-28 rounded-full bg-primary/10" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-primary/70">
              {formatDate(new Date())}
            </p>
            <h1 className="mt-1 text-3xl font-semibold text-foreground">
              Welcome back{profile?.full_name ? `, ${profile.full_name}` : ""}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Keep an eye on your lessons, revenue, and growth experiments from one command center.
            </p>
            {publicProfileUrl ? (
              <Link
                href={publicProfileUrl}
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary/40 px-4 py-2 text-xs font-semibold text-primary transition hover:bg-primary/10"
              >
                View public profile
              </Link>
            ) : null}
          </div>
          <div className="flex flex-col items-start gap-2 rounded-2xl border border-primary/30 bg-primary/5 px-5 py-4 lg:items-end">
            <span className="text-xs font-semibold uppercase tracking-wide text-primary/70">
              Current plan
            </span>
            <span className="text-lg font-semibold capitalize text-primary">{planName}</span>
            <Link
              href="/upgrade"
              className="inline-flex items-center gap-2 rounded-full border border-primary/40 px-4 py-2 text-xs font-semibold text-primary transition hover:bg-primary/10"
            >
              Explore plans
            </Link>
          </div>
        </div>
      </section>

      <Suspense fallback={<MetricCards.Skeleton />}>
        <MetricCards metrics={metrics} />
      </Suspense>

      {actionTiles.length > 0 && <ActionTileGrid tiles={actionTiles} />}

      {/* Navigation Tile Grid - Always visible */}
      <NavigationTileGrid plan={planName} />

      <div className="grid gap-6 lg:grid-cols-3">
        <Suspense fallback={<UpcomingSessions.Skeleton className="lg:col-span-2" />}>
          <UpcomingSessions sessions={sessions} className="lg:col-span-2" />
        </Suspense>
        <Suspense fallback={<GrowthOpportunities.Skeleton />}>
          <GrowthOpportunities plan={planName} />
        </Suspense>
      </div>

      <ResponsiveSection
        title="Student progress highlights"
        description="Keep tabs on learner outcomes, upcoming lessons, and outstanding balances across your roster."
      >
        {studentProgressContent}
      </ResponsiveSection>

      {withinFirst30Days ? (
        <LaunchSprintSection>
          <Suspense fallback={<EmptyStates.Skeleton />}>
            <EmptyStates
              profileComplete={profileComplete}
              hasServices={hasServices}
              hasAvailability={hasAvailability}
              hasStudents={hasStudents}
            />
          </Suspense>
        </LaunchSprintSection>
      ) : null}
    </div>
  );
}

function ResponsiveSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <details
      open
      className="rounded-2xl border border-border bg-background/80 shadow-sm backdrop-blur [&_summary::-webkit-details-marker]:hidden"
    >
      <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-semibold text-foreground lg:hidden">
        <span>{title}</span>
        <span className="text-xs text-muted-foreground" aria-hidden="true">
          Tap to collapse
        </span>
      </summary>
      <div className="hidden border-b border-border px-6 py-4 lg:block">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {description ? (
        <p className="px-4 text-xs text-muted-foreground lg:hidden">{description}</p>
      ) : null}
      <div className="px-4 py-4 lg:px-6">{children}</div>
    </details>
  );
}

function LaunchSprintSection({ children }: { children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-primary/30 bg-primary/5 p-6 shadow-sm backdrop-blur">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-primary/70">
            First 30 days
          </span>
          <h2 className="text-xl font-semibold text-foreground">Launch sprint checklist</h2>
          <p className="text-sm text-muted-foreground">
            Knock out these setup tasks to launch confidently and keep parents in the loop.
          </p>
        </div>
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function ActionTileGrid({ tiles }: { tiles: ActionTile[] }) {
  return (
    <section className="grid gap-4 sm:grid-cols-2">
      {tiles.map((tile) => (
        <Link
          key={tile.href}
          href={tile.href}
          className="group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2"
        >
          <Card className="h-full rounded-3xl border border-border/60 bg-background/95 shadow-sm transition duration-200 group-hover:-translate-y-0.5 group-hover:border-primary/50 group-hover:shadow-md">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {tile.section}
                </p>
                <CardTitle className="mt-1 text-lg font-semibold text-foreground">
                  {tile.label}
                </CardTitle>
              </div>
              <tile.Icon className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground">{tile.description}</p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </section>
  );
}

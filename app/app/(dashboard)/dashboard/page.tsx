import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, Sparkles, CalendarDays } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { cn, formatDate } from "@/lib/utils";
import { getDashboardSummary, getDashboardSummaryFallback } from "@/lib/data/dashboard-summary";
import { getRecentActivity } from "@/lib/data/analytics-metrics";
import { DashboardAnalytics } from "@/components/dashboard/dashboard-analytics";
import { UpcomingSessions, type UpcomingSession } from "@/components/dashboard/upcoming-sessions";
import { RecentActivityList } from "@/components/analytics/premium/RecentActivityList";
import { InviteStudentsCard } from "@/components/dashboard/InviteStudentsCard";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { hasStudioAccess } from "@/lib/payments/subscriptions";
import { TrialExpiredBanner } from "@/components/billing/TrialExpiredBanner";
import { CopilotWidgetServer } from "@/components/copilot/copilot-widget-server";
import { CopilotDemoWidget } from "@/components/copilot/copilot-demo-widget";
import { isClassroomUrl, resolveBookingMeetingUrl } from "@/lib/utils/classroom-links";
import type { PlatformBillingPlan } from "@/lib/types/payments";
import { StudentActivityFeed } from "@/components/dashboard/StudentActivityFeed";
import { getTutorStudentActivity } from "@/lib/actions/practice-dashboard";
import { AnimateIn } from "@/components/ui/animate-in";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const summaryPromise = (async () => {
    // Try RPC first, fall back to individual queries if RPC is not available
    const rpcSummary = await getDashboardSummary(user.id, supabase);
    return rpcSummary ?? (await getDashboardSummaryFallback(user.id, supabase));
  })();

  const servicesPromise = supabase
    .from("services")
    .select("id, name, price_amount, price_currency, duration_minutes")
    .eq("tutor_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  const [summary, recentActivity, servicesResult, studentActivities] = await Promise.all([
    summaryPromise,
    getRecentActivity(user.id, 6, supabase),
    servicesPromise,
    getTutorStudentActivity(),
  ]);

  const activeServices = servicesResult.data ?? [];

  const {
    profile,
    upcoming_bookings: upcomingBookings,
    student_count: studentCount,
    revenue_this_month_cents: revenueThisMonth,
  } = summary;
  const today = new Date();
  const displayName =
    profile?.full_name?.split(" ")?.[0] ??
    profile?.full_name ??
    user.email?.split("@")?.[0] ??
    "there";

  const sessionsToday = upcomingBookings.filter((booking) => {
    const date = new Date(booking.scheduled_at);
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  }).length;

  const mappedUpcomingSessions: UpcomingSession[] = upcomingBookings.map((booking) => {
    const scheduledDate = new Date(booking.scheduled_at);
    return {
      id: booking.id,
      studentName: booking.student?.full_name ?? "Upcoming session",
      serviceName: booking.service?.name ?? "Lesson",
      scheduledLabel: scheduledDate.toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
      status: booking.status,
      meetingUrl: booking.meeting_url ?? null,
      meetingProvider: booking.meeting_provider ?? null,
      shortCode: booking.short_code ?? null,
    };
  });

  const nextBooking = upcomingBookings[0];
  const nextLessonDate =
    nextBooking && nextBooking.scheduled_at ? new Date(nextBooking.scheduled_at) : null;
  const isToday =
    nextLessonDate &&
    nextLessonDate.getFullYear() === today.getFullYear() &&
    nextLessonDate.getMonth() === today.getMonth() &&
    nextLessonDate.getDate() === today.getDate();
  const lessonTimeLabel = nextLessonDate
    ? nextLessonDate.toLocaleString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      })
    : null;
  const lessonDateLabel = nextLessonDate
    ? nextLessonDate.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    : null;
  const dateAndTimeLabel = nextLessonDate
    ? isToday
      ? lessonTimeLabel
        ? `Today, ${lessonTimeLabel}`
        : "Today"
      : lessonDateLabel
        ? `${lessonDateLabel}${lessonTimeLabel ? ` • ${lessonTimeLabel}` : ""}`
        : lessonTimeLabel
    : null;
  const metadataLabel = nextBooking
    ? [nextBooking.service?.name ?? "Lesson", dateAndTimeLabel].filter(Boolean).join(" • ")
    : "Add a session to see it here.";

  const planName: PlatformBillingPlan =
    (profile?.plan as PlatformBillingPlan | null) ?? "professional";
  const hasStudio = hasStudioAccess(planName);
  const showStudioDiscovery = !hasStudio;

  const resolvedMeetingUrl = nextBooking
    ? resolveBookingMeetingUrl({
        meetingUrl: nextBooking.meeting_url,
        bookingId: nextBooking.id,
        shortCode: nextBooking.short_code ?? null,
        tutorHasStudio: hasStudio,
        allowClassroomFallback: true,
      })
    : null;
  const meetingIsClassroom = isClassroomUrl(resolvedMeetingUrl);
  const startLessonUrl = resolvedMeetingUrl ?? null;
  const startLessonIsAbsolute = Boolean(startLessonUrl?.startsWith("http"));
  const startLessonTarget =
    startLessonIsAbsolute && !isClassroomUrl(startLessonUrl) ? "_blank" : "_self";
  const viewLessonPlanUrl =
    startLessonUrl && isClassroomUrl(startLessonUrl) ? startLessonUrl : "/bookings";
  const viewLessonPlanIsAbsolute = viewLessonPlanUrl.startsWith("http");

  // Check for local trial (when Stripe is not configured)
  let showTrialBanner = false;
  let trialDaysRemaining: number | undefined;
  let trialPlan: string | null = null;

  // Fetch local trial info separately since it's not in the dashboard summary
  const { data: trialProfile } = await supabase
    .from("profiles")
    .select("local_trial_end, local_trial_plan")
    .eq("id", user.id)
    .single();

  if (trialProfile?.local_trial_end) {
    const trialEnd = new Date(trialProfile.local_trial_end);
    const now = new Date();
    const diffMs = trialEnd.getTime() - now.getTime();
    trialDaysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    trialPlan = trialProfile.local_trial_plan;
    showTrialBanner = true;
  }

  return (
    <div className="space-y-8 sm:space-y-10">
      {showTrialBanner && trialPlan && (
        <TrialExpiredBanner
          trialPlan={trialPlan}
          daysRemaining={trialDaysRemaining}
        />
      )}

      <AnimateIn>
        <div className="pb-6 sm:pb-10">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {formatDate(new Date())}
          </p>
          <h1 className="font-sans text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
            {getTimeBasedGreeting()}, {displayName}.
          </h1>
          <p className="mt-2 text-base font-sans text-muted-foreground sm:text-lg">
            You have {sessionsToday} {sessionsToday === 1 ? "session" : "sessions"} today.
          </p>
        </div>
      </AnimateIn>

      <AnimateIn delay={0.1}>
        <DashboardAnalytics
          plan={planName}
          studentCount={studentCount}
          upcomingSessions={upcomingBookings.length}
          revenueThisMonthCents={revenueThisMonth}
        />
      </AnimateIn>

      {/* AI Copilot Widget - Shows for all users */}
      <Suspense fallback={null}>
        {!showStudioDiscovery ? (
          <CopilotWidgetServer />
        ) : (
          <CopilotDemoWidget hasStudioAccess={false} />
        )}
      </Suspense>

      <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
        {/* Row 1, Col 1: UP NEXT */}
        <AnimateIn delay={0.15} hoverLift>
        <div
          className={cn(
            "rounded-2xl border bg-white p-5 sm:rounded-3xl sm:p-6",
            nextBooking
              ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20"
              : "border-stone-200"
          )}
        >
          {nextBooking ? (
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:gap-5">
              <Avatar className="h-14 w-14 shrink-0 rounded-xl border border-stone-100 bg-stone-50 sm:h-16 sm:w-16">
                <AvatarFallback className="rounded-xl text-lg font-semibold text-primary">
                  {getInitials(nextBooking.student?.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Up next
                </p>
                <p className="text-xl font-semibold text-foreground sm:text-2xl">
                  {nextBooking.student?.full_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {metadataLabel}
                </p>
                {nextLessonDate && getCountdownLabel(nextLessonDate) && (
                  <p className="text-sm font-medium text-primary">
                    {getCountdownLabel(nextLessonDate)}
                  </p>
                )}
              </div>
              <div className="flex w-full flex-col gap-2 xl:w-auto xl:items-end">
                {startLessonUrl ? (
                  <Button
                    asChild
                    className="w-full whitespace-nowrap rounded-full bg-primary px-6 py-2.5 text-white hover:bg-primary/90 xl:w-auto"
                  >
                    {startLessonIsAbsolute ? (
                      <a
                        href={startLessonUrl}
                        target={startLessonTarget}
                        rel={startLessonTarget === "_blank" ? "noopener noreferrer" : undefined}
                        className="flex items-center justify-center gap-2"
                      >
                        <span>Start Lesson</span>
                        <ArrowRight className="h-4 w-4" />
                      </a>
                    ) : (
                      <Link href={startLessonUrl} className="flex items-center justify-center gap-2">
                        <span>Start Lesson</span>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    )}
                  </Button>
                ) : (
                  <Button
                    className="w-full whitespace-nowrap rounded-full bg-primary px-6 py-2.5 text-white hover:bg-primary/90 xl:w-auto"
                    disabled
                  >
                    <span className="flex items-center gap-2">
                      Start Lesson
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </Button>
                )}
                {viewLessonPlanIsAbsolute ? (
                  <a
                    className="group inline-flex items-center gap-1 self-start text-xs font-medium text-stone-400 transition-colors hover:text-primary xl:self-auto"
                    href={viewLessonPlanUrl}
                    target="_self"
                    rel="noopener noreferrer"
                  >
                    <span>View Lesson Plan</span>
                    <span className="opacity-0 transition-opacity group-hover:opacity-100">→</span>
                  </a>
                ) : (
                  <Link
                    className="group inline-flex items-center gap-1 self-start text-xs font-medium text-stone-400 transition-colors hover:text-primary xl:self-auto"
                    href={viewLessonPlanUrl}
                  >
                    <span>View Lesson Plan</span>
                    <span className="opacity-0 transition-opacity group-hover:opacity-100">→</span>
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Up next
              </p>
              <CalendarDays className="mt-3 h-8 w-8 text-stone-300" />
              <p className="mt-2 text-lg font-medium text-muted-foreground">
                No upcoming lessons
              </p>
              <Link
                href="/bookings"
                className="mt-3 text-sm font-medium text-primary hover:underline"
              >
                + Schedule a lesson
              </Link>
            </div>
          )}
        </div>

        </AnimateIn>

        {/* Row 1, Col 2: Invite Students */}
        <AnimateIn delay={0.22} hoverLift>
        <InviteStudentsCard
          username={profile?.username ?? ""}
          tutorName={profile?.full_name ?? ""}
          tagline={profile?.tagline ?? undefined}
          services={activeServices}
        />

        </AnimateIn>

        {/* Row 2, Col 1: Today & Tomorrow */}
        <AnimateIn delay={0.29} hoverLift>
        <div className="rounded-2xl border border-stone-200 bg-white p-5 sm:rounded-3xl sm:p-6">
          <UpcomingSessions sessions={mappedUpcomingSessions} />
        </div>

        </AnimateIn>

        {/* Row 2, Col 2: Recent Activity */}
        <AnimateIn delay={0.36} hoverLift>
        <RecentActivityList data={recentActivity} />

        </AnimateIn>

        {/* Row 3, Full Width: Student Practice Activity */}
        <AnimateIn delay={0.43} className="lg:col-span-2">
          <StudentActivityFeed activities={studentActivities} />
        </AnimateIn>
      </div>

      {showStudioDiscovery && (
        <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-white px-5 py-4">
          <div className="flex items-center gap-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">
              Unlock AI-powered tools with <span className="font-medium text-foreground">Studio</span>
            </span>
          </div>
          <Link
            href="/settings/billing?upgrade=studio"
            className="text-sm font-medium text-primary hover:text-primary/80"
          >
            Learn more
          </Link>
        </div>
      )}

    </div>
  );
}

function getInitials(name?: string | null) {
  if (!name) return "ST";
  const parts = name.split(" ").filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const second = parts[1]?.[0] ?? "";
  return `${first}${second}` || "ST";
}

function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  return "Good evening";
}

function getCountdownLabel(date: Date): string | null {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const remainingMins = diffMins % 60;

  if (diffMins < 0) return "Happening now";
  if (diffMins < 30) return "Starting soon";
  if (diffHours < 1) return `Starting in ${diffMins} minutes`;
  if (diffHours < 24) {
    return remainingMins > 0
      ? `Starting in ${diffHours}h ${remainingMins}m`
      : `Starting in ${diffHours} hour${diffHours > 1 ? "s" : ""}`;
  }
  return null;
}

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { getDashboardSummary, getDashboardSummaryFallback } from "@/lib/data/dashboard-summary";
import { getRecentActivity } from "@/lib/data/analytics-metrics";
import { DashboardAnalytics } from "@/components/dashboard/dashboard-analytics";
import { DashboardBookingCalendarSlot } from "@/components/dashboard/DashboardBookingCalendarSlot";
import { UpcomingSessions, type UpcomingSession } from "@/components/dashboard/upcoming-sessions";
import { RecentActivityList } from "@/components/analytics/premium/RecentActivityList";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { hasStudioAccess } from "@/lib/payments/subscriptions";
import { TrialExpiredBanner } from "@/components/billing/TrialExpiredBanner";
import type { PlatformBillingPlan } from "@/lib/types/payments";

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

  const [summary, recentActivity] = await Promise.all([
    summaryPromise,
    getRecentActivity(user.id, 6, supabase),
  ]);

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
  const showStudioDiscovery = !hasStudioAccess(planName);

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

      <div className="pb-6 sm:pb-10">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {formatDate(new Date())}
        </p>
        <h1 className="font-sans text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Good morning, {displayName}.
        </h1>
        <p className="mt-2 text-base font-sans text-muted-foreground sm:text-lg">
          You have {sessionsToday} {sessionsToday === 1 ? "session" : "sessions"} today.
        </p>
      </div>

      <DashboardAnalytics
        plan={planName}
        studentCount={studentCount}
        upcomingSessions={upcomingBookings.length}
        revenueThisMonthCents={revenueThisMonth}
      />

      <div className="grid items-start gap-8 xl:grid-cols-12">
        <div className="xl:col-span-7 min-h-[180px] rounded-2xl border border-stone-200 bg-white p-6 sm:rounded-3xl sm:p-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
            <Avatar className="h-16 w-16 rounded-2xl border border-stone-200 bg-stone-50 sm:h-24 sm:w-24">
              <AvatarFallback className="rounded-2xl text-xl font-semibold text-primary">
                {getInitials(nextBooking?.student?.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/70">
                Up next
              </p>
              <p className="mb-2 text-2xl font-semibold text-foreground sm:text-3xl">
                {nextBooking?.student?.full_name ?? "Your next student"}
              </p>
              <p className="text-base text-muted-foreground">
                {metadataLabel}
              </p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
              {nextBooking ? (
                <Button
                  asChild
                  className="w-full whitespace-nowrap rounded-full bg-primary px-8 py-3 text-white hover:bg-primary/90 sm:w-auto"
                >
                  <Link href={`/classroom/${nextBooking.id}`} className="flex items-center justify-center gap-2">
                    <span>Start Lesson</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <Button
                  className="w-full whitespace-nowrap rounded-full bg-primary px-8 py-3 text-white hover:bg-primary/90 sm:w-auto"
                  disabled
                >
                  <span className="flex items-center gap-2">
                    Start Lesson
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Button>
              )}
              <Link
                className="group inline-flex items-center gap-1 self-start text-xs font-medium text-stone-400 transition-colors hover:text-primary sm:self-auto"
                href={nextBooking ? `/classroom/${nextBooking.id}` : "/bookings"}
              >
                <span>View Lesson Plan</span>
                <span className="opacity-0 transition-opacity group-hover:opacity-100">→</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="space-y-6 xl:col-span-5">
          <UpcomingSessions sessions={mappedUpcomingSessions} />
          <RecentActivityList data={recentActivity} />
        </div>
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

      <DashboardBookingCalendarSlot signupDate={profile?.created_at ?? null} />
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

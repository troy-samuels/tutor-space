import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { getDashboardSummary, getDashboardSummaryFallback } from "@/lib/data/dashboard-summary";
import { DashboardAnalytics } from "@/components/dashboard/dashboard-analytics";
import { DashboardBookingCalendar } from "@/components/dashboard/dashboard-booking-calendar";
import type { PlatformBillingPlan } from "@/lib/types/payments";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Try RPC first, fall back to individual queries if RPC is not available
  let summary = await getDashboardSummary(user.id, supabase);
  if (!summary) {
    // Fallback: use parallelized individual queries
    summary = await getDashboardSummaryFallback(user.id, supabase);
  }

  const {
    profile,
    upcoming_bookings: upcomingBookings,
    student_count: studentCount,
    revenue_this_month_cents: revenueThisMonth,
    is_first_visit: isFirstVisit,
  } = summary;

  const planName: PlatformBillingPlan =
    (profile?.plan as PlatformBillingPlan | null) ?? "professional";

  return (
    <div className="space-y-8">
      <DashboardAnalytics
        plan={planName}
        studentCount={studentCount}
        upcomingSessions={upcomingBookings.length}
        revenueThisMonthCents={revenueThisMonth}
      />

      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-primary/20 bg-background/80 p-4 sm:p-6 lg:p-8 shadow-sm backdrop-blur">
        <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-primary/10" />
        <div className="absolute -right-28 bottom-0 h-28 w-28 rounded-full bg-primary/10" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-primary/70">
              {formatDate(new Date())}
            </p>
            <h1 className="mt-1 text-xl sm:text-2xl lg:text-3xl font-semibold text-foreground">
              {isFirstVisit
                ? `Welcome${profile?.full_name ? `, ${profile.full_name}` : ""}!`
                : `Welcome back${profile?.full_name ? `, ${profile.full_name}` : ""}`}
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
              Your students. Your schedule. Your earnings. All in one place.
            </p>
          </div>
        </div>
      </section>

      <DashboardBookingCalendar signupDate={profile?.created_at ?? null} />

      {/* Removed bottom grid (calendar + growth) and student progress highlights */}

    </div>
  );
}

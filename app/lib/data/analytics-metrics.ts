import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import type {
  StripeBalanceData,
  RevenueSourceBreakdown,
  RecentActivityItem,
} from "@/lib/types/analytics-premium";

export type RevenueDataPoint = {
  date: string;
  revenue: number;
};

export type StudentMetrics = {
  totalStudents: number;
  newStudents: number;
  returningStudents: number;
  churnRiskStudents: number;
  retentionRate: number;
  avgLessonsPerStudent: number;
};

export type BookingMetrics = {
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  pendingBookings: number;
  completionRate: number;
  cancellationRate: number;
  avgSessionValue: number;
};

export type ServicePopularity = {
  serviceName: string;
  bookingCount: number;
  percentage: number;
  revenue: number;
};

export type BookingsByPeriod = {
  period: string;
  completed: number;
  cancelled: number;
  pending: number;
};

export type EngagementDataPoint = {
  date: string;
  lessonCount: number;
  activeStudentCount: number;
};

export type ProfileViewStats = {
  totalViews: number;
  trend: { date: string; views: number }[];
};

export type PaymentHealth = {
  grossVolume: number;
  netEarnings: number;
  refunds: number;
  fees: number;
};

/**
 * Get revenue over time for a tutor
 */
export async function getRevenueOverTime(
  tutorId: string,
  days: number,
  client?: SupabaseClient
): Promise<RevenueDataPoint[]> {
  const supabase = client ?? (await createClient());
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("payments_audit")
    .select("amount_cents, created_at")
    .eq("tutor_id", tutorId)
    .gte("created_at", since)
    .gt("amount_cents", 0)
    .order("created_at", { ascending: true });

  if (error || !data) {
    console.error("Error fetching revenue data:", error);
    return [];
  }

  // Group by date
  const revenueByDate = new Map<string, number>();

  for (const row of data) {
    const date = new Date(row.created_at).toISOString().split("T")[0];
    const current = revenueByDate.get(date) ?? 0;
    revenueByDate.set(date, current + (row.amount_cents ?? 0));
  }

  // Fill in missing dates with 0
  const result: RevenueDataPoint[] = [];
  const startDate = new Date(since);
  const endDate = new Date();

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split("T")[0];
    result.push({
      date: dateStr,
      revenue: (revenueByDate.get(dateStr) ?? 0) / 100, // Convert cents to dollars
    });
  }

  return result;
}

/**
 * Get student retention and engagement metrics
 */
export async function getStudentMetrics(
  tutorId: string,
  days: number,
  client?: SupabaseClient
): Promise<StudentMetrics> {
  const supabase = client ?? (await createClient());
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Get all students for this tutor
  const { data: students } = await supabase
    .from("students")
    .select("id, created_at")
    .eq("tutor_id", tutorId);

  // Get all bookings for this tutor
  const { data: bookings } = await supabase
    .from("bookings")
    .select("student_id, status, scheduled_at, payment_amount")
    .eq("tutor_id", tutorId)
    .gte("scheduled_at", since);

  const studentList = students ?? [];
  const bookingList = bookings ?? [];
  const totalStudents = studentList.length;

  // New students (created in the period)
  const newStudents = studentList.filter(
    (s) => s.created_at && new Date(s.created_at) >= new Date(since)
  ).length;

  // Calculate bookings per student
  const bookingsPerStudent = new Map<string, { count: number; lastBooking: string | null }>();

  for (const booking of bookingList) {
    if (!booking.student_id) continue;
    const existing = bookingsPerStudent.get(booking.student_id) ?? { count: 0, lastBooking: null };
    existing.count += 1;
    if (booking.scheduled_at) {
      if (!existing.lastBooking || new Date(booking.scheduled_at) > new Date(existing.lastBooking)) {
        existing.lastBooking = booking.scheduled_at;
      }
    }
    bookingsPerStudent.set(booking.student_id, existing);
  }

  // Returning students (2+ bookings)
  const returningStudents = Array.from(bookingsPerStudent.values()).filter(
    (s) => s.count >= 2
  ).length;

  // Churn risk (no booking in last 30 days but had previous bookings)
  const churnRiskStudents = Array.from(bookingsPerStudent.entries()).filter(([, data]) => {
    if (data.count === 0) return false;
    if (!data.lastBooking) return true;
    return new Date(data.lastBooking) < new Date(thirtyDaysAgo);
  }).length;

  // Retention rate (% of students with 2+ bookings)
  const retentionRate = totalStudents > 0
    ? Math.round((returningStudents / totalStudents) * 100)
    : 0;

  // Avg lessons per student
  const totalLessons = bookingList.filter(b => b.status === "completed").length;
  const avgLessonsPerStudent = totalStudents > 0
    ? Math.round((totalLessons / totalStudents) * 10) / 10
    : 0;

  return {
    totalStudents,
    newStudents,
    returningStudents,
    churnRiskStudents,
    retentionRate,
    avgLessonsPerStudent,
  };
}

/**
 * Get booking metrics (completion, cancellation rates)
 */
export async function getBookingMetrics(
  tutorId: string,
  days: number,
  client?: SupabaseClient
): Promise<BookingMetrics> {
  const supabase = client ?? (await createClient());
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data: bookings } = await supabase
    .from("bookings")
    .select("status, payment_amount, scheduled_at")
    .eq("tutor_id", tutorId)
    .gte("scheduled_at", since);

  const bookingList = bookings ?? [];
  const totalBookings = bookingList.length;

  const completedBookings = bookingList.filter(b => b.status === "completed").length;
  const cancelledBookings = bookingList.filter(b => b.status === "cancelled").length;
  const pendingBookings = bookingList.filter(b => b.status === "pending" || b.status === "confirmed").length;

  const completionRate = totalBookings > 0
    ? Math.round((completedBookings / totalBookings) * 100)
    : 0;

  const cancellationRate = totalBookings > 0
    ? Math.round((cancelledBookings / totalBookings) * 100)
    : 0;

  // Average session value from paid bookings
  const paidBookings = bookingList.filter(b => b.payment_amount && b.payment_amount > 0);
  const totalRevenue = paidBookings.reduce((sum, b) => sum + (b.payment_amount ?? 0), 0);
  const avgSessionValue = paidBookings.length > 0
    ? Math.round(totalRevenue / paidBookings.length) / 100
    : 0;

  return {
    totalBookings,
    completedBookings,
    cancelledBookings,
    pendingBookings,
    completionRate,
    cancellationRate,
    avgSessionValue,
  };
}

/**
 * Get service popularity (most booked services)
 */
export async function getServicePopularity(
  tutorId: string,
  days: number,
  client?: SupabaseClient
): Promise<ServicePopularity[]> {
  const supabase = client ?? (await createClient());
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  // Get bookings with service info
  const { data: bookings } = await supabase
    .from("bookings")
    .select("service_id, payment_amount, services(name)")
    .eq("tutor_id", tutorId)
    .gte("scheduled_at", since);

  const bookingList = bookings ?? [];

  // Group by service
  const serviceStats = new Map<string, { count: number; revenue: number; name: string }>();

  for (const booking of bookingList) {
    const serviceName = (booking.services as { name?: string } | null)?.name ?? "Unknown Service";
    const serviceId = booking.service_id ?? "unknown";
    const existing = serviceStats.get(serviceId) ?? { count: 0, revenue: 0, name: serviceName };
    existing.count += 1;
    existing.revenue += booking.payment_amount ?? 0;
    serviceStats.set(serviceId, existing);
  }

  const totalBookings = bookingList.length;

  return Array.from(serviceStats.values())
    .map(stat => ({
      serviceName: stat.name,
      bookingCount: stat.count,
      percentage: totalBookings > 0 ? Math.round((stat.count / totalBookings) * 100) : 0,
      revenue: stat.revenue / 100, // Convert cents to dollars
    }))
    .sort((a, b) => b.bookingCount - a.bookingCount)
    .slice(0, 5); // Top 5 services
}

/**
 * Get bookings grouped by week/period
 */
export async function getBookingsByPeriod(
  tutorId: string,
  days: number,
  client?: SupabaseClient
): Promise<BookingsByPeriod[]> {
  const supabase = client ?? (await createClient());
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data: bookings } = await supabase
    .from("bookings")
    .select("status, scheduled_at")
    .eq("tutor_id", tutorId)
    .gte("scheduled_at", since)
    .order("scheduled_at", { ascending: true });

  const bookingList = bookings ?? [];

  // Group by week
  const weekStats = new Map<string, { completed: number; cancelled: number; pending: number }>();

  for (const booking of bookingList) {
    if (!booking.scheduled_at) continue;

    // Get week start (Monday)
    const date = new Date(booking.scheduled_at);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const weekStart = new Date(date.setDate(diff));
    const weekKey = weekStart.toISOString().split("T")[0];

    const existing = weekStats.get(weekKey) ?? { completed: 0, cancelled: 0, pending: 0 };

    if (booking.status === "completed") {
      existing.completed += 1;
    } else if (booking.status === "cancelled") {
      existing.cancelled += 1;
    } else {
      existing.pending += 1;
    }

    weekStats.set(weekKey, existing);
  }

  return Array.from(weekStats.entries())
    .map(([period, stats]) => ({
      period: formatWeekLabel(period),
      ...stats,
      rawPeriod: period,
    }))
    .sort((a, b) => new Date(a.rawPeriod).getTime() - new Date(b.rawPeriod).getTime())
    .map((item) => {
      const rest = { ...item };
      delete (rest as { rawPeriod?: string }).rawPeriod;
      return rest as Omit<typeof item, "rawPeriod">;
    });
}

/**
 * Get total revenue for a period with payment health breakdown
 */
export async function getTotalRevenue(
  tutorId: string,
  days: number,
  client?: SupabaseClient
): Promise<PaymentHealth> {
  const supabase = client ?? (await createClient());
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data } = await supabase
    .from("payments_audit")
    .select("amount_cents, application_fee_cents")
    .eq("tutor_id", tutorId)
    .gte("created_at", since);

  const payments = data ?? [];

  let gross = 0;
  let refunds = 0;
  let fees = 0;

  for (const payment of payments) {
    const amount = payment.amount_cents ?? 0;
    if (amount > 0) {
      gross += amount;
      fees += payment.application_fee_cents ?? 0;
    } else {
      refunds += Math.abs(amount);
    }
  }

  return {
    grossVolume: gross / 100,
    netEarnings: Math.max(0, (gross - refunds - fees)) / 100,
    refunds: refunds / 100,
    fees: fees / 100,
  };
}

function formatWeekLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const month = date.toLocaleString("default", { month: "short" });
  const day = date.getDate();
  return `${month} ${day}`;
}

/**
 * Get engagement trends over time (lesson counts and active students per day)
 */
export async function getEngagementOverTime(
  tutorId: string,
  days: number,
  client?: SupabaseClient
): Promise<EngagementDataPoint[]> {
  const supabase = client ?? (await createClient());
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data: bookings } = await supabase
    .from("bookings")
    .select("student_id, scheduled_at")
    .eq("tutor_id", tutorId)
    .eq("status", "completed")
    .gte("scheduled_at", since);

  const bookingList = bookings ?? [];

  // Group by date
  const engagementByDate = new Map<string, { lessons: number; students: Set<string> }>();

  for (const booking of bookingList) {
    if (!booking.scheduled_at) continue;

    const date = new Date(booking.scheduled_at).toISOString().split("T")[0];
    const existing = engagementByDate.get(date) ?? { lessons: 0, students: new Set<string>() };
    existing.lessons += 1;
    if (booking.student_id) {
      existing.students.add(booking.student_id);
    }
    engagementByDate.set(date, existing);
  }

  // Fill in missing dates with zeros
  const result: EngagementDataPoint[] = [];
  const startDate = new Date(since);
  const endDate = new Date();

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split("T")[0];
    const dayData = engagementByDate.get(dateStr);
    result.push({
      date: dateStr,
      lessonCount: dayData?.lessons ?? 0,
      activeStudentCount: dayData?.students.size ?? 0,
    });
  }

  return result;
}

/**
 * Get profile view statistics for a tutor's public pages
 */
export async function getProfileViews(
  tutorId: string,
  days: number,
  client?: SupabaseClient
): Promise<ProfileViewStats> {
  const supabase = client ?? (await createClient());
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  // First get the tutor's username
  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", tutorId)
    .single();

  if (!profile?.username) {
    return { totalViews: 0, trend: [] };
  }

  const username = profile.username;

  // Query page_views for all tutor's public pages
  // Note: page_views has RLS that blocks user access, but we're using the server client
  const { data: views } = await supabase
    .from("page_views")
    .select("created_at")
    .or(`page_path.eq./${username},page_path.eq./profile/${username},page_path.eq./bio/${username},page_path.eq./book/${username}`)
    .gte("created_at", since);

  const viewList = views ?? [];
  const totalViews = viewList.length;

  // Group by date for trend
  const viewsByDate = new Map<string, number>();

  for (const view of viewList) {
    if (!view.created_at) continue;
    const date = new Date(view.created_at).toISOString().split("T")[0];
    viewsByDate.set(date, (viewsByDate.get(date) ?? 0) + 1);
  }

  // Fill in missing dates with zeros
  const trend: { date: string; views: number }[] = [];
  const startDate = new Date(since);
  const endDate = new Date();

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split("T")[0];
    trend.push({
      date: dateStr,
      views: viewsByDate.get(dateStr) ?? 0,
    });
  }

  return { totalViews, trend };
}

/**
 * Get Stripe balance for a tutor's connected account
 */
export async function getStripeBalance(
  tutorId: string,
  client?: SupabaseClient
): Promise<StripeBalanceData | null> {
  const supabase = client ?? (await createClient());

  // Get tutor's stripe account ID
  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_account_id, stripe_charges_enabled")
    .eq("id", tutorId)
    .single();

  if (!profile?.stripe_account_id || !profile.stripe_charges_enabled) {
    return null;
  }

  try {
    // Fetch balance from Stripe
    const balance = await stripe.balance.retrieve({
      stripeAccount: profile.stripe_account_id,
    });

    // Fetch account to check for requirements
    const account = await stripe.accounts.retrieve(profile.stripe_account_id);

    const availableCents = balance.available.reduce(
      (sum, b) => sum + b.amount,
      0
    );
    const pendingCents = balance.pending.reduce((sum, b) => sum + b.amount, 0);
    const currency = balance.available[0]?.currency ?? "usd";

    const actionItems = account.requirements?.currently_due ?? [];
    const requiresAction = actionItems.length > 0;

    return {
      availableCents,
      pendingCents,
      currency,
      requiresAction,
      actionItems,
    };
  } catch (error) {
    console.error("[Analytics] Failed to fetch Stripe balance:", error);
    return null;
  }
}

/**
 * Get revenue source breakdown (subscriptions, packages, ad-hoc)
 */
export async function getRevenueSourceBreakdown(
  tutorId: string,
  client?: SupabaseClient
): Promise<RevenueSourceBreakdown> {
  const supabase = client ?? (await createClient());

  // Query active lesson subscriptions
  const { data: subscriptions } = await supabase
    .from("lesson_subscriptions")
    .select("id, template_id, lesson_subscription_templates(price_cents)")
    .eq("tutor_id", tutorId)
    .in("status", ["active", "trialing"]);

  const subscriptionCount = subscriptions?.length ?? 0;

  // Calculate MRR from active subscriptions
  const estimatedMRR =
    subscriptions?.reduce((sum, sub) => {
      const template = sub.lesson_subscription_templates as { price_cents?: number } | null;
      return sum + (template?.price_cents ?? 0);
    }, 0) ?? 0;

  // Query active session packages
  const { data: packages } = await supabase
    .from("session_package_purchases")
    .select("id, session_package_templates!inner(tutor_id)")
    .eq("session_package_templates.tutor_id", tutorId)
    .eq("status", "active")
    .gt("remaining_minutes", 0);

  const packageCount = packages?.length ?? 0;

  // Get total students
  const { count: totalStudents } = await supabase
    .from("students")
    .select("id", { count: "exact", head: true })
    .eq("tutor_id", tutorId);

  const totalActiveStudents = totalStudents ?? 0;

  // Calculate ad-hoc (students not on subscription or package)
  const adHocCount = Math.max(0, totalActiveStudents - subscriptionCount - packageCount);

  // Calculate percentages
  const total = subscriptionCount + packageCount + adHocCount;
  const subscriptionPercentage = total > 0 ? Math.round((subscriptionCount / total) * 100) : 0;
  const packagePercentage = total > 0 ? Math.round((packageCount / total) * 100) : 0;
  const adHocPercentage = total > 0 ? 100 - subscriptionPercentage - packagePercentage : 0;

  return {
    subscriptionCount,
    packageCount,
    adHocCount,
    totalActiveStudents,
    subscriptionPercentage,
    packagePercentage,
    adHocPercentage,
    estimatedMRR: estimatedMRR / 100, // Convert to dollars
  };
}

/**
 * Get recent activity feed items
 */
export async function getRecentActivity(
  tutorId: string,
  limit: number = 10,
  client?: SupabaseClient
): Promise<RecentActivityItem[]> {
  const supabase = client ?? (await createClient());
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Fetch recent bookings, payments, and new students in parallel
  const [bookingsResult, paymentsResult, studentsResult] = await Promise.all([
    supabase
      .from("bookings")
      .select("id, scheduled_at, payment_amount, currency, students(name, email)")
      .eq("tutor_id", tutorId)
      .gte("created_at", sevenDaysAgo)
      .order("created_at", { ascending: false })
      .limit(5),

    supabase
      .from("payments_audit")
      .select("id, amount_cents, currency, created_at, students(name, email)")
      .eq("tutor_id", tutorId)
      .gt("amount_cents", 0)
      .gte("created_at", sevenDaysAgo)
      .order("created_at", { ascending: false })
      .limit(5),

    supabase
      .from("students")
      .select("id, name, email, created_at")
      .eq("tutor_id", tutorId)
      .gte("created_at", sevenDaysAgo)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const activities: RecentActivityItem[] = [];

  // Add bookings
  for (const booking of bookingsResult.data ?? []) {
    const student = booking.students as { name?: string; email?: string } | null;
    activities.push({
      id: `booking-${booking.id}`,
      type: "booking",
      title: "Lesson booked",
      subtitle: student?.name ?? student?.email ?? "Unknown student",
      timestamp: booking.scheduled_at,
      amount: booking.payment_amount ? booking.payment_amount / 100 : undefined,
      currency: booking.currency ?? "usd",
    });
  }

  // Add payments
  for (const payment of paymentsResult.data ?? []) {
    const student = payment.students as { name?: string; email?: string } | null;
    activities.push({
      id: `payment-${payment.id}`,
      type: "payment",
      title: "Payment received",
      subtitle: student?.name ?? student?.email ?? "Unknown student",
      timestamp: payment.created_at,
      amount: payment.amount_cents / 100,
      currency: payment.currency ?? "usd",
    });
  }

  // Add new students
  for (const student of studentsResult.data ?? []) {
    activities.push({
      id: `student-${student.id}`,
      type: "student",
      title: "New student",
      subtitle: student.name ?? student.email ?? "Unknown",
      timestamp: student.created_at,
    });
  }

  // Sort by timestamp DESC and limit
  activities.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return activities.slice(0, limit);
}

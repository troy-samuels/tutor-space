import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

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
    .eq("tutor_id", tutorId);

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
    }))
    .sort((a, b) => a.period.localeCompare(b.period));
}

/**
 * Get total revenue for a period
 */
export async function getTotalRevenue(
  tutorId: string,
  days: number,
  client?: SupabaseClient
): Promise<{ gross: number; net: number; refunds: number }> {
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
    gross: gross / 100,
    net: Math.max(0, (gross - refunds - fees)) / 100,
    refunds: refunds / 100,
  };
}

function formatWeekLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const month = date.toLocaleString("default", { month: "short" });
  const day = date.getDate();
  return `${month} ${day}`;
}

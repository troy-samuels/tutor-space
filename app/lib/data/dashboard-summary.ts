import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export type DashboardProfile = {
  username: string | null;
  bio: string | null;
  tagline: string | null;
  full_name: string | null;
  plan: string | null;
  email: string | null;
  created_at: string | null;
  booking_currency: string | null;
};

export type DashboardUpcomingBooking = {
  id: string;
  scheduled_at: string;
  status: string;
  payment_status: string | null;
  payment_amount: number | null;
  currency: string | null;
  meeting_url?: string | null;
  meeting_provider?: string | null;
  short_code?: string | null;
  student: {
    full_name: string | null;
    proficiency_level: string | null;
  } | null;
  service: {
    name: string | null;
  } | null;
};

export type DashboardSummary = {
  profile: DashboardProfile;
  upcoming_bookings: DashboardUpcomingBooking[];
  total_bookings: number;
  student_count: number;
  revenue_this_month_cents: number;
  is_first_visit: boolean;
};

/**
 * Get consolidated dashboard summary data via RPC
 * This consolidates multiple queries into a single database call
 */
export async function getDashboardSummary(
  tutorId: string,
  client?: SupabaseClient
): Promise<DashboardSummary | null> {
  const supabase = client ?? (await createClient());

  const { data, error } = await supabase.rpc("get_dashboard_summary", {
    p_tutor_id: tutorId,
  });

  if (error) {
    console.error("[DashboardSummary] RPC error:", error);
    return null;
  }

  return data as DashboardSummary;
}

/**
 * Fallback function using individual queries (for when RPC is not available)
 * This maintains backwards compatibility
 */
export async function getDashboardSummaryFallback(
  tutorId: string,
  client?: SupabaseClient
): Promise<DashboardSummary> {
  const supabase = client ?? (await createClient());
  const nowIso = new Date().toISOString();
  const now = new Date();
  const thisMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Run queries in parallel for better performance
  const [profileResult, upcomingResult, totalResult, invoicesResult, studentCountResult] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("username, bio, tagline, full_name, plan, email, created_at, booking_currency")
        .eq("id", tutorId)
        .single(),
      supabase
        .from("bookings")
        .select(
          "id, scheduled_at, status, payment_status, payment_amount, currency, meeting_url, meeting_provider, short_code, student:students(full_name, proficiency_level), service:services(name)"
        )
        .eq("tutor_id", tutorId)
        .gte("scheduled_at", nowIso)
        .order("scheduled_at", { ascending: true })
        .limit(3),
      supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("tutor_id", tutorId),
      supabase
        .from("invoices")
        .select("total_due_cents, status, due_date")
        .eq("tutor_id", tutorId)
        .eq("status", "paid"),
      supabase
        .from("students")
        .select("*", { count: "exact", head: true })
        .eq("tutor_id", tutorId),
    ]);

  const profile = profileResult.data ?? {
    username: null,
    bio: null,
    tagline: null,
    full_name: null,
    plan: null,
    email: null,
    created_at: null,
    booking_currency: null,
  };

  const upcomingBookings = (upcomingResult.data as DashboardUpcomingBooking[] | null) ?? [];
  const totalBookings = totalResult.count ?? 0;
  const studentCount = studentCountResult.count ?? 0;

  // Calculate revenue this month
  const revenueThisMonth = (invoicesResult.data ?? []).reduce((total, invoice) => {
    const dueDate = invoice.due_date ? new Date(invoice.due_date) : now;
    if (dueDate.getMonth() === thisMonth && dueDate.getFullYear() === currentYear) {
      return total + (invoice.total_due_cents ?? 0);
    }
    return total;
  }, 0);

  return {
    profile,
    upcoming_bookings: upcomingBookings,
    total_bookings: totalBookings,
    student_count: studentCount,
    revenue_this_month_cents: revenueThisMonth,
    is_first_visit: totalBookings === 0,
  };
}

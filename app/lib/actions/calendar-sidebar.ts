"use server";

import { createClient } from "@/lib/supabase/server";
import { startOfDay, endOfDay, startOfMonth, endOfMonth } from "date-fns";

export type DailyLesson = {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  meeting_url: string | null;
  meeting_provider: string | null;
  payment_status: string | null;
  student: {
    id: string;
    full_name: string;
    email: string;
  } | null;
  service: {
    name: string;
  } | null;
};

type BookingRow = {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  meeting_url: string | null;
  meeting_provider: string | null;
  payment_status: string | null;
  students: {
    id: string;
    full_name: string;
    email: string;
  } | null;
  services: {
    name: string;
  } | null;
};

export async function getDailyLessons(date: Date) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { lessons: [] };

  const dayStart = startOfDay(date).toISOString();
  const dayEnd = endOfDay(date).toISOString();

  const { data: bookings, error } = await supabase
    .from("bookings")
    .select(`
      id,
      scheduled_at,
      duration_minutes,
      status,
      meeting_url,
      meeting_provider,
      payment_status,
      students (
        id,
        full_name,
        email
      ),
      services (
        name
      )
    `)
    .eq("tutor_id", user.id)
    .gte("scheduled_at", dayStart)
    .lte("scheduled_at", dayEnd)
    .in("status", ["pending", "confirmed", "completed"])
    .order("scheduled_at", { ascending: true });

  if (error) {
    console.error("Error fetching daily lessons:", error);
    return { lessons: [] };
  }

  const lessons: DailyLesson[] = (bookings || []).map((booking: BookingRow) => ({
    id: booking.id,
    scheduled_at: booking.scheduled_at,
    duration_minutes: booking.duration_minutes,
    status: booking.status,
    meeting_url: booking.meeting_url,
    meeting_provider: booking.meeting_provider,
    payment_status: booking.payment_status,
    student: booking.students,
    service: booking.services,
  }));

  return { lessons };
}

export async function getMonthlyBookingCounts(year: number, month: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { counts: {} };

  const monthStart = startOfMonth(new Date(year, month, 1)).toISOString();
  const monthEnd = endOfMonth(new Date(year, month, 1)).toISOString();

  const { data: bookings, error } = await supabase
    .from("bookings")
    .select("scheduled_at, status")
    .eq("tutor_id", user.id)
    .gte("scheduled_at", monthStart)
    .lte("scheduled_at", monthEnd)
    .in("status", ["pending", "confirmed", "completed"]);

  if (error) {
    console.error("Error fetching monthly counts:", error);
    return { counts: {} };
  }

  // Group by date
  const counts: Record<string, number> = {};
  bookings?.forEach((booking) => {
    const date = booking.scheduled_at.split("T")[0]; // YYYY-MM-DD
    counts[date] = (counts[date] || 0) + 1;
  });

  return { counts };
}

export async function getTodayLessonsCount() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { count: 0 };

  const today = new Date();
  const dayStart = startOfDay(today).toISOString();
  const dayEnd = endOfDay(today).toISOString();

  const { count, error } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("tutor_id", user.id)
    .gte("scheduled_at", dayStart)
    .lte("scheduled_at", dayEnd)
    .in("status", ["pending", "confirmed"]);

  if (error) {
    console.error("Error fetching today's count:", error);
    return { count: 0 };
  }

  return { count: count || 0 };
}


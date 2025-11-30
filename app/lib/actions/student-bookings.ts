"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { createBookingAndCheckout } from "./bookings";

interface CreateStudentBookingParams {
  tutorId: string;
  serviceId: string;
  scheduledAt: string;
  durationMinutes: number;
  notes: string | null;
  amount: number;
  currency: string;
  packageId?: string; // Optional: Use package instead of payment
}

export type StudentPackage = {
  id: string;
  name: string;
  remaining_minutes: number;
  expires_at: string | null;
  purchase_id: string;
  total_minutes: number;
};

/**
 * Get the logged-in student's active packages for a specific tutor
 */
export async function getStudentPackagesForTutor(tutorId: string): Promise<{
  packages?: StudentPackage[];
  error?: string;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Please log in" };
  }

  const adminClient = createServiceRoleClient();
  if (!adminClient) {
    return { error: "Service unavailable" };
  }

  // Find the student record for this user with this tutor
  const { data: student } = await adminClient
    .from("students")
    .select("id")
    .eq("user_id", user.id)
    .eq("tutor_id", tutorId)
    .maybeSingle();

  if (!student) {
    return { packages: [] };
  }

  // Get active packages for this student from this tutor
  const { data: purchases, error: purchaseError } = await adminClient
    .from("session_package_purchases")
    .select(`
      id,
      remaining_minutes,
      expires_at,
      status,
      package:session_package_templates (
        id,
        name,
        total_minutes,
        tutor_id
      ),
      redemptions:session_package_redemptions (
        minutes_redeemed,
        refunded_at
      )
    `)
    .eq("student_id", student.id)
    .eq("status", "active")
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

  if (purchaseError) {
    console.error("[student-bookings] Error fetching packages:", purchaseError);
    return { error: "Failed to load packages" };
  }

  if (!purchases || purchases.length === 0) {
    return { packages: [] };
  }

  // Filter to only packages from this tutor and calculate remaining minutes
  const activePackages: StudentPackage[] = [];

  for (const purchase of purchases) {
    const pkgData = purchase.package;
    const pkg = Array.isArray(pkgData) ? pkgData[0] : pkgData as {
      id: string;
      name: string;
      total_minutes: number;
      tutor_id: string;
    } | null;

    if (!pkg || pkg.tutor_id !== tutorId) {
      continue;
    }

    // Calculate redeemed minutes from embedded redemptions (excludes refunded)
    const redemptionsData = purchase.redemptions as Array<{
      minutes_redeemed: number | null;
      refunded_at: string | null;
    }> | null;

    const redeemedMinutes = redemptionsData?.reduce(
      (sum, r) => sum + (r.refunded_at === null ? (r.minutes_redeemed || 0) : 0),
      0
    ) || 0;

    const remainingMinutes = pkg.total_minutes - redeemedMinutes;

    if (remainingMinutes > 0) {
      activePackages.push({
        id: pkg.id,
        name: pkg.name,
        remaining_minutes: remainingMinutes,
        expires_at: purchase.expires_at,
        purchase_id: purchase.id,
        total_minutes: pkg.total_minutes,
      });
    }
  }

  return { packages: activePackages };
}

/**
 * Create a booking from the student portal
 * Student must have an approved connection with the tutor
 */
export async function createStudentBooking(
  params: CreateStudentBookingParams
): Promise<{
  success?: boolean;
  bookingId?: string;
  checkoutUrl?: string | null;
  error?: string;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Please log in to book a lesson" };
  }

  // Verify approved connection
  const { data: connection } = await supabase
    .from("student_tutor_connections")
    .select("id, status")
    .eq("student_user_id", user.id)
    .eq("tutor_id", params.tutorId)
    .single();

  if (!connection || connection.status !== "approved") {
    return { error: "You need an approved connection to book with this tutor" };
  }

  const adminClient = createServiceRoleClient();
  const { data: authUser } = adminClient
    ? await adminClient.auth.admin.getUserById(user.id)
    : { data: null as any };

  const studentName =
    authUser?.user?.user_metadata?.full_name ||
    user.user_metadata?.full_name ||
    authUser?.user?.email ||
    user.email ||
    "Student";

  const studentEmail = authUser?.user?.email || user.email || "";
  const timezone =
    authUser?.user?.user_metadata?.timezone ||
    user.user_metadata?.timezone ||
    Intl.DateTimeFormat().resolvedOptions().timeZone ||
    "UTC";

  const result = await createBookingAndCheckout({
    tutorId: params.tutorId,
    serviceId: params.serviceId,
    scheduledAt: params.scheduledAt,
    durationMinutes: params.durationMinutes,
    timezone,
    student: {
      fullName: studentName,
      email: studentEmail,
      phone: null,
      timezone,
      parentName: null,
      parentEmail: null,
      parentPhone: null,
    },
    notes: params.notes,
    amount: params.amount,
    currency: params.currency,
    packageId: params.packageId, // Pass package ID if using package payment
  });

  if ("success" in result && result.success) {
    revalidatePath("/student-auth/calendar");
    revalidatePath("/bookings");
  }

  return result;
}

/**
 * Get student's upcoming bookings
 */
export async function getStudentBookings(): Promise<{
  bookings?: {
    id: string;
    scheduled_at: string;
    duration_minutes: number;
    status: string;
    notes: string | null;
    tutor: {
      id: string;
      username: string;
      full_name: string | null;
      avatar_url: string | null;
    };
    service: {
      id: string;
      name: string;
    };
  }[];
  error?: string;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Please log in" };
  }

  const adminClient = createServiceRoleClient();
  if (!adminClient) {
    return { error: "Service unavailable" };
  }

  // Get all student records for this user
  const { data: students } = await adminClient
    .from("students")
    .select("id, tutor_id")
    .eq("user_id", user.id);

  if (!students || students.length === 0) {
    return { bookings: [] };
  }

  const studentIds = students.map((s) => s.id);

  // Get upcoming bookings
  const { data: bookings, error } = await adminClient
    .from("bookings")
    .select(`
      id,
      scheduled_at,
      duration_minutes,
      status,
      notes,
      tutor_id,
      service_id
    `)
    .in("student_id", studentIds)
    .gte("scheduled_at", new Date().toISOString())
    .not("status", "in", '("cancelled_by_tutor","cancelled_by_student")')
    .order("scheduled_at", { ascending: true });

  if (error) {
    console.error("Failed to get bookings:", error);
    return { error: "Failed to load bookings" };
  }

  // Get tutor and service info
  const tutorIds = [...new Set(bookings.map((b) => b.tutor_id))];
  const serviceIds = [...new Set(bookings.map((b) => b.service_id))];

  const [tutorsResult, servicesResult] = await Promise.all([
    adminClient
      .from("profiles")
      .select("id, username, full_name, avatar_url")
      .in("id", tutorIds),
    adminClient
      .from("services")
      .select("id, name")
      .in("id", serviceIds),
  ]);

  const tutorMap = new Map(tutorsResult.data?.map((t) => [t.id, t]) || []);
  const serviceMap = new Map(servicesResult.data?.map((s) => [s.id, s]) || []);

  const result = bookings.map((booking) => ({
    id: booking.id,
    scheduled_at: booking.scheduled_at,
    duration_minutes: booking.duration_minutes,
    status: booking.status,
    notes: booking.notes,
    tutor: tutorMap.get(booking.tutor_id) || {
      id: booking.tutor_id,
      username: "",
      full_name: null,
      avatar_url: null,
    },
    service: serviceMap.get(booking.service_id) || {
      id: booking.service_id,
      name: "Unknown Service",
    },
  }));

  return { bookings: result };
}

"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { createBookingAndCheckout } from "./bookings";
import { isTableMissing } from "@/lib/utils/supabase-errors";
import { getTutorForBooking, getTutorBookings, type TutorWithDetails } from "./student-connections";
import { getStudentSubscription } from "./lesson-subscriptions";
import type { SubscriptionWithDetails } from "@/lib/subscription";

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
  const { data: connection, error: connectionError } = await supabase
    .from("student_tutor_connections")
    .select("id, status")
    .eq("student_user_id", user.id)
    .eq("tutor_id", params.tutorId)
    .single();

  const missingConnectionTable = isTableMissing(connectionError, "student_tutor_connections");

  if (!missingConnectionTable && (!connection || connection.status !== "approved")) {
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
    revalidatePath("/student/calendar");
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
    meeting_url: string | null;
    meeting_provider: string | null;
    tutor: {
      id: string;
      username: string;
      full_name: string | null;
      avatar_url: string | null;
      tier: string | null;
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
  const selectBase = `
    id,
    scheduled_at,
    duration_minutes,
    status,
    meeting_url,
    meeting_provider,
    tutor_id,
    service_id
  `;
  const isMissingColumn = (error: { code?: string; message?: string } | null, column: string) =>
    Boolean(
      error &&
        (error.code === "42703" ||
          (error.message || "").toLowerCase().includes(`column bookings.${column}`))
    );
  const buildBookingsQuery = (selectClause: string) =>
    adminClient
      .from("bookings")
      .select(selectClause)
      .in("student_id", studentIds)
      .gte("scheduled_at", new Date().toISOString())
      .not("status", "in", '("cancelled","cancelled_by_tutor","cancelled_by_student")')
      .order("scheduled_at", { ascending: true });

  let { data: bookings, error } = await buildBookingsQuery(
    `${selectBase}, notes:student_notes`
  );

  if (isMissingColumn(error, "student_notes")) {
    ({ data: bookings, error } = await buildBookingsQuery(`${selectBase}, notes`));
  }

  if (isMissingColumn(error, "notes")) {
    ({ data: bookings, error } = await buildBookingsQuery(selectBase));
  }

  if (error) {
    console.error("Failed to get bookings:", error);
    return { error: "Failed to load bookings" };
  }

  if (!bookings || !Array.isArray(bookings)) {
    return { bookings: [] };
  }

  // Get tutor and service info
  type BookingRow = {
    id: string;
    scheduled_at: string;
    duration_minutes: number;
    status: string;
    meeting_url: string | null;
    meeting_provider: string | null;
    tutor_id: string;
    service_id: string;
    notes?: string | null;
  };
  const bookingsList = bookings as unknown as BookingRow[];
  const tutorIds = [...new Set(bookingsList.map((b) => b.tutor_id))];
  const serviceIds = [...new Set(bookingsList.map((b) => b.service_id))];

  const [tutorsResult, servicesResult] = await Promise.all([
    adminClient
      .from("profiles")
      .select("id, username, full_name, avatar_url, tier")
      .in("id", tutorIds),
    adminClient
      .from("services")
      .select("id, name")
      .in("id", serviceIds),
  ]);

  const tutorMap = new Map(tutorsResult.data?.map((t) => [t.id, t]) || []);
  const serviceMap = new Map(servicesResult.data?.map((s) => [s.id, s]) || []);

  const result = bookingsList.map((booking) => ({
    id: booking.id,
    scheduled_at: booking.scheduled_at,
    duration_minutes: booking.duration_minutes,
    status: booking.status,
    notes: booking.notes ?? null,
    meeting_url: booking.meeting_url,
    meeting_provider: booking.meeting_provider,
    tutor: tutorMap.get(booking.tutor_id) || {
      id: booking.tutor_id,
      username: "",
      full_name: null,
      avatar_url: null,
      tier: null,
    },
    service: serviceMap.get(booking.service_id) || {
      id: booking.service_id,
      name: "Unknown Service",
    },
  }));

  return { bookings: result };
}

/**
 * Type for subscription balance with available lessons
 */
export type SubscriptionBalance = {
  lessonsAvailable: number;
  lessonsUsed: number;
  lessonsAllocated: number;
  lessonsRolledOver: number;
};

/**
 * Combined tutor booking details including services, packages, and subscriptions
 */
export type TutorBookingDetails = {
  tutor: TutorWithDetails;
  packages: StudentPackage[];
  subscription: {
    id: string;
    status: string;
    lessonsAvailable: number;
    lessonsPerMonth: number;
    currentPeriodEnd: string | null;
  } | null;
  existingBookings: { scheduled_at: string; duration_minutes: number; status: string }[];
};

/**
 * Get all booking details for a tutor including services, packages, and subscriptions
 * This is the main function used by the student booking page
 */
export async function getTutorBookingDetails(tutorId: string): Promise<{
  data?: TutorBookingDetails;
  error?: string;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Please log in" };
  }

  // Get tutor details (includes services and availability)
  const tutorResult = await getTutorForBooking(tutorId);
  if (tutorResult.error || !tutorResult.tutor) {
    return { error: tutorResult.error || "Tutor not found" };
  }

  // Get student's packages for this tutor
  const packagesResult = await getStudentPackagesForTutor(tutorId);
  const packages = packagesResult.packages || [];

  // Get student record for subscription lookup
  const adminClient = createServiceRoleClient();
  let subscription: TutorBookingDetails["subscription"] = null;

  if (adminClient) {
    const { data: student } = await adminClient
      .from("students")
      .select("id")
      .eq("user_id", user.id)
      .eq("tutor_id", tutorId)
      .maybeSingle();

    if (student) {
      const subResult = await getStudentSubscription(student.id, tutorId);
      if (subResult.data) {
        const sub = subResult.data;
        const currentPeriod = sub.current_period;
        const lessonsAvailable = currentPeriod
          ? (currentPeriod.lessons_allocated || 0) +
            (currentPeriod.lessons_rolled_over || 0) -
            (currentPeriod.lessons_used || 0)
          : 0;

        subscription = {
          id: sub.id,
          status: sub.status,
          lessonsAvailable,
          lessonsPerMonth: sub.template?.lessons_per_month || 0,
          currentPeriodEnd: sub.current_period_end || null,
        };
      }
    }
  }

  // Get existing bookings for conflict checking
  const bookingsResult = await getTutorBookings(tutorId);
  const existingBookings = bookingsResult.bookings || [];

  return {
    data: {
      tutor: tutorResult.tutor,
      packages,
      subscription,
      existingBookings,
    },
  };
}

/**
 * Grouped time slots by date
 */
export type GroupedSlots = {
  date: string; // ISO date string (YYYY-MM-DD)
  displayDate: string; // Formatted date for display (e.g., "Mon, Dec 16")
  slots: {
    start: string; // ISO datetime string
    end: string; // ISO datetime string
    displayTime: string; // Formatted time (e.g., "2:30 PM")
  }[];
}[];

/**
 * Generate available time slots for a tutor's service
 */
export async function getAvailableSlots(
  tutorId: string,
  serviceDurationMinutes: number,
  daysAhead: number = 14
): Promise<{
  data?: GroupedSlots;
  timezone?: string;
  error?: string;
}> {
  // Get tutor booking details
  const result = await getTutorBookingDetails(tutorId);
  if (result.error || !result.data) {
    return { error: result.error || "Failed to load tutor details" };
  }

  const { tutor, existingBookings } = result.data;
  const timezone = tutor.timezone || "UTC";
  const availability = tutor.availability || [];

  // Generate slots for the next N days
  const slots: GroupedSlots = [];
  const now = new Date();

  for (let dayOffset = 0; dayOffset < daysAhead; dayOffset++) {
    const date = new Date(now);
    date.setDate(date.getDate() + dayOffset);
    const dayOfWeek = date.getDay(); // 0 = Sunday

    // Find availability slots for this day
    const dayAvailability = availability.filter(
      (a) => a.day_of_week === dayOfWeek && a.is_available
    );

    if (dayAvailability.length === 0) continue;

    const dateStr = date.toISOString().split("T")[0];
    const displayDate = date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

    const daySlots: GroupedSlots[number]["slots"] = [];

    for (const avail of dayAvailability) {
      // Parse availability times
      const [startHour, startMin] = avail.start_time.split(":").map(Number);
      const [endHour, endMin] = avail.end_time.split(":").map(Number);

      // Generate slots within this availability window
      let slotStart = new Date(date);
      slotStart.setHours(startHour, startMin, 0, 0);

      const windowEnd = new Date(date);
      windowEnd.setHours(endHour, endMin, 0, 0);

      while (slotStart.getTime() + serviceDurationMinutes * 60 * 1000 <= windowEnd.getTime()) {
        const slotEnd = new Date(slotStart.getTime() + serviceDurationMinutes * 60 * 1000);

        // Check if slot conflicts with existing bookings
        const hasConflict = existingBookings.some((booking) => {
          if (booking.status?.startsWith("cancelled")) {
            return false;
          }
          const bookingStart = new Date(booking.scheduled_at);
          const bookingEnd = new Date(bookingStart.getTime() + booking.duration_minutes * 60 * 1000);

          return (
            (slotStart >= bookingStart && slotStart < bookingEnd) ||
            (slotEnd > bookingStart && slotEnd <= bookingEnd) ||
            (slotStart <= bookingStart && slotEnd >= bookingEnd)
          );
        });

        // Only add future slots without conflicts
        if (!hasConflict && slotStart > now) {
          daySlots.push({
            start: slotStart.toISOString(),
            end: slotEnd.toISOString(),
            displayTime: slotStart.toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            }),
          });
        }

        // Move to next slot (30-minute intervals)
        slotStart = new Date(slotStart.getTime() + 30 * 60 * 1000);
      }
    }

    if (daySlots.length > 0) {
      slots.push({
        date: dateStr,
        displayDate,
        slots: daySlots,
      });
    }
  }

  return { data: slots, timezone };
}

/**
 * Types for aggregated student credits across all tutors
 */
export type StudentPackageCredit = {
  purchaseId: string;
  tutorId: string;
  tutorName: string;
  tutorAvatar: string | null;
  packageName: string;
  remainingMinutes: number;
  totalMinutes: number;
  expiresAt: string | null;
};

export type StudentSubscriptionCredit = {
  subscriptionId: string;
  tutorId: string;
  tutorName: string;
  tutorAvatar: string | null;
  serviceName: string;
  lessonsAvailable: number;
  lessonsPerMonth: number;
  status: string;
  renewsAt: string | null;
};

/**
 * Get all packages and subscriptions for the logged-in student across ALL tutors
 * Used by the My Purchases page
 */
export async function getAllStudentCredits(): Promise<{
  packages?: StudentPackageCredit[];
  subscriptions?: StudentSubscriptionCredit[];
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
  const { data: students, error: studentsError } = await adminClient
    .from("students")
    .select("id, tutor_id")
    .eq("user_id", user.id);

  if (studentsError) {
    console.error("[getAllStudentCredits] Error fetching students:", studentsError);
    return { error: "Failed to load data" };
  }

  if (!students || students.length === 0) {
    return { packages: [], subscriptions: [] };
  }

  const studentIds = students.map((s) => s.id);
  const tutorIds = [...new Set(students.map((s) => s.tutor_id))];

  // Fetch tutor profiles for names and avatars
  const { data: tutors } = await adminClient
    .from("profiles")
    .select("id, full_name, avatar_url")
    .in("id", tutorIds);

  const tutorMap = new Map(
    tutors?.map((t) => [t.id, { name: t.full_name, avatar: t.avatar_url }]) || []
  );

  // Fetch all active packages
  const { data: purchases, error: purchaseError } = await adminClient
    .from("session_package_purchases")
    .select(`
      id,
      student_id,
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
    .in("student_id", studentIds)
    .eq("status", "active")
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

  if (purchaseError) {
    console.error("[getAllStudentCredits] Error fetching packages:", purchaseError);
  }

  const packages: StudentPackageCredit[] = [];

  for (const purchase of purchases || []) {
    const pkgData = purchase.package;
    const pkg = Array.isArray(pkgData)
      ? pkgData[0]
      : (pkgData as {
          id: string;
          name: string;
          total_minutes: number;
          tutor_id: string;
        } | null);

    if (!pkg) continue;

    // Calculate redeemed minutes
    const redemptionsData = purchase.redemptions as Array<{
      minutes_redeemed: number | null;
      refunded_at: string | null;
    }> | null;

    const redeemedMinutes =
      redemptionsData?.reduce(
        (sum, r) => sum + (r.refunded_at === null ? r.minutes_redeemed || 0 : 0),
        0
      ) || 0;

    const remainingMinutes = pkg.total_minutes - redeemedMinutes;

    if (remainingMinutes > 0) {
      const tutorInfo = tutorMap.get(pkg.tutor_id);
      packages.push({
        purchaseId: purchase.id,
        tutorId: pkg.tutor_id,
        tutorName: tutorInfo?.name || "Unknown Tutor",
        tutorAvatar: tutorInfo?.avatar || null,
        packageName: pkg.name,
        remainingMinutes,
        totalMinutes: pkg.total_minutes,
        expiresAt: purchase.expires_at,
      });
    }
  }

  // Fetch all active subscriptions
  const { data: subscriptions, error: subscriptionError } = await adminClient
    .from("lesson_subscriptions")
    .select(`
      id,
      student_id,
      tutor_id,
      status,
      current_period_end,
      template:lesson_subscription_templates (
        lessons_per_month,
        service:services (
          name
        )
      ),
      current_period:lesson_allowance_periods!lesson_allowance_periods_subscription_id_fkey (
        lessons_allocated,
        lessons_rolled_over,
        lessons_used,
        is_current
      )
    `)
    .in("student_id", studentIds)
    .in("status", ["active", "trialing"]);

  if (subscriptionError) {
    console.error("[getAllStudentCredits] Error fetching subscriptions:", subscriptionError);
  }

  const subscriptionCredits: StudentSubscriptionCredit[] = [];

  for (const sub of subscriptions || []) {
    const templateData = sub.template;
    const template = Array.isArray(templateData) ? templateData[0] : templateData;

    if (!template) continue;

    // Find current period
    const periodsData = sub.current_period as Array<{
      lessons_allocated: number;
      lessons_rolled_over: number;
      lessons_used: number;
      is_current: boolean;
    }> | null;

    const currentPeriod = periodsData?.find((p) => p.is_current);

    const lessonsAvailable = currentPeriod
      ? (currentPeriod.lessons_allocated || 0) +
        (currentPeriod.lessons_rolled_over || 0) -
        (currentPeriod.lessons_used || 0)
      : 0;

    const serviceData = template.service;
    const service = Array.isArray(serviceData) ? serviceData[0] : serviceData;

    const tutorInfo = tutorMap.get(sub.tutor_id);

    subscriptionCredits.push({
      subscriptionId: sub.id,
      tutorId: sub.tutor_id,
      tutorName: tutorInfo?.name || "Unknown Tutor",
      tutorAvatar: tutorInfo?.avatar || null,
      serviceName: service?.name || "Lesson Subscription",
      lessonsAvailable,
      lessonsPerMonth: template.lessons_per_month || 0,
      status: sub.status,
      renewsAt: sub.current_period_end,
    });
  }

  return { packages, subscriptions: subscriptionCredits };
}

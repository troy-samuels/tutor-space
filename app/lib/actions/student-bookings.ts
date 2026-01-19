"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { createBookingAndCheckout } from "./bookings";
import { isTableMissing } from "@/lib/utils/supabase-errors";
import { resolveBookingMeetingUrl, tutorHasStudioAccess } from "@/lib/utils/classroom-links";
import { getTutorForBooking, getTutorBookings } from "./student-connections";
import { getStudentSubscription } from "./subscriptions";
import { generateBookableSlots, filterFutureSlots } from "@/lib/utils/slots";
import type { SubscriptionWithDetails } from "@/lib/subscription";
import type {
  StudentPackage,
  TutorBookingDetails,
  GroupedSlots,
  StudentPackageCredit,
  StudentSubscriptionCredit,
  TutorOffering,
} from "@/lib/actions/types";

interface CreateStudentBookingParams {
  tutorId: string;
  serviceId: string;
  scheduledAt: string;
  durationMinutes: number;
  notes: string | null;
  amount: number;
  currency: string;
  packageId?: string; // Optional: Use package instead of payment
  clientMutationId?: string; // Optional: Idempotency key to prevent duplicate bookings
}

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
    clientMutationId: params.clientMutationId,
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
    short_code: string | null;
    tutor: {
      id: string;
      username: string;
      full_name: string | null;
      avatar_url: string | null;
      tier: string | null;
      plan?: string | null;
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
    short_code,
    tutor_id,
    service_id
  `;
  const isMissingColumn = (error: { code?: string; message?: string } | null, column: string) =>
    Boolean(
      error &&
        (error.code === "42703" ||
          (error.message || "").toLowerCase().includes(`column bookings.${column}`))
    );
  // Include lessons that started up to 3 hours ago (to catch in-progress lessons)
  // We'll filter out completed lessons in JS after fetching
  const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
  const buildBookingsQuery = (selectClause: string) =>
    adminClient
      .from("bookings")
      .select(selectClause)
      .in("student_id", studentIds)
      .gte("scheduled_at", threeHoursAgo)
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
    short_code: string | null;
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
      .select("id, username, full_name, avatar_url, tier, plan")
      .in("id", tutorIds),
    adminClient
      .from("services")
      .select("id, name")
      .in("id", serviceIds),
  ]);

  const tutorMap = new Map(tutorsResult.data?.map((t) => [t.id, t]) || []);
  const serviceMap = new Map(servicesResult.data?.map((s) => [s.id, s]) || []);

  const now = Date.now();
  const result = bookingsList
    .filter((booking) => {
      // Keep bookings that haven't ended yet (scheduled_at + duration > now)
      const startTime = new Date(booking.scheduled_at).getTime();
      const endTime = startTime + booking.duration_minutes * 60 * 1000;
      return endTime > now;
    })
    .map((booking) => {
      const tutor = tutorMap.get(booking.tutor_id);
      const tutorHasStudio = tutorHasStudioAccess({
        tier: tutor?.tier ?? null,
        plan: tutor?.plan ?? null,
      });

      return {
        id: booking.id,
        scheduled_at: booking.scheduled_at,
        duration_minutes: booking.duration_minutes,
        status: booking.status,
        notes: booking.notes ?? null,
        meeting_url: resolveBookingMeetingUrl({
          meetingUrl: booking.meeting_url,
          bookingId: booking.id,
          shortCode: booking.short_code,
          tutorHasStudio,
        }),
        meeting_provider: booking.meeting_provider,
        short_code: booking.short_code,
        tutor: tutor || {
          id: booking.tutor_id,
          username: "",
          full_name: null,
          avatar_url: null,
          tier: null,
          plan: null,
        },
        service: serviceMap.get(booking.service_id) || {
          id: booking.service_id,
          name: "Unknown Service",
        },
      };
    });

  return { bookings: result };
}

/**
 * Type for subscription balance with available lessons
 */
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
  const busyWindows = bookingsResult.busyWindows || [];

  return {
    data: {
      tutor: tutorResult.tutor,
      packages,
      subscription,
      existingBookings,
      busyWindows,
    },
  };
}

/**
 * Grouped time slots by date
 */
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
  const busyWindows = result.data.busyWindows || [];
  const timezone = tutor.timezone || "UTC";
  const availability = tutor.availability || [];

  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + daysAhead);

  const bookableSlots = filterFutureSlots(
    generateBookableSlots({
      availability,
      startDate,
      endDate,
      slotDuration: serviceDurationMinutes,
      timezone,
      existingBookings,
      busyWindows,
      bufferMinutes: tutor.buffer_time_minutes ?? 0,
    })
  );

  const groupedMap = new Map<string, GroupedSlots[number]>();
  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: timezone,
  });
  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: timezone,
  });

  for (const slot of bookableSlots) {
    const slotDate = new Date(slot.startISO);
    const dateKey = slotDate.toLocaleDateString("en-CA", { timeZone: timezone });
    let entry = groupedMap.get(dateKey);

    if (!entry) {
      entry = {
        date: dateKey,
        displayDate: dateFormatter.format(slotDate),
        slots: [],
      };
      groupedMap.set(dateKey, entry);
    }

    entry.slots.push({
      start: slot.startISO,
      end: slot.endISO,
      displayTime: timeFormatter.format(slotDate),
    });
  }

  const groupedSlots = Array.from(groupedMap.values()).sort(
    (a, b) => Date.parse(a.date) - Date.parse(b.date)
  );

  for (const group of groupedSlots) {
    group.slots.sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
  }

  return { data: groupedSlots, timezone };
}

/**
 * Types for aggregated student credits across all tutors
 */
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

/**
 * Get connected tutors with their available offerings (packages/subscriptions)
 * Used by My Purchases page to show contextual CTAs
 */
export async function getConnectedTutorOfferings(): Promise<{
  tutors?: TutorOffering[];
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

  // Get approved connections
  const { data: connections, error: connectionError } = await adminClient
    .from("student_tutor_connections")
    .select("tutor_id")
    .eq("student_user_id", user.id)
    .eq("status", "approved");

  // Handle missing table gracefully
  if (isTableMissing(connectionError, "student_tutor_connections")) {
    return { tutors: [] };
  }

  if (connectionError) {
    console.error("[getConnectedTutorOfferings] Error:", connectionError);
    return { error: "Failed to load connections" };
  }

  if (!connections || connections.length === 0) {
    return { tutors: [] };
  }

  const tutorIds = connections.map((c) => c.tutor_id);

  // Fetch tutor profiles
  const { data: tutors } = await adminClient
    .from("profiles")
    .select("id, full_name, avatar_url")
    .in("id", tutorIds);

  // Check for package templates
  const { data: packageTemplates } = await adminClient
    .from("session_package_templates")
    .select("tutor_id")
    .in("tutor_id", tutorIds)
    .eq("is_active", true);

  // Check for subscription-enabled services
  const { data: subscriptionServices } = await adminClient
    .from("services")
    .select("tutor_id")
    .in("tutor_id", tutorIds)
    .eq("subscriptions_enabled", true)
    .eq("is_active", true);

  // Build tutor offerings map
  const packagesSet = new Set(packageTemplates?.map((p) => p.tutor_id) || []);
  const subscriptionsSet = new Set(subscriptionServices?.map((s) => s.tutor_id) || []);

  const offerings: TutorOffering[] = (tutors || []).map((tutor) => ({
    tutorId: tutor.id,
    tutorName: tutor.full_name || "Tutor",
    tutorAvatar: tutor.avatar_url,
    hasPackages: packagesSet.has(tutor.id),
    hasSubscriptions: subscriptionsSet.has(tutor.id),
  }));

  return { tutors: offerings };
}

import type { SupabaseClient } from "@supabase/supabase-js";
import { formatInTimeZone } from "date-fns-tz";
import { isClassroomUrl, resolveBookingMeetingUrl, tutorHasStudioAccess } from "@/lib/utils/classroom-links";
import type { PlatformBillingPlan } from "@/lib/types/payments";
import { isTableMissing } from "@/lib/utils/supabase-errors";

type BookingRow = {
  id: string;
  tutor_id: string;
  scheduled_at: string;
  duration_minutes: number | null;
  timezone: string | null;
  meeting_url: string | null;
  meeting_provider: string | null;
  short_code: string | null;
  students:
    | {
        full_name: string | null;
        email: string | null;
      }
    | Array<{
        full_name: string | null;
        email: string | null;
      }>
    | null;
  services:
    | {
        name: string | null;
        offer_type: string | null;
        duration_minutes?: number | null;
      }
    | Array<{
        name: string | null;
        offer_type: string | null;
        duration_minutes?: number | null;
      }>
    | null;
  tutor:
    | {
        full_name: string | null;
        email: string | null;
        timezone: string | null;
        tier?: string | null;
        plan?: string | null;
        custom_video_name?: string | null;
      }
    | Array<{
        full_name: string | null;
        email: string | null;
        timezone: string | null;
        tier?: string | null;
        plan?: string | null;
        custom_video_name?: string | null;
      }>
    | null;
};

type PackageInfo = {
  name: string | null;
  remainingLessons: number | null;
  totalLessons: number | null;
  remainingMinutes: number | null;
};

type SubscriptionInfo = {
  lessonsRemaining: number | null;
  lessonsPerPeriod: number | null;
  periodEndsAt: string | null;
  cancelAtPeriodEnd: boolean;
  status: string | null;
};

export type BookingCalendarDetails = {
  bookingId: string;
  tutorId: string;
  tutorName: string;
  tutorEmail: string | null;
  studentName: string;
  studentEmail: string | null;
  serviceName: string;
  scheduledAt: string;
  durationMinutes: number;
  timezone: string;
  meetingUrl: string | null;
  meetingProviderLabel: string;
  lessonTypeLabel: string;
  title: string;
  description: string;
  location?: string | null;
  start: string;
  end: string;
  packageInfo: PackageInfo | null;
  subscriptionInfo: SubscriptionInfo | null;
};

function normalizeRecord<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function normalizeBaseUrl(baseUrl?: string | null): string | null {
  if (!baseUrl) return null;
  const trimmed = baseUrl.trim();
  if (!trimmed) return null;
  return trimmed.replace(/\/+$/, "");
}

function toAbsoluteUrl(url: string, baseUrl?: string | null): string {
  if (!baseUrl) return url;
  if (url.startsWith("http")) return url;
  if (url.startsWith("/")) {
    return `${baseUrl}${url}`;
  }
  return url;
}

function getMeetingProviderLabel(
  provider: string | null | undefined,
  meetingUrl: string | null,
  customVideoName?: string | null
): string {
  if (!provider && meetingUrl && isClassroomUrl(meetingUrl)) {
    return "Classroom";
  }
  switch (provider) {
    case "zoom_personal":
      return "Zoom";
    case "google_meet":
      return "Google Meet";
    case "microsoft_teams":
      return "Microsoft Teams";
    case "calendly":
      return "Calendly";
    case "livekit":
      return "Classroom";
    case "custom":
      return customVideoName || "Video Call";
    default:
      return "Video Call";
  }
}

function resolveLessonTypeLabel(params: {
  offerType?: string | null;
  hasPackage: boolean;
  hasSubscription: boolean;
}): "Trial" | "Package" | "Subscription" | "Single" {
  if (params.hasSubscription) return "Subscription";
  if (params.hasPackage) return "Package";
  if (params.offerType === "trial") return "Trial";
  if (params.offerType === "subscription") return "Subscription";
  if (params.offerType === "lesson_block") return "Package";
  return "Single";
}

async function fetchPackageInfo(
  client: SupabaseClient,
  bookingId: string,
  durationMinutes: number
): Promise<PackageInfo | null> {
  const { data, error } = await client
    .from("session_package_redemptions")
    .select(
      `
      refunded_at,
      purchase:session_package_purchases (
        remaining_minutes,
        package:session_package_templates (
          name,
          total_minutes,
          session_count
        )
      )
    `
    )
    .eq("booking_id", bookingId)
    .is("refunded_at", null)
    .maybeSingle();

  if (error) {
    if (isTableMissing(error, "session_package_redemptions")) {
      return null;
    }
    console.warn("[CalendarDetails] Failed to load package redemption", error);
    return null;
  }

  if (!data) return null;

  const purchase = normalizeRecord(data.purchase);
  const template = normalizeRecord(purchase?.package);
  const remainingMinutes =
    typeof purchase?.remaining_minutes === "number" ? purchase.remaining_minutes : null;

  const totalMinutes =
    typeof template?.total_minutes === "number" ? template.total_minutes : null;
  const sessionCount =
    typeof template?.session_count === "number" ? template.session_count : null;

  const remainingLessons =
    remainingMinutes != null && durationMinutes > 0
      ? Math.max(0, Math.floor(remainingMinutes / durationMinutes))
      : null;
  const totalLessons =
    sessionCount != null
      ? sessionCount
      : totalMinutes != null && durationMinutes > 0
        ? Math.max(0, Math.floor(totalMinutes / durationMinutes))
        : null;

  return {
    name: template?.name ?? null,
    remainingLessons,
    totalLessons,
    remainingMinutes,
  };
}

async function fetchSubscriptionInfo(
  client: SupabaseClient,
  bookingId: string
): Promise<SubscriptionInfo | null> {
  const { data: redemption, error } = await client
    .from("lesson_subscription_redemptions")
    .select("period_id, refunded_at")
    .eq("booking_id", bookingId)
    .is("refunded_at", null)
    .maybeSingle();

  if (error) {
    if (isTableMissing(error, "lesson_subscription_redemptions")) {
      return null;
    }
    console.warn("[CalendarDetails] Failed to load subscription redemption", error);
    return null;
  }

  if (!redemption?.period_id) return null;

  const { data: period, error: periodError } = await client
    .from("lesson_allowance_periods")
    .select("subscription_id, lessons_allocated, lessons_rolled_over, lessons_used, period_end")
    .eq("id", redemption.period_id)
    .maybeSingle();

  if (periodError) {
    if (!isTableMissing(periodError, "lesson_allowance_periods")) {
      console.warn("[CalendarDetails] Failed to load subscription period", periodError);
    }
    return null;
  }

  if (!period?.subscription_id) return null;

  const { data: subscription, error: subscriptionError } = await client
    .from("lesson_subscriptions")
    .select(
      `
      status,
      cancel_at_period_end,
      current_period_end,
      template:lesson_subscription_templates (
        lessons_per_month
      )
    `
    )
    .eq("id", period.subscription_id)
    .maybeSingle();

  if (subscriptionError) {
    if (!isTableMissing(subscriptionError, "lesson_subscriptions")) {
      console.warn("[CalendarDetails] Failed to load subscription info", subscriptionError);
    }
  }

  const lessonsAllocated = period.lessons_allocated ?? 0;
  const lessonsRolledOver = period.lessons_rolled_over ?? 0;
  const lessonsUsed = period.lessons_used ?? 0;
  const lessonsRemaining = Math.max(0, lessonsAllocated + lessonsRolledOver - lessonsUsed);
  const lessonsPerPeriod = subscription?.template
    ? normalizeRecord(subscription.template)?.lessons_per_month ?? null
    : null;

  return {
    lessonsRemaining,
    lessonsPerPeriod,
    periodEndsAt: period.period_end ?? subscription?.current_period_end ?? null,
    cancelAtPeriodEnd: subscription?.cancel_at_period_end ?? false,
    status: subscription?.status ?? null,
  };
}

export async function buildBookingCalendarDetails(params: {
  client: SupabaseClient;
  bookingId: string;
  baseUrl?: string | null;
}): Promise<BookingCalendarDetails | null> {
  const { client, bookingId } = params;
  const normalizedBaseUrl = normalizeBaseUrl(
    params.baseUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  );

  const { data, error } = await client
    .from("bookings")
    .select(
      `
      id,
      tutor_id,
      scheduled_at,
      duration_minutes,
      timezone,
      meeting_url,
      meeting_provider,
      short_code,
      students (
        full_name,
        email
      ),
      services (
        name,
        offer_type,
        duration_minutes
      ),
      tutor:profiles!bookings_tutor_id_fkey (
        full_name,
        email,
        timezone,
        tier,
        plan,
        custom_video_name
      )
    `
    )
    .eq("id", bookingId)
    .maybeSingle();

  if (error) {
    console.warn("[CalendarDetails] Failed to load booking", error);
    return null;
  }

  if (!data) return null;

  const booking = data as BookingRow;
  const student = normalizeRecord(booking.students);
  const service = normalizeRecord(booking.services);
  const tutor = normalizeRecord(booking.tutor);
  const durationMinutes =
    booking.duration_minutes ??
    service?.duration_minutes ??
    60;
  const startDate = new Date(booking.scheduled_at);
  if (Number.isNaN(startDate.getTime())) return null;
  const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
  const timezone = booking.timezone ?? tutor?.timezone ?? "UTC";

  const tutorHasStudio = tutorHasStudioAccess({
    tier: tutor?.tier ?? null,
    plan: (tutor?.plan as PlatformBillingPlan | null) ?? null,
  });

  let meetingUrl = resolveBookingMeetingUrl({
    meetingUrl: booking.meeting_url,
    bookingId: booking.id,
    shortCode: booking.short_code,
    baseUrl: normalizedBaseUrl,
    tutorHasStudio,
    allowClassroomFallback: true,
  });

  if (meetingUrl && normalizedBaseUrl) {
    meetingUrl = toAbsoluteUrl(meetingUrl, normalizedBaseUrl);
  }

  const [packageInfo, subscriptionInfo] = await Promise.all([
    fetchPackageInfo(client, booking.id, durationMinutes),
    fetchSubscriptionInfo(client, booking.id),
  ]);

  const lessonTypeLabel = resolveLessonTypeLabel({
    offerType: service?.offer_type ?? null,
    hasPackage: !!packageInfo,
    hasSubscription: !!subscriptionInfo,
  });

  const meetingProviderLabel = getMeetingProviderLabel(
    booking.meeting_provider,
    meetingUrl,
    tutor?.custom_video_name ?? null
  );

  const studentName = student?.full_name ?? "Student";
  const tutorName = tutor?.full_name ?? "Tutor";
  const serviceName = service?.name ?? "Lesson";

  let title = `${serviceName} with ${studentName}`;
  if (lessonTypeLabel === "Trial") {
    title += " (Trial)";
  } else if (lessonTypeLabel === "Package") {
    if (packageInfo?.remainingLessons != null) {
      const totalSuffix =
        packageInfo.totalLessons != null ? `/${packageInfo.totalLessons}` : "";
      title += ` (${packageInfo.remainingLessons}${totalSuffix} left)`;
    } else {
      title += " (Package)";
    }
  } else if (lessonTypeLabel === "Subscription") {
    if (subscriptionInfo?.lessonsRemaining != null) {
      title += ` (${subscriptionInfo.lessonsRemaining} left)`;
    } else {
      title += " (Subscription)";
    }
  }

  const descriptionLines: string[] = [
    "TutorLingua lesson",
    `Service: ${serviceName}`,
    `Tutor: ${tutorName}`,
    `Student: ${studentName}`,
    `Booking ID: ${booking.id}`,
    `Lesson type: ${lessonTypeLabel}`,
  ];

  if (lessonTypeLabel === "Package" && packageInfo) {
    descriptionLines.push(`Package: ${packageInfo.name || "Lesson package"}`);
    if (packageInfo.remainingLessons != null) {
      const totalLabel =
        packageInfo.totalLessons != null ? `/${packageInfo.totalLessons}` : "";
      descriptionLines.push(
        `Remaining lessons: ${packageInfo.remainingLessons}${totalLabel}`
      );
    } else if (packageInfo.remainingMinutes != null) {
      descriptionLines.push(`Remaining minutes: ${packageInfo.remainingMinutes}`);
    }
  }

  if (lessonTypeLabel === "Subscription" && subscriptionInfo) {
    if (subscriptionInfo.lessonsPerPeriod != null) {
      descriptionLines.push(
        `Subscription plan: ${subscriptionInfo.lessonsPerPeriod} lessons/month`
      );
    } else {
      descriptionLines.push("Subscription plan: Lesson subscription");
    }

    if (subscriptionInfo.lessonsRemaining != null) {
      descriptionLines.push(
        `Remaining lessons this period: ${subscriptionInfo.lessonsRemaining}`
      );
    }

    if (subscriptionInfo.periodEndsAt) {
      const periodLabel = subscriptionInfo.cancelAtPeriodEnd
        ? "Subscription ends"
        : "Renews";
      descriptionLines.push(
        `${periodLabel}: ${formatInTimeZone(
          subscriptionInfo.periodEndsAt,
          timezone,
          "MMM d, yyyy"
        )}`
      );
    }
  }

  if (meetingUrl) {
    descriptionLines.push(`Meeting: ${meetingProviderLabel}`);
    descriptionLines.push(`Join link: ${meetingUrl}`);
  } else {
    descriptionLines.push("Meeting: TBD");
  }

  return {
    bookingId: booking.id,
    tutorId: booking.tutor_id,
    tutorName,
    tutorEmail: tutor?.email ?? null,
    studentName,
    studentEmail: student?.email ?? null,
    serviceName,
    scheduledAt: booking.scheduled_at,
    durationMinutes,
    timezone,
    meetingUrl: meetingUrl ?? null,
    meetingProviderLabel,
    lessonTypeLabel,
    title,
    description: descriptionLines.join("\n"),
    location: meetingUrl ?? null,
    start: startDate.toISOString(),
    end: endDate.toISOString(),
    packageInfo: packageInfo ?? null,
    subscriptionInfo: subscriptionInfo ?? null,
  };
}

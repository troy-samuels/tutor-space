import { hasStudioAccess } from "@/lib/payments/subscriptions";
import type { PlatformBillingPlan } from "@/lib/types/payments";

const DEFAULT_PLAN: PlatformBillingPlan = "professional";

function normalizeBaseUrl(baseUrl?: string | null): string | null {
  if (!baseUrl) return null;
  const trimmed = baseUrl.trim();
  if (!trimmed) return null;
  return trimmed.replace(/\/+$/, "");
}

export function tutorHasStudioAccess(tutor: {
  tier?: string | null;
  plan?: string | null;
}): boolean {
  const plan = (tutor.plan as PlatformBillingPlan | null) ?? DEFAULT_PLAN;
  return tutor.tier === "studio" || hasStudioAccess(plan);
}

export function buildClassroomPath(
  bookingId: string,
  shortCode?: string | null
): string {
  return shortCode ? `/c/${shortCode}` : `/classroom/${bookingId}`;
}

export function buildClassroomUrl(
  bookingId: string,
  shortCode?: string | null,
  baseUrl?: string | null
): string {
  const path = buildClassroomPath(bookingId, shortCode);
  const normalizedBase = normalizeBaseUrl(baseUrl);
  if (!normalizedBase) return path;
  return `${normalizedBase}${path}`;
}

export function isClassroomUrl(url?: string | null): boolean {
  if (!url) return false;
  if (url.startsWith("/classroom/") || url.startsWith("/c/")) {
    return true;
  }
  try {
    const parsed = new URL(url);
    return (
      parsed.pathname.startsWith("/classroom/") ||
      parsed.pathname.startsWith("/c/")
    );
  } catch {
    return url.includes("/classroom/") || url.includes("/c/");
  }
}

export function resolveBookingMeetingUrl(params: {
  meetingUrl?: string | null;
  bookingId: string;
  shortCode?: string | null;
  baseUrl?: string | null;
  tutorHasStudio: boolean;
  allowClassroomFallback?: boolean;
}): string | null {
  const {
    meetingUrl,
    bookingId,
    shortCode,
    baseUrl,
    tutorHasStudio,
    allowClassroomFallback = false,
  } = params;

  if (meetingUrl) {
    if (!isClassroomUrl(meetingUrl)) {
      return meetingUrl;
    }
    if (!tutorHasStudio) {
      return null;
    }
    return buildClassroomUrl(bookingId, shortCode, baseUrl);
  }

  if (allowClassroomFallback && tutorHasStudio) {
    return buildClassroomUrl(bookingId, shortCode, baseUrl);
  }

  return null;
}

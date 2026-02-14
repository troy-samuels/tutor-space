import type { SupabaseClient } from "@supabase/supabase-js";
import { hasProAccess } from "@/lib/payments/subscriptions";
import type {
  PlatformBillingPlan,
  StudentPracticeSubscription,
} from "@/lib/types/payments";
import {
  BASIC_AUDIO_ENABLED,
  BASIC_SESSIONS_PER_MONTH,
  BASIC_TEXT_TURNS_PER_SESSION,
  FREE_AUDIO_ENABLED,
  FREE_SESSIONS_PER_MONTH,
  FREE_TEXT_TURNS_PER_SESSION,
  FREE_AUDIO_SECONDS,
  FREE_TEXT_TURNS,
  SOLO_AUDIO_ENABLED,
  SOLO_PRICE_CENTS,
  SOLO_SESSIONS_PER_MONTH,
  SOLO_TEXT_TURNS_PER_SESSION,
  UNLIMITED_ADAPTIVE_ENABLED,
  UNLIMITED_AUDIO_ENABLED,
  UNLIMITED_PRICE_CENTS,
  UNLIMITED_SESSIONS_PER_MONTH,
  UNLIMITED_TEXT_TURNS_PER_SESSION,
  UNLIMITED_VOICE_INPUT_ENABLED,
} from "./constants.ts";

export type StudentPracticeTier = "free" | "basic" | "unlimited" | "solo";

type StudentPracticeAccessGranted = {
  hasAccess: true;
  tier: StudentPracticeTier;
  sessionsPerMonth: number;
  textTurnsPerSession: number;
  audioEnabled: boolean;
  adaptiveEnabled: boolean;
  voiceInputEnabled: boolean;
  tutorName?: string;
  tutorId?: string;
  showUpgradePrompt: boolean;
  upgradePrice: number | null;
  isFreeUser: boolean;
};

type StudentPracticeAccessDenied = {
  hasAccess: false;
  reason: "student_not_found" | "student_lookup_failed";
  message: string;
};

export type StudentPracticeAccessResult =
  | StudentPracticeAccessGranted
  | StudentPracticeAccessDenied;

type TutorProfile = {
  id?: string | null;
  full_name?: string | null;
  tier?: string | null;
  plan?: string | null;
};

type StudentPracticeRow = {
  id?: string;
  tutor_id?: string | null;
  practice_tier?: string | null;
  practice_subscription?: string | null;
  practice_subscription_id?: string | null;
  ai_practice_subscription_id?: string | null;
  ai_practice_block_subscription_item_id?: string | null;
  profiles?: TutorProfile | TutorProfile[] | null;
};

/**
 * Builds the practice subscription key for tutor-scoped usage records.
 *
 * @param tutorId - Tutor UUID.
 * @returns Namespaced subscription key for compatibility with legacy flows.
 */
export function getPracticeSubscriptionKeyForTutor(tutorId: string): string {
  return `practice:${tutorId}`;
}

/**
 * Returns the inclusive UTC monthly period boundaries for the provided date.
 *
 * @param now - Date used to compute the active month.
 * @returns Start and end timestamps for the month.
 */
export function getCurrentPracticePeriod(now: Date = new Date()): {
  periodStart: Date;
  periodEnd: Date;
} {
  const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
  const periodEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0));
  return { periodStart, periodEnd };
}

/**
 * Checks whether a tutor's platform plan includes bundled student practice.
 *
 * @param supabase - Supabase client.
 * @param tutorId - Tutor UUID.
 * @returns `true` when tutor is on a paid Pro/Studio plan.
 */
export async function getTutorHasPracticeAccess(
  supabase: SupabaseClient,
  tutorId: string
): Promise<boolean> {
  const { data: tutorProfile, error } = await supabase
    .from("profiles")
    .select("id, tier, plan")
    .eq("id", tutorId)
    .maybeSingle();

  if (error) {
    console.error("[Practice Access] Failed to load tutor profile:", error);
    return false;
  }

  if (!tutorProfile) return false;

  const plan = (tutorProfile.plan as PlatformBillingPlan | null) ?? "professional";
  return tutorProfile.tier === "studio" || hasProAccess(plan);
}

/**
 * Resolves a student's current practice tier and feature envelope.
 *
 * Access is always available for valid students. Tier determines the limits.
 *
 * @param supabase - Supabase client.
 * @param studentId - Student UUID.
 * @returns Structured tier, limits, feature flags, and upgrade CTA data.
 */
export async function getStudentPracticeAccess(
  supabase: SupabaseClient,
  studentId: string
): Promise<StudentPracticeAccessResult> {
  const { data: student, error } = await supabase
    .from("students")
    .select(
      `
      id,
      tutor_id,
      practice_tier,
      practice_subscription_id,
      ai_practice_subscription_id,
      ai_practice_block_subscription_item_id,
      profiles:tutor_id (
        id,
        full_name,
        tier,
        plan
      )
    `
    )
    .eq("id", studentId)
    .maybeSingle();

  if (error) {
    console.error("[Practice Access] Failed to load student record:", error);
    return {
      hasAccess: false,
      reason: "student_lookup_failed",
      message: "Unable to load student access state",
    };
  }

  if (!student) {
    return {
      hasAccess: false,
      reason: "student_not_found",
      message: "Student not found",
    };
  }

  const typedStudent = student as StudentPracticeRow;
  const tutorProfile = getTutorProfile(typedStudent.profiles);
  const tutorName = tutorProfile?.full_name || "your tutor";
  const subscription = resolveStudentPracticeSubscription(typedStudent);

  if (subscription === "unlimited") {
    return {
      hasAccess: true,
      tier: "unlimited",
      sessionsPerMonth: UNLIMITED_SESSIONS_PER_MONTH,
      textTurnsPerSession: UNLIMITED_TEXT_TURNS_PER_SESSION,
      audioEnabled: UNLIMITED_AUDIO_ENABLED,
      adaptiveEnabled: UNLIMITED_ADAPTIVE_ENABLED,
      voiceInputEnabled: UNLIMITED_VOICE_INPUT_ENABLED,
      tutorName: typedStudent.tutor_id ? tutorName : undefined,
      tutorId: typedStudent.tutor_id ?? undefined,
      showUpgradePrompt: false,
      upgradePrice: null,
      isFreeUser: false,
    };
  }

  if (subscription === "solo") {
    return {
      hasAccess: true,
      tier: "solo",
      sessionsPerMonth: SOLO_SESSIONS_PER_MONTH,
      textTurnsPerSession: SOLO_TEXT_TURNS_PER_SESSION,
      audioEnabled: SOLO_AUDIO_ENABLED,
      adaptiveEnabled: true,
      voiceInputEnabled: true,
      showUpgradePrompt: false,
      upgradePrice: null,
      isFreeUser: false,
    };
  }

  const hasTutor = Boolean(typedStudent.tutor_id);
  const tutorPlan = (tutorProfile?.plan as PlatformBillingPlan | null) ?? "professional";
  const tutorIsPaid = hasTutor && (tutorProfile?.tier === "studio" || hasProAccess(tutorPlan));

  if (tutorIsPaid) {
    return {
      hasAccess: true,
      tier: "basic",
      sessionsPerMonth: BASIC_SESSIONS_PER_MONTH,
      textTurnsPerSession: BASIC_TEXT_TURNS_PER_SESSION,
      audioEnabled: BASIC_AUDIO_ENABLED,
      adaptiveEnabled: false,
      voiceInputEnabled: false,
      tutorName,
      tutorId: typedStudent.tutor_id ?? undefined,
      showUpgradePrompt: true,
      upgradePrice: UNLIMITED_PRICE_CENTS,
      isFreeUser: false,
    };
  }

  return {
    hasAccess: true,
    tier: "free",
    sessionsPerMonth: FREE_SESSIONS_PER_MONTH,
    textTurnsPerSession: FREE_TEXT_TURNS_PER_SESSION,
    audioEnabled: FREE_AUDIO_ENABLED,
    adaptiveEnabled: false,
    voiceInputEnabled: false,
    tutorName: hasTutor ? tutorName : undefined,
    tutorId: hasTutor ? typedStudent.tutor_id ?? undefined : undefined,
    showUpgradePrompt: true,
    upgradePrice: hasTutor ? UNLIMITED_PRICE_CENTS : SOLO_PRICE_CENTS,
    isFreeUser: true,
  };
}

/**
 * Computes legacy resource allowances from historic usage records.
 *
 * This helper remains for backward compatibility while older resources still
 * read free/block allowances.
 *
 * @param usagePeriod - Legacy usage period row.
 * @returns Derived allowance values.
 */
export function calculatePracticeAllowance(usagePeriod: {
  audio_seconds_used: number;
  text_turns_used: number;
  blocks_consumed: number;
  free_audio_seconds?: number;
  free_text_turns?: number;
  is_free_tier?: boolean;
  period_start: string;
  period_end: string;
}): {
  audioSecondsUsed: number;
  audioSecondsAllowance: number;
  audioSecondsRemaining: number;
  textTurnsUsed: number;
  textTurnsAllowance: number;
  textTurnsRemaining: number;
  blocksConsumed: number;
  isFreeUser: boolean;
  periodStart: Date;
  periodEnd: Date;
} {
  const freeAudioSeconds = usagePeriod.free_audio_seconds ?? FREE_AUDIO_SECONDS;
  const freeTextTurns = usagePeriod.free_text_turns ?? FREE_TEXT_TURNS;

  const blockAudioSeconds = 45 * 60;
  const blockTextTurns = 300;
  const audioSecondsAllowance = freeAudioSeconds + usagePeriod.blocks_consumed * blockAudioSeconds;
  const textTurnsAllowance = freeTextTurns + usagePeriod.blocks_consumed * blockTextTurns;

  return {
    audioSecondsUsed: usagePeriod.audio_seconds_used,
    audioSecondsAllowance,
    audioSecondsRemaining: Math.max(
      0,
      audioSecondsAllowance - usagePeriod.audio_seconds_used
    ),
    textTurnsUsed: usagePeriod.text_turns_used,
    textTurnsAllowance,
    textTurnsRemaining: Math.max(
      0,
      textTurnsAllowance - usagePeriod.text_turns_used
    ),
    blocksConsumed: usagePeriod.blocks_consumed,
    isFreeUser: usagePeriod.is_free_tier !== false,
    periodStart: new Date(usagePeriod.period_start),
    periodEnd: new Date(usagePeriod.period_end),
  };
}

/**
 * Checks whether legacy free allowance is exhausted for a resource type.
 *
 * @param allowance - Computed allowance payload.
 * @param resourceType - Resource dimension.
 * @returns `true` when no allowance remains.
 */
export function hasExhaustedFreeAllowance(
  allowance: {
    audioSecondsRemaining: number;
    textTurnsRemaining: number;
  },
  resourceType: "audio" | "text"
): boolean {
  if (resourceType === "audio") {
    return allowance.audioSecondsRemaining <= 0;
  }
  return allowance.textTurnsRemaining <= 0;
}

/**
 * Normalizes the joined tutor profile payload shape from Supabase.
 *
 * @param profileRaw - Joined `profiles:tutor_id` record.
 * @returns Normalized tutor profile object or `null`.
 */
function getTutorProfile(profileRaw: StudentPracticeRow["profiles"]): TutorProfile | null {
  if (!profileRaw) return null;
  return (Array.isArray(profileRaw) ? profileRaw[0] : profileRaw) ?? null;
}

/**
 * Resolves the student's paid practice subscription from current or legacy data.
 *
 * @param student - Student row loaded from Supabase.
 * @returns Paid subscription type when active, otherwise `null`.
 */
function resolveStudentPracticeSubscription(student: StudentPracticeRow): StudentPracticeSubscription {
  const explicitTier = normalizePracticeSubscriptionValue(
    student.practice_subscription ?? student.practice_tier
  );

  if (explicitTier) {
    return explicitTier;
  }

  // Backward compatibility:
  // Legacy base subscription and metered block subscriptions map to Unlimited.
  if (
    student.practice_subscription_id ||
    student.ai_practice_subscription_id ||
    student.ai_practice_block_subscription_item_id
  ) {
    return "unlimited";
  }

  return null;
}

/**
 * Validates and normalizes string subscription values to known tier tokens.
 *
 * @param value - Raw column value from the database.
 * @returns Normalized subscription token or `null`.
 */
function normalizePracticeSubscriptionValue(value: string | null | undefined): StudentPracticeSubscription {
  if (!value) return null;
  if (value === "unlimited" || value === "solo") {
    return value;
  }
  return null;
}

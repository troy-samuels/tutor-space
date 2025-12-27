import type { SupabaseClient } from "@supabase/supabase-js";
import { hasStudioAccess } from "@/lib/payments/subscriptions";
import type { PlatformBillingPlan } from "@/lib/types/payments";
import {
  FREE_AUDIO_SECONDS,
  FREE_TEXT_TURNS,
  BLOCK_AUDIO_SECONDS,
  BLOCK_TEXT_TURNS,
} from "./constants";

export function getPracticeSubscriptionKeyForTutor(tutorId: string): string {
  return `studio:${tutorId}`;
}

export function getCurrentPracticePeriod(now: Date = new Date()): {
  periodStart: Date;
  periodEnd: Date;
} {
  const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
  const periodEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0));
  return { periodStart, periodEnd };
}

export async function getTutorHasPracticeAccess(
  supabase: SupabaseClient,
  tutorId: string
): Promise<boolean> {
  const { data: tutorProfile } = await supabase
    .from("profiles")
    .select("id, tier, plan")
    .eq("id", tutorId)
    .maybeSingle();

  if (!tutorProfile) return false;

  const plan = (tutorProfile.plan as PlatformBillingPlan | null) ?? "professional";
  return tutorProfile.tier === "studio" || hasStudioAccess(plan);
}

// Student practice access result type
export type StudentPracticeAccessResult = {
  hasAccess: boolean;
  reason:
    | "tutor_has_studio"
    | "tutor_no_studio"
    | "no_tutor"
    | "student_not_found";
  tutorName?: string;
  tutorId?: string;
  isFreeUser?: boolean;
};

/**
 * Check if a student can access AI Practice based on their tutor's Studio tier
 * This is the main access gate for the freemium model
 */
export async function getStudentPracticeAccess(
  supabase: SupabaseClient,
  studentId: string
): Promise<StudentPracticeAccessResult> {
  // Get student with tutor info
  const { data: student } = await supabase
    .from("students")
    .select(
      `
      *,
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

  if (!student) {
    return { hasAccess: false, reason: "student_not_found" };
  }

  if (!student.tutor_id) {
    return { hasAccess: false, reason: "no_tutor" };
  }

  const profileRaw = Array.isArray(student.profiles)
    ? student.profiles[0]
    : student.profiles;
  const tutorProfile = profileRaw as {
    full_name?: string | null;
    tier?: string | null;
    plan?: string | null;
  } | null;
  const plan =
    (tutorProfile?.plan as PlatformBillingPlan | null) ?? "professional";
  const hasStudio =
    tutorProfile?.tier === "studio" || hasStudioAccess(plan);

  return {
    hasAccess: hasStudio,
    reason: hasStudio ? "tutor_has_studio" : "tutor_no_studio",
    tutorName: tutorProfile?.full_name || "your tutor",
    tutorId: student.tutor_id,
    isFreeUser: student.ai_practice_free_tier_enabled === true,
  };
}

// Usage allowance result type
export type PracticeAllowanceResult = {
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
};

/**
 * Calculate student's practice allowance including free tier + purchased blocks
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
}): PracticeAllowanceResult {
  // Use period-specific free allowances or defaults
  const freeAudioSeconds = usagePeriod.free_audio_seconds ?? FREE_AUDIO_SECONDS;
  const freeTextTurns = usagePeriod.free_text_turns ?? FREE_TEXT_TURNS;

  // Calculate total allowance (free + blocks)
  const audioSecondsAllowance =
    freeAudioSeconds + usagePeriod.blocks_consumed * BLOCK_AUDIO_SECONDS;
  const textTurnsAllowance =
    freeTextTurns + usagePeriod.blocks_consumed * BLOCK_TEXT_TURNS;

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
 * Check if student has exhausted their free allowance
 */
export function hasExhaustedFreeAllowance(
  allowance: PracticeAllowanceResult,
  resourceType: "audio" | "text"
): boolean {
  if (resourceType === "audio") {
    return allowance.audioSecondsRemaining <= 0;
  }
  return allowance.textTurnsRemaining <= 0;
}

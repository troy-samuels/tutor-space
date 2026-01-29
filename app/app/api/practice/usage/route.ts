import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import {
  FREE_AUDIO_SECONDS,
  FREE_TEXT_TURNS,
  BLOCK_AUDIO_SECONDS,
  BLOCK_TEXT_TURNS,
  AI_PRACTICE_BLOCK_PRICE_CENTS,
} from "@/lib/practice/constants";
import {
  getTutorHasPracticeAccess,
  calculatePracticeAllowance,
  getCurrentPracticePeriod,
} from "@/lib/practice/access";
import { errorResponse } from "@/lib/api/error-responses";

export interface PracticeUsageStats {
  audioSecondsUsed: number;
  audioSecondsAllowance: number;
  textTurnsUsed: number;
  textTurnsAllowance: number;
  blocksConsumed: number;
  currentTierPriceCents: number;
  periodStart: string;
  periodEnd: string;
  percentAudioUsed: number;
  percentTextUsed: number;
  // Freemium model additions
  isFreeUser: boolean;
  audioSecondsRemaining: number;
  textTurnsRemaining: number;
  canBuyBlocks: boolean;
  blockPriceCents: number;
}

/**
 * GET /api/practice/usage
 * Returns current usage and allowance for the authenticated student
 * FREEMIUM MODEL: Works for both free tier and paid block users
 */
export async function GET() {
  const requestId = randomUUID();
  const respondError = (message: string, status: number, code: string, extra?: Record<string, unknown>) =>
    errorResponse(message, { status, code, extra: { requestId, ...extra } });

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return respondError("Unauthorized", 401, "UNAUTHORIZED");
    }

    // Get the student record
    const { data: student } = await supabase
      .from("students")
      .select("*")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (!student) {
      return respondError("Student record not found", 404, "STUDENT_NOT_FOUND");
    }

    const adminClient = createServiceRoleClient();
    if (!adminClient) {
      return respondError("Service unavailable", 503, "SERVICE_UNAVAILABLE");
    }

    // Check tutor tier (freemium access gate)
    if (!student.tutor_id) {
      return respondError("No tutor assigned", 403, "NO_TUTOR");
    }

    const tutorHasStudio = await getTutorHasPracticeAccess(
      adminClient,
      student.tutor_id
    );

    if (!tutorHasStudio) {
      return respondError("AI Practice requires tutor Studio subscription", 403, "TUTOR_NOT_STUDIO");
    }

    // Get or create free usage period
    const { data: usagePeriod, error: periodError } = await adminClient.rpc(
      "get_or_create_free_usage_period",
      {
        p_student_id: student.id,
        p_tutor_id: student.tutor_id,
      }
    );

    if (periodError) {
      console.error("[Practice Usage] Failed to get/create period:", periodError);
      // Return default values if period creation fails
      const { periodStart, periodEnd } = getCurrentPracticePeriod();
      const stats: PracticeUsageStats = {
        audioSecondsUsed: 0,
        audioSecondsAllowance: FREE_AUDIO_SECONDS,
        textTurnsUsed: 0,
        textTurnsAllowance: FREE_TEXT_TURNS,
        blocksConsumed: 0,
        currentTierPriceCents: 0,
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
        percentAudioUsed: 0,
        percentTextUsed: 0,
        isFreeUser: true,
        audioSecondsRemaining: FREE_AUDIO_SECONDS,
        textTurnsRemaining: FREE_TEXT_TURNS,
        canBuyBlocks: false,
        blockPriceCents: AI_PRACTICE_BLOCK_PRICE_CENTS,
      };
      return NextResponse.json(stats);
    }

    // Calculate allowances using the new helper
    const allowance = calculatePracticeAllowance(usagePeriod);

    // Calculate percentages
    const percentAudioUsed = allowance.audioSecondsAllowance > 0
      ? Math.round((allowance.audioSecondsUsed / allowance.audioSecondsAllowance) * 100)
      : 0;
    const percentTextUsed = allowance.textTurnsAllowance > 0
      ? Math.round((allowance.textTurnsUsed / allowance.textTurnsAllowance) * 100)
      : 0;

    const stats: PracticeUsageStats = {
      audioSecondsUsed: allowance.audioSecondsUsed,
      audioSecondsAllowance: allowance.audioSecondsAllowance,
      textTurnsUsed: allowance.textTurnsUsed,
      textTurnsAllowance: allowance.textTurnsAllowance,
      blocksConsumed: allowance.blocksConsumed,
      currentTierPriceCents: allowance.blocksConsumed * AI_PRACTICE_BLOCK_PRICE_CENTS,
      periodStart: allowance.periodStart.toISOString(),
      periodEnd: allowance.periodEnd.toISOString(),
      percentAudioUsed,
      percentTextUsed,
      // Freemium model additions
      isFreeUser: allowance.isFreeUser,
      audioSecondsRemaining: allowance.audioSecondsRemaining,
      textTurnsRemaining: allowance.textTurnsRemaining,
      canBuyBlocks: false,
      blockPriceCents: AI_PRACTICE_BLOCK_PRICE_CENTS,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("[Practice Usage] Error:", error);
    return respondError("Failed to fetch usage stats", 500, "INTERNAL_ERROR");
  }
}

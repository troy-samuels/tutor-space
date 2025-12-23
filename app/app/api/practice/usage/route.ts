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
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the student record
    const { data: student } = await supabase
      .from("students")
      .select("*")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (!student) {
      return NextResponse.json(
        { error: "Student record not found" },
        { status: 404 }
      );
    }

    const adminClient = createServiceRoleClient();
    if (!adminClient) {
      return NextResponse.json(
        { error: "Service unavailable" },
        { status: 503 }
      );
    }

    // Check tutor tier (freemium access gate)
    if (!student.tutor_id) {
      return NextResponse.json(
        { error: "No tutor assigned", code: "NO_TUTOR" },
        { status: 403 }
      );
    }

    const tutorHasStudio = await getTutorHasPracticeAccess(
      adminClient,
      student.tutor_id
    );

    if (!tutorHasStudio) {
      return NextResponse.json(
        {
          error: "AI Practice requires tutor Studio subscription",
          code: "TUTOR_NOT_STUDIO",
        },
        { status: 403 }
      );
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
        canBuyBlocks: true,
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
      canBuyBlocks: true, // Students can always buy more blocks
      blockPriceCents: AI_PRACTICE_BLOCK_PRICE_CENTS,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("[Practice Usage] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch usage stats" },
      { status: 500 }
    );
  }
}

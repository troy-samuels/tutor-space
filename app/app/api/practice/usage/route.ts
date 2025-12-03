import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import {
  BASE_AUDIO_SECONDS,
  BASE_TEXT_TURNS,
  BLOCK_AUDIO_SECONDS,
  BLOCK_TEXT_TURNS,
} from "@/lib/practice/constants";

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
}

/**
 * GET /api/practice/usage
 * Returns current usage and allowance for the authenticated student
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the student record
    const { data: student } = await supabase
      .from("students")
      .select("id, ai_practice_enabled, ai_practice_subscription_id, tutor_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (!student) {
      return NextResponse.json(
        { error: "Student record not found" },
        { status: 404 }
      );
    }

    if (!student.ai_practice_enabled || !student.ai_practice_subscription_id) {
      return NextResponse.json(
        { error: "AI Practice subscription not active" },
        { status: 403 }
      );
    }

    const adminClient = createServiceRoleClient();
    if (!adminClient) {
      return NextResponse.json(
        { error: "Service unavailable" },
        { status: 503 }
      );
    }

    // Get subscription period from Stripe
    let periodStart: Date;
    let periodEnd: Date;

    try {
      const subscription = await stripe.subscriptions.retrieve(
        student.ai_practice_subscription_id
      ) as any;
      periodStart = new Date(subscription.current_period_start * 1000);
      periodEnd = new Date(subscription.current_period_end * 1000);
    } catch (err) {
      console.error("[Practice Usage] Stripe subscription lookup failed:", err);
      // Fall back to stored period end
      periodEnd = new Date();
      periodStart = new Date(periodEnd);
      periodStart.setDate(periodStart.getDate() - 30);
    }

    // Get current usage period
    const { data: usagePeriod } = await adminClient
      .from("practice_usage_periods")
      .select("*")
      .eq("student_id", student.id)
      .eq("subscription_id", student.ai_practice_subscription_id)
      .gte("period_end", new Date().toISOString())
      .lte("period_start", new Date().toISOString())
      .maybeSingle();

    // If no usage period exists, return default (fresh) values
    if (!usagePeriod) {
      const stats: PracticeUsageStats = {
        audioSecondsUsed: 0,
        audioSecondsAllowance: BASE_AUDIO_SECONDS,
        textTurnsUsed: 0,
        textTurnsAllowance: BASE_TEXT_TURNS,
        blocksConsumed: 0,
        currentTierPriceCents: 800,
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
        percentAudioUsed: 0,
        percentTextUsed: 0,
      };

      return NextResponse.json(stats);
    }

    // Calculate allowances based on blocks consumed
    const audioAllowance = BASE_AUDIO_SECONDS + (usagePeriod.blocks_consumed * BLOCK_AUDIO_SECONDS);
    const textAllowance = BASE_TEXT_TURNS + (usagePeriod.blocks_consumed * BLOCK_TEXT_TURNS);

    // Calculate percentages
    const percentAudioUsed = Math.round((usagePeriod.audio_seconds_used / audioAllowance) * 100);
    const percentTextUsed = Math.round((usagePeriod.text_turns_used / textAllowance) * 100);

    const stats: PracticeUsageStats = {
      audioSecondsUsed: usagePeriod.audio_seconds_used,
      audioSecondsAllowance: audioAllowance,
      textTurnsUsed: usagePeriod.text_turns_used,
      textTurnsAllowance: textAllowance,
      blocksConsumed: usagePeriod.blocks_consumed,
      currentTierPriceCents: usagePeriod.current_tier_price_cents,
      periodStart: usagePeriod.period_start,
      periodEnd: usagePeriod.period_end,
      percentAudioUsed,
      percentTextUsed,
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

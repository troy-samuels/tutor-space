"use server";

import { createClient } from "@/lib/supabase/server";
import type { DemandSlot, PeakTimeRecommendation } from "@/lib/actions/types";

export async function getDemandHeatmap(
  daysBack: number = 90
): Promise<{ data: DemandSlot[] | null; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { data: null, error: "Authentication required" };
  }

  const { data, error } = await supabase.rpc("get_booking_demand_heatmap", {
    p_tutor_id: user.id,
    p_days_back: daysBack,
  });

  if (error) {
    console.error("[AnalyticsDemand] Failed to get heatmap", error);
    return { data: null, error: "Failed to fetch demand data" };
  }

  return {
    data: (data || []).map((item: {
      day_of_week: number;
      hour_of_day: number;
      booking_count: number;
      demand_level: string;
    }) => ({
      dayOfWeek: item.day_of_week,
      hourOfDay: item.hour_of_day,
      bookingCount: Number(item.booking_count),
      demandLevel: item.demand_level as DemandSlot["demandLevel"],
    })),
  };
}

export async function getPeakTimeRecommendations(): Promise<{
  recommendations: PeakTimeRecommendation[];
  error?: string;
}> {
  const result = await getDemandHeatmap(90);

  if (result.error || !result.data) {
    return { recommendations: [], error: result.error };
  }

  const recommendations: PeakTimeRecommendation[] = [];

  // Find peak times
  const peakSlots = result.data.filter(
    (d) => d.demandLevel === "very_high" || d.demandLevel === "high"
  );

  peakSlots.forEach((slot) => {
    recommendations.push({
      dayOfWeek: slot.dayOfWeek,
      hourOfDay: slot.hourOfDay,
      demandLevel: slot.demandLevel,
      recommendation:
        slot.demandLevel === "very_high"
          ? "Consider premium pricing for this popular time slot"
          : "This is a high-demand slot - ensure you have availability",
    });
  });

  // Find gaps that could be filled
  const lowSlots = result.data
    .filter((d) => d.demandLevel === "none" || d.demandLevel === "low")
    .filter((d) => d.hourOfDay >= 9 && d.hourOfDay <= 20); // Reasonable hours only

  if (lowSlots.length > 5) {
    // Just add a general recommendation
    recommendations.push({
      dayOfWeek: -1, // Indicates general recommendation
      hourOfDay: -1,
      demandLevel: "low",
      recommendation: `You have ${lowSlots.length} time slots with low demand. Consider offering discounts or promotions to fill these gaps.`,
    });
  }

  return { recommendations };
}

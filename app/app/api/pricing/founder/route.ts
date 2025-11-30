import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import {
  computeFounderPrice,
  getFounderOfferLimit,
  getFounderPlanName,
} from "@/lib/pricing/founder";

export async function GET(request: NextRequest) {
  try {
    const limit = getFounderOfferLimit();
    const price = computeFounderPrice(request.headers.get("accept-language"));
    const supabase = createServiceRoleClient();
    const planName = getFounderPlanName();

    let remaining = limit;

    if (supabase) {
      const { count, error } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("plan", planName);

      if (error) {
        console.error("[Founder pricing] count error", error);
      }

      if (typeof count === "number") {
        remaining = Math.max(limit - count, 0);
      }
    }

    return NextResponse.json({
      remaining,
      limit,
      price,
    });
  } catch (error) {
    console.error("[Founder pricing] unexpected error", error);
    return NextResponse.json(
      {
        remaining: null,
        limit: getFounderOfferLimit(),
        price: computeFounderPrice(),
      },
      { status: 200 }
    );
  }
}

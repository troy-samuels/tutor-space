import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { errorResponse } from "@/lib/api/error-responses";
import type { RecapSummary, RecapExercise } from "@/lib/recap/types";

type RouteParams = {
  params: Promise<{ shortId: string }>;
};

export async function GET(request: Request, { params }: RouteParams) {
  const requestId = randomUUID();
  const { shortId } = await params;

  try {
    const adminClient = createServiceRoleClient();
    if (!adminClient) {
      return errorResponse("Service unavailable", {
        status: 503,
        code: "service_unavailable",
        extra: { requestId },
      });
    }

    const { data: recap, error } = await adminClient
      .from("recaps")
      .select("id, short_id, summary, exercises, created_at")
      .eq("short_id", shortId)
      .single();

    if (error) {
      // Distinguish "not found" from actual DB errors
      if (error.code === "PGRST116" || error.details?.includes("0 rows")) {
        return errorResponse("Recap not found", {
          status: 404,
          code: "not_found",
          extra: { requestId },
        });
      }
      console.error("[Recap Fetch] DB error:", error);
      return errorResponse("Failed to fetch recap", {
        status: 500,
        code: "internal_error",
        extra: { requestId },
      });
    }

    if (!recap) {
      return errorResponse("Recap not found", {
        status: 404,
        code: "not_found",
        extra: { requestId },
      });
    }

    return NextResponse.json({
      success: true,
      recap: {
        id: recap.id,
        shortId: recap.short_id,
        summary: recap.summary as unknown as RecapSummary,
        exercises: recap.exercises as unknown as RecapExercise[],
        createdAt: recap.created_at,
      },
      requestId,
    });
  } catch (error) {
    console.error("[Recap Fetch] Error:", error);
    return errorResponse("Failed to fetch recap", {
      status: 500,
      code: "internal_error",
      extra: { requestId },
    });
  }
}

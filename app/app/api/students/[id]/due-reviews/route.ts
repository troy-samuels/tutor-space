import { NextRequest, NextResponse } from "next/server";
import { getDueItems, getReviewStats, getMasteryByType } from "@/lib/spaced-repetition/scheduler";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/students/[id]/due-reviews
 *
 * Get spaced repetition items due for review.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: studentId } = await params;
    const { searchParams } = new URL(request.url);

    const tutorId = searchParams.get("tutorId") || undefined;
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const includeStats = searchParams.get("includeStats") === "true";
    const includeMastery = searchParams.get("includeMastery") === "true";

    if (!studentId) {
      return NextResponse.json(
        { error: "Student ID is required" },
        { status: 400 }
      );
    }

    // Get due items
    const dueItems = await getDueItems(studentId, limit, tutorId);

    // Optionally include statistics
    let stats = null;
    if (includeStats) {
      stats = await getReviewStats(studentId, tutorId);
    }

    // Optionally include mastery breakdown
    let masteryByType = null;
    if (includeMastery) {
      masteryByType = await getMasteryByType(studentId, tutorId);
    }

    return NextResponse.json({
      success: true,
      data: {
        dueItems,
        count: dueItems.length,
        stats,
        masteryByType,
      },
    });
  } catch (error) {
    console.error("[Due Reviews] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch due reviews" },
      { status: 500 }
    );
  }
}

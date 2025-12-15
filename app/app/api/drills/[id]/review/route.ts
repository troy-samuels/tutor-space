import { NextRequest, NextResponse } from "next/server";
import { recordReview, type QualityRating } from "@/lib/spaced-repetition/scheduler";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/drills/[id]/review
 *
 * Record a review result for a spaced repetition item.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: itemId } = await params;
    const body = await request.json();

    const { quality, responseTimeMs } = body;

    if (!itemId) {
      return NextResponse.json(
        { error: "Item ID is required" },
        { status: 400 }
      );
    }

    // Validate quality rating (0-5)
    if (quality === undefined || quality === null) {
      return NextResponse.json(
        { error: "quality rating is required (0-5)" },
        { status: 400 }
      );
    }

    const qualityNum = parseInt(String(quality), 10);
    if (isNaN(qualityNum) || qualityNum < 0 || qualityNum > 5) {
      return NextResponse.json(
        { error: "quality must be an integer from 0 to 5" },
        { status: 400 }
      );
    }

    // Validate response time if provided
    let responseTime: number | undefined;
    if (responseTimeMs !== undefined) {
      responseTime = parseInt(String(responseTimeMs), 10);
      if (isNaN(responseTime) || responseTime < 0) {
        return NextResponse.json(
          { error: "responseTimeMs must be a positive integer" },
          { status: 400 }
        );
      }
    }

    // Record the review
    const result = await recordReview(itemId, qualityNum as QualityRating, responseTime);

    return NextResponse.json({
      success: true,
      data: {
        itemId: result.itemId,
        nextReviewDate: result.sm2Result.nextReviewDate.toISOString(),
        newInterval: result.sm2Result.interval,
        newEaseFactor: result.sm2Result.easeFactor,
        repetitions: result.sm2Result.repetitions,
        wasCorrect: result.sm2Result.wasCorrect,
        previousInterval: result.previousInterval,
        previousEaseFactor: result.previousEaseFactor,
      },
    });
  } catch (error) {
    console.error("[Review Recording] Error:", error);

    // Check if it's a "not found" error
    if ((error as Error).message?.includes("not found")) {
      return NextResponse.json(
        { error: "Review item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to record review" },
      { status: 500 }
    );
  }
}

/**
 * Quality ratings explanation:
 *
 * 0 - Complete blackout: No memory of the item at all
 * 1 - Incorrect: Wrong answer, but recognized correct answer when shown
 * 2 - Incorrect with hint: Wrong, but correct answer seemed easy once revealed
 * 3 - Correct with difficulty: Correct answer but required significant thought
 * 4 - Correct with hesitation: Correct answer after brief hesitation
 * 5 - Perfect: Immediate correct answer with no hesitation
 *
 * Responses of 3-5 are considered "correct" and will advance the item in the schedule.
 * Responses of 0-2 are considered "incorrect" and will reset the item to the beginning.
 */

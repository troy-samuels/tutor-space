import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { errorResponse } from "@/lib/api/error-responses";

// UUID v4 format validation
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * GET /api/recap/student-progress?fp={fingerprint}
 *
 * Returns cumulative SRS stats for a recap student, used on the
 * enhanced results screen to show their learning journey.
 *
 * No auth required — students access this with their own fingerprint.
 * Fingerprints are random UUIDs so enumeration risk is minimal.
 *
 * TODO: Add lightweight rate limiting (e.g. Upstash Redis) to prevent abuse.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fingerprint = searchParams.get("fp");

  if (!fingerprint) {
    return errorResponse("Missing fingerprint parameter", {
      status: 400,
      code: "invalid_request",
    });
  }

  // Validate fingerprint format (must be a UUID v4)
  if (!UUID_RE.test(fingerprint)) {
    return errorResponse("Invalid fingerprint format", {
      status: 400,
      code: "invalid_request",
    });
  }

  const srsStudentId = `fp:${fingerprint}`;

  try {
    const supabase = createServiceRoleClient();
    if (!supabase) {
      return errorResponse("Service unavailable", {
        status: 503,
        code: "service_unavailable",
      });
    }

    // Parallel fetch: SRS items + recap attempts
    const [srsResult, attemptsResult] = await Promise.all([
      supabase
        .from("spaced_repetition_items")
        .select(
          "item_type, total_reviews, correct_count, incorrect_count, interval_days, repetition_count, ease_factor, last_review_at"
        )
        .eq("student_id", srsStudentId),

      supabase
        .from("recap_attempts")
        .select("completed_at, score, total")
        .eq("student_fingerprint", fingerprint)
        .order("completed_at", { ascending: false }),
    ]);

    const items = srsResult.data ?? [];
    const attempts = attemptsResult.data ?? [];

    // Mastery by exercise type
    const masteryByType: Record<
      string,
      { correct: number; total: number; rate: number }
    > = {};

    let totalCorrect = 0;
    let totalReviews = 0;
    const reviewDates: string[] = [];

    for (const item of items) {
      totalCorrect += item.correct_count;
      totalReviews += item.total_reviews;

      if (item.last_review_at) {
        reviewDates.push(item.last_review_at);
      }

      const type = item.item_type;
      if (!masteryByType[type]) {
        masteryByType[type] = { correct: 0, total: 0, rate: 0 };
      }
      masteryByType[type].correct += item.correct_count;
      masteryByType[type].total += item.total_reviews;
    }

    // Calculate rates
    for (const type of Object.keys(masteryByType)) {
      const entry = masteryByType[type];
      entry.rate =
        entry.total > 0 ? Math.round((entry.correct / entry.total) * 100) / 100 : 0;
    }

    // Items due for review (low ease factor or upcoming review)
    const dueForReview = items.filter(
      (i) => i.ease_factor < 2.0 || i.repetition_count < 3
    ).length;

    // Struggling vs improving items
    const strugglingItems = items
      .filter((i) => {
        const rate = i.total_reviews > 0 ? i.correct_count / i.total_reviews : 0;
        return rate < 0.5 && i.total_reviews >= 2;
      })
      .map((i) => i.item_type);

    const improvingItems = items
      .filter((i) => {
        const rate = i.total_reviews > 0 ? i.correct_count / i.total_reviews : 0;
        return rate >= 0.7 && i.total_reviews >= 2;
      })
      .map((i) => i.item_type);

    // Calculate streak from attempt dates
    const streakDays = calculateAttemptStreak(
      attempts.map((a) => a.completed_at).filter(Boolean) as string[]
    );

    return NextResponse.json({
      totalRecaps: attempts.length,
      totalExercises: totalReviews,
      overallCorrectRate:
        totalReviews > 0
          ? Math.round((totalCorrect / totalReviews) * 100) / 100
          : 0,
      streakDays,
      masteryByType,
      dueForReview,
      improvingItems: [...new Set(improvingItems)],
      strugglingItems: [...new Set(strugglingItems)],
    });
  } catch (err) {
    console.error("[Student Progress API] Error:", err);
    return errorResponse("Internal error", {
      status: 500,
      code: "internal_error",
    });
  }
}

/**
 * Calculate streak from attempt completion dates.
 */
function calculateAttemptStreak(dates: string[]): number {
  if (dates.length === 0) return 0;

  // Normalise to day-level timestamps
  const daySet = new Set(
    dates.map((d) => {
      const dt = new Date(d);
      dt.setHours(0, 0, 0, 0);
      return dt.getTime();
    })
  );

  const sortedDays = [...daySet].sort((a, b) => b - a); // Most recent first

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayMs = today.getTime();
  const oneDayMs = 24 * 60 * 60 * 1000;

  // Must have practised today or yesterday
  if (sortedDays[0] !== todayMs && sortedDays[0] !== todayMs - oneDayMs) {
    return 0;
  }

  let streak = 1;
  let current = sortedDays[0];

  for (let i = 1; i < sortedDays.length; i++) {
    if (sortedDays[i] === current - oneDayMs) {
      streak++;
      current = sortedDays[i];
    } else {
      break;
    }
  }

  return streak;
}

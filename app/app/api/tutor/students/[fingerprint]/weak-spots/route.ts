import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { errorResponse } from "@/lib/api/error-responses";

type RouteParams = {
  params: Promise<{ fingerprint: string }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  const { fingerprint } = await params;
  const srsStudentId = `fp:${fingerprint}`;

  try {
    const supabase = createServiceRoleClient();
    if (!supabase) {
      return errorResponse("Service unavailable", {
        status: 503,
        code: "service_unavailable",
      });
    }

    // Fetch all SRS items for this student
    const { data: items, error } = await supabase
      .from("spaced_repetition_items")
      .select(
        "item_key, item_type, item_content, ease_factor, interval_days, repetition_count, total_reviews, correct_count, incorrect_count, last_review_at, next_review_at"
      )
      .eq("student_id", srsStudentId)
      .gt("total_reviews", 0)
      .order("ease_factor", { ascending: true });

    if (error) {
      console.error("[Weak Spots API] Query failed:", error);
      return errorResponse("Failed to fetch weak spots", {
        status: 500,
        code: "internal_error",
      });
    }

    if (!items || items.length === 0) {
      return NextResponse.json({
        student: {
          fingerprint,
          totalItems: 0,
          totalReviews: 0,
          overallCorrectRate: 0,
        },
        weakSpots: [],
        strongItems: [],
      });
    }

    // Aggregate by category
    const byCategory: Record<
      string,
      Array<{
        concept: string;
        correctRate: number;
        totalAttempts: number;
        lastAttempt: string;
        masteryStatus: string;
        easeFactor: number;
      }>
    > = {};

    let totalCorrect = 0;
    let totalReviews = 0;

    for (const item of items) {
      const category = item.item_type;
      const content = item.item_content as Record<string, unknown>;
      const correctRate =
        item.total_reviews > 0
          ? item.correct_count / item.total_reviews
          : 0;

      totalCorrect += item.correct_count;
      totalReviews += item.total_reviews;

      const masteryStatus =
        item.repetition_count === 0
          ? "new"
          : item.interval_days < 7
            ? "learning"
            : item.interval_days >= 30
              ? "mastered"
              : "reviewing";

      const concept =
        (content.targetVocab as string) ??
        (content.answer as string) ??
        (content.question as string) ??
        item.item_key;

      if (!byCategory[category]) {
        byCategory[category] = [];
      }

      byCategory[category].push({
        concept,
        correctRate: Math.round(correctRate * 100) / 100,
        totalAttempts: item.total_reviews,
        lastAttempt: item.last_review_at,
        masteryStatus,
        easeFactor: item.ease_factor,
      });
    }

    // Separate weak and strong items
    const weakSpots = Object.entries(byCategory)
      .map(([category, categoryItems]) => ({
        category,
        items: categoryItems
          .filter((i) => i.correctRate < 0.6)
          .sort((a, b) => a.correctRate - b.correctRate),
        averageCorrectRate:
          Math.round(
            (categoryItems.reduce((sum, i) => sum + i.correctRate, 0) /
              categoryItems.length) *
              100
          ) / 100,
      }))
      .filter((c) => c.items.length > 0);

    const strongItems = items
      .filter((item) => {
        const correctRate =
          item.total_reviews > 0
            ? item.correct_count / item.total_reviews
            : 0;
        return correctRate >= 0.8 && item.total_reviews >= 2;
      })
      .map((item) => {
        const content = item.item_content as Record<string, unknown>;
        return {
          concept:
            (content.targetVocab as string) ??
            (content.answer as string) ??
            item.item_key,
          correctRate: Math.round((item.correct_count / item.total_reviews) * 100) / 100,
          totalAttempts: item.total_reviews,
        };
      });

    return NextResponse.json({
      student: {
        fingerprint,
        totalItems: items.length,
        totalReviews,
        overallCorrectRate:
          totalReviews > 0
            ? Math.round((totalCorrect / totalReviews) * 100) / 100
            : 0,
      },
      weakSpots,
      strongItems,
    });
  } catch (err) {
    console.error("[Weak Spots API] Error:", err);
    return errorResponse("Internal error", {
      status: 500,
      code: "internal_error",
    });
  }
}

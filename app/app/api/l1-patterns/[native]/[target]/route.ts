import { NextRequest, NextResponse } from "next/server";
import { getL1PatternsForPair, getLanguageName } from "@/lib/analysis/l1-interference";

interface RouteParams {
  params: Promise<{ native: string; target: string }>;
}

/**
 * GET /api/l1-patterns/[native]/[target]
 *
 * Get L1 interference patterns for a specific language pair.
 *
 * Example: /api/l1-patterns/ja/en - Japanese speakers learning English
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { native: nativeLanguage, target: targetLanguage } = await params;

    if (!nativeLanguage || !targetLanguage) {
      return NextResponse.json(
        { error: "Both native and target language codes are required" },
        { status: 400 }
      );
    }

    // Get patterns for this language pair
    const patterns = await getL1PatternsForPair(nativeLanguage, targetLanguage);

    // Get language names for display
    const nativeName = getLanguageName(nativeLanguage);
    const targetName = getLanguageName(targetLanguage);

    return NextResponse.json({
      success: true,
      data: {
        nativeLanguage,
        nativeLanguageName: nativeName,
        targetLanguage,
        targetLanguageName: targetName,
        patternCount: patterns.length,
        patterns: patterns.map((p) => ({
          id: p.id,
          patternType: p.patternType,
          patternName: p.patternName,
          description: p.description,
          frequencyRank: p.frequencyRank,
          difficultyToCorrect: p.difficultyToCorrect,
          exampleErrors: p.exampleErrors,
          explanationTemplate: p.explanationTemplate,
        })),
      },
    });
  } catch (error) {
    console.error("[L1 Patterns] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch L1 interference patterns" },
      { status: 500 }
    );
  }
}

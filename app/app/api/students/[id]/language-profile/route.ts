import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/students/[id]/language-profile
 *
 * Get student's language profile including dialect preferences and L1 interference patterns.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: studentId } = await params;
    const { searchParams } = new URL(request.url);
    const targetLanguage = searchParams.get("targetLanguage");

    if (!studentId) {
      return NextResponse.json(
        { error: "Student ID is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let query = supabase
      .from("student_language_profiles")
      .select("*")
      .eq("student_id", studentId);

    if (targetLanguage) {
      query = query.eq("target_language", targetLanguage);
    }

    const { data, error } = await query.order("lessons_analyzed", { ascending: false });

    if (error) {
      console.error("[Language Profile] Error:", error);
      if (error.code === "42501") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      return NextResponse.json(
        { error: "Failed to fetch language profile" },
        { status: 500 }
      );
    }

    // If requesting specific language, return single profile
    if (targetLanguage) {
      return NextResponse.json({
        success: true,
        data: data?.[0] || null,
      });
    }

    // Return all profiles for this student
    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error("[Language Profile] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/students/[id]/language-profile
 *
 * Update student's language profile.
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: studentId } = await params;
    const body = await request.json();

    const {
      targetLanguage,
      nativeLanguage,
      dialectVariant,
      formalityPreference,
      vocabularyStyle,
      speakingPace,
      fillerWordsUsed,
    } = body;

    if (!studentId) {
      return NextResponse.json(
        { error: "Student ID is required" },
        { status: 400 }
      );
    }

    if (!targetLanguage) {
      return NextResponse.json(
        { error: "targetLanguage is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Validate formality preference
    const validFormality = ["formal", "neutral", "informal"];
    if (formalityPreference && !validFormality.includes(formalityPreference)) {
      return NextResponse.json(
        { error: "Invalid formality preference" },
        { status: 400 }
      );
    }

    // Validate speaking pace
    const validPace = ["slow", "moderate", "fast"];
    if (speakingPace && !validPace.includes(speakingPace)) {
      return NextResponse.json(
        { error: "Invalid speaking pace" },
        { status: 400 }
      );
    }

    // Upsert the language profile
    const updateData: Record<string, unknown> = {
      student_id: studentId,
      target_language: targetLanguage,
      last_updated_at: new Date().toISOString(),
    };

    if (nativeLanguage !== undefined) updateData.native_language = nativeLanguage;
    if (dialectVariant !== undefined) updateData.dialect_variant = dialectVariant;
    if (formalityPreference !== undefined) updateData.formality_preference = formalityPreference;
    if (vocabularyStyle !== undefined) updateData.vocabulary_style = vocabularyStyle;
    if (speakingPace !== undefined) updateData.speaking_pace = speakingPace;
    if (fillerWordsUsed !== undefined) updateData.filler_words_used = fillerWordsUsed;

    const { data, error } = await supabase
      .from("student_language_profiles")
      .upsert(updateData, {
        onConflict: "student_id,target_language",
      })
      .select()
      .single();

    if (error) {
      console.error("[Language Profile] Error:", error);
      if (error.code === "42501") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      return NextResponse.json(
        { error: "Failed to update language profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("[Language Profile] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

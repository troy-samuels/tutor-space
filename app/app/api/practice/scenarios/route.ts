import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: scenarios, error } = await supabase
      .from("practice_scenarios")
      .select("*")
      .eq("tutor_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch scenarios" },
        { status: 500 }
      );
    }

    return NextResponse.json({ scenarios });
  } catch (error) {
    console.error("[Scenarios GET] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      language,
      level,
      topic,
      system_prompt,
      vocabulary_focus,
      grammar_focus,
      max_messages,
    } = body;

    if (!title || !system_prompt) {
      return NextResponse.json(
        { error: "Title and system prompt are required" },
        { status: 400 }
      );
    }

    const { data: scenario, error } = await supabase
      .from("practice_scenarios")
      .insert({
        tutor_id: user.id,
        title: title.trim(),
        description: description || null,
        language: language || "English",
        level: level || null,
        topic: topic || null,
        system_prompt: system_prompt.trim(),
        vocabulary_focus: vocabulary_focus || [],
        grammar_focus: grammar_focus || [],
        max_messages: max_messages || 20,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error("[Scenarios POST] Error:", error);
      return NextResponse.json(
        { error: "Failed to create scenario" },
        { status: 500 }
      );
    }

    return NextResponse.json({ scenario });
  } catch (error) {
    console.error("[Scenarios POST] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

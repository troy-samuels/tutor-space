import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ scenarioId: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { scenarioId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: scenario, error } = await supabase
      .from("practice_scenarios")
      .select("*")
      .eq("id", scenarioId)
      .eq("tutor_id", user.id)
      .single();

    if (error || !scenario) {
      return NextResponse.json(
        { error: "Scenario not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ scenario });
  } catch (error) {
    console.error("[Scenario GET] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { scenarioId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const allowedFields = [
      "title",
      "description",
      "language",
      "level",
      "topic",
      "system_prompt",
      "vocabulary_focus",
      "grammar_focus",
      "max_messages",
      "is_active",
    ];

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    const { data: scenario, error } = await supabase
      .from("practice_scenarios")
      .update(updates)
      .eq("id", scenarioId)
      .eq("tutor_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("[Scenario PATCH] Error:", error);
      return NextResponse.json(
        { error: "Failed to update scenario" },
        { status: 500 }
      );
    }

    return NextResponse.json({ scenario });
  } catch (error) {
    console.error("[Scenario PATCH] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { scenarioId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from("practice_scenarios")
      .delete()
      .eq("id", scenarioId)
      .eq("tutor_id", user.id);

    if (error) {
      console.error("[Scenario DELETE] Error:", error);
      return NextResponse.json(
        { error: "Failed to delete scenario" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Scenario DELETE] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

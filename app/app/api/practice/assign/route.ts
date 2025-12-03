import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { studentId, title, instructions, scenarioId, dueDate } = await request.json();

    if (!studentId || !title) {
      return NextResponse.json(
        { error: "Student ID and title are required" },
        { status: 400 }
      );
    }

    // Verify tutor owns this student
    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("id, tutor_id")
      .eq("id", studentId)
      .eq("tutor_id", user.id)
      .single();

    if (studentError || !student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    // If scenarioId provided, verify it belongs to this tutor
    if (scenarioId) {
      const { data: scenario, error: scenarioError } = await supabase
        .from("practice_scenarios")
        .select("id")
        .eq("id", scenarioId)
        .eq("tutor_id", user.id)
        .single();

      if (scenarioError || !scenario) {
        return NextResponse.json(
          { error: "Scenario not found" },
          { status: 404 }
        );
      }
    }

    // Create the assignment
    const { data: assignment, error: assignError } = await supabase
      .from("practice_assignments")
      .insert({
        tutor_id: user.id,
        student_id: studentId,
        scenario_id: scenarioId || null,
        title: title.trim(),
        instructions: instructions || null,
        due_date: dueDate || null,
        status: "assigned",
      })
      .select(`
        id,
        title,
        instructions,
        status,
        due_date,
        sessions_completed,
        created_at,
        scenario:practice_scenarios (
          id,
          title,
          language,
          level,
          topic
        )
      `)
      .single();

    if (assignError) {
      console.error("[Assign Practice] Error:", assignError);
      return NextResponse.json(
        { error: "Failed to create assignment" },
        { status: 500 }
      );
    }

    return NextResponse.json({ assignment });
  } catch (error) {
    console.error("[Assign Practice] Error:", error);
    return NextResponse.json(
      { error: "Failed to assign practice" },
      { status: 500 }
    );
  }
}

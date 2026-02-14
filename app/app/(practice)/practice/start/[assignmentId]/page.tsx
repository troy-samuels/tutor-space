import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
// Types for the resolved assignment data this page needs
import { setServerAttributionCookie } from "@/lib/practice/attribution";
import PracticeApp from "../../PracticeApp";

type PageProps = {
  params: Promise<{
    assignmentId: string;
  }>;
};

type AssignmentTutorRow = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
};

/**
 * Loads tutor profile metadata for an assigned practice link.
 *
 * @param assignmentId - Practice assignment ID.
 * @returns Tutor profile for attribution and UI.
 */
async function loadAssignmentTutor(assignmentId: string): Promise<AssignmentTutorRow | null> {
  const adminClient = createServiceRoleClient();
  if (!adminClient) {
    return null;
  }

  const { data: assignment } = await adminClient
    .from("practice_assignments")
    .select("tutor_id")
    .eq("id", assignmentId)
    .limit(1)
    .maybeSingle();

  if (!assignment?.tutor_id) {
    return null;
  }

  const { data: tutorProfile } = await adminClient
    .from("profiles")
    .select("id, username, full_name, avatar_url")
    .eq("id", assignment.tutor_id)
    .limit(1)
    .maybeSingle();

  if (!tutorProfile?.id) {
    return null;
  }

  return tutorProfile as AssignmentTutorRow;
}

export default async function PracticeStartPage({ params }: PageProps) {
  const { assignmentId } = await params;
  const adminClient = createServiceRoleClient();

  if (!adminClient) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let studentId: string | null = null;
  if (user?.id) {
    const { data: student } = await adminClient
      .from("students")
      .select("id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();
    studentId = student?.id ?? null;
  }

  // Resolve the assignment with scenario data for exercise context
  const { data: assignmentRow } = await adminClient
    .from("practice_assignments")
    .select(`
      id, tutor_id, title,
      scenario:practice_scenarios (
        language, level, topic,
        vocabulary_focus, grammar_focus
      )
    `)
    .eq("id", assignmentId)
    .limit(1)
    .maybeSingle();

  type ScenarioRow = {
    language: string | null;
    level: string | null;
    topic: string | null;
    vocabulary_focus: string[] | null;
    grammar_focus: string[] | null;
  };

  const scenario = assignmentRow?.scenario
    ? (Array.isArray(assignmentRow.scenario)
        ? (assignmentRow.scenario as ScenarioRow[])[0]
        : assignmentRow.scenario as ScenarioRow)
    : null;

  const exerciseContext = scenario
    ? {
        language: scenario.language || "Spanish",
        level: scenario.level || "Intermediate",
        topic: scenario.topic || assignmentRow?.title || "Practice",
        vocabularyFocus: scenario.vocabulary_focus || [],
        grammarFocus: scenario.grammar_focus || [],
      }
    : null;

  const unifiedAssignment = assignmentRow
    ? {
        id: assignmentRow.id,
        title: assignmentRow.title as string | null,
        exerciseContext,
      }
    : null;

  if (!unifiedAssignment) {
    notFound();
  }

  const tutor = await loadAssignmentTutor(assignmentId);
  if (tutor?.id && tutor.username) {
    await setServerAttributionCookie({
      tutorId: tutor.id,
      tutorUsername: tutor.username,
      source: "practice_assignment",
    });
  }

  const tutorName = tutor?.full_name || tutor?.username || "Your tutor";
  const topic = unifiedAssignment.exerciseContext?.topic || unifiedAssignment.title;

  return (
    <div className="min-h-[100dvh]">
      <div className="border-b border-white/[0.1] bg-white/[0.04] px-5 py-4 backdrop-blur-xl">
        <p className="text-xs uppercase tracking-[0.08em] text-[#D5C7BC]">Assigned practice</p>
        <h1 className="mt-1 text-base font-semibold text-foreground">
          {tutorName} wants you to practice {topic}. Let&apos;s go.
        </h1>
      </div>
      <PracticeApp
        assignmentId={unifiedAssignment.id}
        initialExerciseContext={unifiedAssignment.exerciseContext}
        initialLanguageCode={unifiedAssignment.exerciseContext?.language}
        initialScreen={unifiedAssignment.exerciseContext ? "practice" : "language-picker"}
        tutorDisplayName={tutorName}
      />
    </div>
  );
}

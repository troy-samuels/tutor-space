import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { StudentPortalLayout } from "@/components/student-auth/StudentPortalLayout";
import { PracticeSessionClient } from "./PracticeSessionClient";

export const metadata = {
  title: "AI Practice | TutorLingua",
  description: "Practice your language skills with AI",
};

interface PageProps {
  params: Promise<{ assignmentId: string }>;
}

export default async function PracticeSessionPage({ params }: PageProps) {
  const { assignmentId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/student-auth/login");
  }

  const adminClient = createServiceRoleClient();
  if (!adminClient) {
    notFound();
  }

  // Get student record
  const { data: student } = await adminClient
    .from("students")
    .select("id, tutor_id, ai_practice_enabled, ai_practice_current_period_end")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!student) {
    redirect("/student-auth/progress");
  }

  // Check subscription
  const isSubscribed = student.ai_practice_enabled === true &&
    (!student.ai_practice_current_period_end ||
      new Date(student.ai_practice_current_period_end) > new Date());

  if (!isSubscribed) {
    redirect(`/student-auth/practice/subscribe?student=${student.id}`);
  }

  // Get assignment
  const { data: assignment } = await adminClient
    .from("practice_assignments")
    .select(`
      id,
      title,
      instructions,
      status,
      scenario:practice_scenarios (
        id,
        title,
        language,
        level,
        topic,
        system_prompt,
        vocabulary_focus,
        grammar_focus,
        max_messages
      )
    `)
    .eq("id", assignmentId)
    .eq("student_id", student.id)
    .single();

  if (!assignment) {
    notFound();
  }

  // Get or create active session for this assignment
  let { data: session } = await adminClient
    .from("student_practice_sessions")
    .select("id, message_count, started_at, ended_at")
    .eq("assignment_id", assignmentId)
    .is("ended_at", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // If no active session, create one
  if (!session) {
    const scenario = assignment.scenario as any;
    const { data: newSession, error } = await adminClient
      .from("student_practice_sessions")
      .insert({
        student_id: student.id,
        tutor_id: student.tutor_id,
        assignment_id: assignmentId,
        scenario_id: scenario?.id || null,
        language: scenario?.language || "English",
        level: scenario?.level || null,
        topic: scenario?.topic || null,
      })
      .select("id, message_count, started_at, ended_at")
      .single();

    if (error) {
      console.error("[Practice Session] Failed to create session:", error);
      notFound();
    }

    session = newSession;

    // Update assignment status to in_progress
    await adminClient
      .from("practice_assignments")
      .update({ status: "in_progress" })
      .eq("id", assignmentId);
  }

  // Get existing messages
  const { data: messages } = await adminClient
    .from("student_practice_messages")
    .select("id, role, content, corrections, vocabulary_used, created_at")
    .eq("session_id", session.id)
    .order("created_at", { ascending: true });

  const scenario = assignment.scenario as any;

  return (
    <StudentPortalLayout studentName={user.email} hideNav>
      <div className="h-[calc(100vh-64px)]">
        <PracticeSessionClient
          sessionId={session.id}
          assignmentId={assignment.id}
          assignmentTitle={assignment.title}
          language={scenario?.language || "English"}
          level={scenario?.level}
          topic={scenario?.topic}
          systemPrompt={scenario?.system_prompt}
          maxMessages={scenario?.max_messages || 20}
          initialMessages={(messages || []).map((m: any) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            corrections: m.corrections,
            vocabulary_used: m.vocabulary_used,
            created_at: m.created_at,
          }))}
        />
      </div>
    </StudentPortalLayout>
  );
}

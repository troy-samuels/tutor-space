import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { StudentPortalLayout } from "@/components/student-auth/StudentPortalLayout";
import { PracticeSessionClient } from "./PracticeSessionClient";
import type { PracticeUsage } from "@/lib/actions/progress";
import { getStudentSubscriptionSummary } from "@/lib/actions/subscriptions";
import { getStudentPracticeAccess } from "@/lib/practice/access";
import { getStudentAvatarUrl } from "@/lib/actions/student-avatar";

export const metadata = {
  title: "Practice | TutorLingua",
  description: "Practice your language skills",
};

interface PageProps {
  params: Promise<{ assignmentId: string }>;
}

export default async function PracticeSessionPage({ params }: PageProps) {
  const { assignmentId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/student/login");
  }

  const adminClient = createServiceRoleClient();
  if (!adminClient) {
    notFound();
  }

  // Get student record
  const { data: student } = await adminClient
    .from("students")
    .select("*")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!student) {
    redirect("/student/progress");
  }

  const studentName = student.full_name || (user.user_metadata?.full_name as string | undefined) || null;

  const practiceAccess = await getStudentPracticeAccess(adminClient, student.id);
  if (!practiceAccess.hasAccess) {
    redirect("/student/progress");
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

  // Check for existing active session (don't create one - let client handle via mode selection)
  const { data: session } = await adminClient
    .from("student_practice_sessions")
    .select("id, mode, message_count, started_at, ended_at")
    .eq("assignment_id", assignmentId)
    .is("ended_at", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Get existing messages if session exists
  let messages: any[] = [];
  if (session) {
    const { data: existingMessages } = await adminClient
      .from("student_practice_messages")
      .select("id, role, content, corrections, vocabulary_used, created_at")
      .eq("session_id", session.id)
      .order("created_at", { ascending: true });
    messages = existingMessages || [];
  }

  const initialUsage: PracticeUsage | null = null;

  const scenario = assignment.scenario as any;
  const [{ data: subscriptionSummary }, avatarUrl] = await Promise.all([
    getStudentSubscriptionSummary(),
    getStudentAvatarUrl(),
  ]);

  return (
    <StudentPortalLayout studentName={studentName} avatarUrl={avatarUrl} hideNav subscriptionSummary={subscriptionSummary}>
      <div className="h-[calc(100vh-64px)]">
        <PracticeSessionClient
          sessionId={session?.id || null}
          sessionMode={session?.mode as "text" | "audio" | null}
          assignmentId={assignment.id}
          assignmentTitle={assignment.title}
          language={scenario?.language || "English"}
          level={scenario?.level}
          topic={scenario?.topic}
          systemPrompt={scenario?.system_prompt}
          maxMessages={scenario?.max_messages || 20}
          initialUsage={initialUsage}
          initialMessages={messages.map((m: any) => ({
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

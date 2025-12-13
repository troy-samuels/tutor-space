import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { StudentPortalLayout } from "@/components/student-auth/StudentPortalLayout";
import { PracticeSessionClient } from "./PracticeSessionClient";
import type { PracticeUsage } from "@/lib/actions/progress";
import {
  AI_PRACTICE_BASE_PRICE_CENTS,
  BASE_AUDIO_SECONDS,
  BASE_TEXT_TURNS,
  BLOCK_AUDIO_SECONDS,
  BLOCK_TEXT_TURNS,
} from "@/lib/practice/constants";
import { getStudentSubscriptionSummary } from "@/lib/actions/lesson-subscriptions";

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
    .select("id, tutor_id, ai_practice_enabled, ai_practice_current_period_end, ai_practice_subscription_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!student) {
    redirect("/student/progress");
  }

  // Check subscription
  const isSubscribed = student.ai_practice_enabled === true &&
    (!student.ai_practice_current_period_end ||
      new Date(student.ai_practice_current_period_end) > new Date());

  if (!isSubscribed) {
    redirect(`/student/practice/subscribe?student=${student.id}`);
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

  // Get current usage period
  let initialUsage: PracticeUsage | null = null;
  if (student.ai_practice_subscription_id) {
    const { data: usagePeriod } = await adminClient
      .from("practice_usage_periods")
      .select("*")
      .eq("student_id", student.id)
      .eq("subscription_id", student.ai_practice_subscription_id)
      .gte("period_end", new Date().toISOString())
      .lte("period_start", new Date().toISOString())
      .maybeSingle();

    if (usagePeriod) {
      const audioAllowance = BASE_AUDIO_SECONDS + (usagePeriod.blocks_consumed * BLOCK_AUDIO_SECONDS);
      const textAllowance = BASE_TEXT_TURNS + (usagePeriod.blocks_consumed * BLOCK_TEXT_TURNS);

      initialUsage = {
        audioSecondsUsed: usagePeriod.audio_seconds_used,
        audioSecondsAllowance: audioAllowance,
        textTurnsUsed: usagePeriod.text_turns_used,
        textTurnsAllowance: textAllowance,
        blocksConsumed: usagePeriod.blocks_consumed,
        currentTierPriceCents: usagePeriod.current_tier_price_cents,
        periodEnd: usagePeriod.period_end,
        percentAudioUsed: Math.round((usagePeriod.audio_seconds_used / audioAllowance) * 100),
        percentTextUsed: Math.round((usagePeriod.text_turns_used / textAllowance) * 100),
      };
    } else {
      // Fresh usage period (default)
      initialUsage = {
        audioSecondsUsed: 0,
        audioSecondsAllowance: BASE_AUDIO_SECONDS,
        textTurnsUsed: 0,
        textTurnsAllowance: BASE_TEXT_TURNS,
        blocksConsumed: 0,
        currentTierPriceCents: AI_PRACTICE_BASE_PRICE_CENTS,
        periodEnd: student.ai_practice_current_period_end,
        percentAudioUsed: 0,
        percentTextUsed: 0,
      };
    }
  }

  const scenario = assignment.scenario as any;
  const { data: subscriptionSummary } = await getStudentSubscriptionSummary();

  return (
    <StudentPortalLayout studentName={user.email} hideNav subscriptionSummary={subscriptionSummary}>
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
          initialUsage={initialUsage}
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

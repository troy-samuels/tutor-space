import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StudentPortalLayout } from "@/components/student-auth/StudentPortalLayout";
import { StudentRealtimeMessagesContainer } from "@/components/messaging/StudentRealtimeMessagesContainer";
import { MessageSquare, Search } from "lucide-react";
import type { ConversationMessage } from "@/lib/actions/messaging";
import { getStudentSubscriptionSummary } from "@/lib/actions/lesson-subscriptions";
import { getStudentAvatarUrl } from "@/lib/actions/student-avatar";

type PageProps = {
  searchParams: Promise<{ thread?: string }>;
};

export default async function StudentMessagesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/student/login?redirect=/student/messages");
  }

  // Get all student records for this user (across all tutors)
  const { data: students } = await supabase
    .from("students")
    .select("id, full_name, tutor_id, connection_status")
    .eq("user_id", user.id);

  const studentIds = students?.map((s) => s.id) || [];
  const studentName = students?.[0]?.full_name || user.user_metadata?.full_name || null;

  const connectionStatuses = Object.fromEntries(
    students?.map((s) => [s.id, s.connection_status]) || []
  ) as Record<string, string | null>;

  // Fetch subscription summary and avatar in parallel
  const [{ data: subscriptionSummary }, studentAvatarUrl] = await Promise.all([
    getStudentSubscriptionSummary(),
    getStudentAvatarUrl(),
  ]);

  // If no student records, show empty state
  if (studentIds.length === 0) {
    return (
      <StudentPortalLayout studentName={studentName} avatarUrl={studentAvatarUrl} subscriptionSummary={subscriptionSummary}>
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
          <MessageSquare className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h2 className="text-xl font-semibold text-foreground">No Messages Yet</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">
            Connect with tutors and book lessons to start messaging them.
          </p>
          <Link
            href="/student/search"
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition"
          >
            <Search className="h-4 w-4" />
            Find Tutors
          </Link>
        </div>
      </StudentPortalLayout>
    );
  }

  // Get all conversation threads for this student
  const { data: threads } = await supabase
    .from("conversation_threads")
    .select(
      `
      id,
      tutor_id,
      student_id,
      last_message_preview,
      last_message_at,
      student_unread,
      profiles:tutor_id (
        full_name,
        username,
        avatar_url
      )
    `
    )
    .in("student_id", studentIds)
    .order("last_message_at", { ascending: false });

  const threadList = threads ?? [];
  const activeThreadId =
    params?.thread && threadList.some((thread) => thread.id === params.thread)
      ? params.thread
      : threadList[0]?.id;

  let messages: ConversationMessage[] = [];

  if (activeThreadId) {
    const { data: messageRows } = await supabase
      .from("conversation_messages")
      .select("id, thread_id, sender_role, body, attachments, created_at")
      .eq("thread_id", activeThreadId)
      .order("created_at", { ascending: true });

    messages = (messageRows as ConversationMessage[] | null) ?? [];

    await supabase
      .from("conversation_messages")
      .update({ read_by_student: true })
      .eq("thread_id", activeThreadId)
      .eq("read_by_student", false);

    await supabase
      .from("conversation_threads")
      .update({ student_unread: false })
      .eq("id", activeThreadId);
  }

  return (
    <StudentPortalLayout studentName={studentName} avatarUrl={studentAvatarUrl} subscriptionSummary={subscriptionSummary}>
      <StudentRealtimeMessagesContainer
        studentIds={studentIds}
        connectionStatuses={connectionStatuses}
        initialThreads={threadList}
        initialMessages={messages}
        initialActiveThreadId={activeThreadId ?? null}
        studentAvatarUrl={studentAvatarUrl}
      />
    </StudentPortalLayout>
  );
}

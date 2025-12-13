import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RealtimeMessagesContainer } from "@/components/messaging/RealtimeMessagesContainer";
import type { ConversationThread, ConversationMessage } from "@/lib/actions/messaging";

type PageProps = {
  searchParams: Promise<{ thread?: string }>;
};

export default async function TutorMessagesPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/messages");
  }

  const params = (await searchParams) ?? {};

  // Fetch tutor's avatar
  const { data: tutorProfile } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", user.id)
    .single();

  const { data: threads } = await supabase
    .from("conversation_threads")
    .select(
      `
      id,
      tutor_id,
      student_id,
      last_message_preview,
      last_message_at,
      tutor_unread,
      students (
        full_name,
        email,
        status
      )
    `
    )
    .eq("tutor_id", user!.id)
    .order("last_message_at", { ascending: false });

  const threadList = (threads as ConversationThread[] | null) ?? [];
  const activeThreadId =
    params.thread && threadList.some((thread) => thread.id === params.thread)
      ? params.thread
      : threadList[0]?.id ?? null;

  let messages: ConversationMessage[] = [];

  if (activeThreadId) {
    const { data: messageRows } = await supabase
      .from("conversation_messages")
      .select("id, thread_id, sender_role, body, attachments, created_at")
      .eq("thread_id", activeThreadId)
      .order("created_at", { ascending: true });

    messages = (messageRows as ConversationMessage[] | null) ?? [];

    // Mark messages as read
    await supabase
      .from("conversation_messages")
      .update({ read_by_tutor: true })
      .eq("thread_id", activeThreadId)
      .eq("read_by_tutor", false);

    await supabase
      .from("conversation_threads")
      .update({ tutor_unread: false })
      .eq("id", activeThreadId);
  }

  return (
    <RealtimeMessagesContainer
      tutorId={user.id}
      tutorAvatarUrl={tutorProfile?.avatar_url}
      initialThreads={threadList}
      initialMessages={messages}
      initialActiveThreadId={activeThreadId}
    />
  );
}

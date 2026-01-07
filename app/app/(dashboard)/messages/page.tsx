import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RealtimeMessagesContainer } from "@/components/messaging/RealtimeMessagesContainer";
import type { ConversationThread, ConversationMessage } from "@/lib/actions/messaging";
import {
  getTutorProfileAvatar,
  listMessagesForThread,
  listThreadsForTutor,
  markMessagesReadByTutor,
  markThreadReadByTutor,
} from "@/lib/repositories/messaging";

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
  const { data: tutorProfile } = await getTutorProfileAvatar(supabase, user.id);

  const { data: threads } = await listThreadsForTutor(supabase, user!.id);

  const threadList = (threads as ConversationThread[] | null) ?? [];
  const activeThreadId =
    params.thread && threadList.some((thread) => thread.id === params.thread)
      ? params.thread
      : threadList[0]?.id ?? null;

  let messages: ConversationMessage[] = [];

  if (activeThreadId) {
    const { data: messageRows } = await listMessagesForThread(supabase, activeThreadId);

    messages = (messageRows as ConversationMessage[] | null) ?? [];

    // Mark messages as read
    await markMessagesReadByTutor(supabase, activeThreadId);
    await markThreadReadByTutor(supabase, activeThreadId);
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

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MessageComposer } from "@/components/messaging/message-composer";
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

  const { data: threads } = await supabase
    .from("conversation_threads")
    .select(
      `
      id,
      tutor_id,
      student_id,
      last_message_preview,
      last_message_at,
      unread_for_tutor,
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
      : threadList[0]?.id;

  let messages: ConversationMessage[] = [];

  if (activeThreadId) {
    const { data: messageRows } = await supabase
      .from("conversation_messages")
      .select("id, thread_id, sender_role, body, created_at")
      .eq("thread_id", activeThreadId)
      .order("created_at", { ascending: true });

    messages = (messageRows as ConversationMessage[] | null) ?? [];

    await supabase
      .from("conversation_messages")
      .update({ read_by_tutor: true })
      .eq("thread_id", activeThreadId)
      .eq("read_by_tutor", false);

    await supabase
      .from("conversation_threads")
      .update({ unread_for_tutor: false })
      .eq("id", activeThreadId);
  }

  const activeThread = threadList.find((thread) => thread.id === activeThreadId);

  return (
    <div className="grid gap-6 lg:grid-cols-[280px,1fr]">
      <aside className="rounded-3xl border border-border bg-white/70 p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">Conversations</p>
          <Link href="/students" className="text-xs font-semibold text-primary hover:underline">
            Start new
          </Link>
        </div>
        <div className="space-y-2">
          {threadList.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No conversations yet. Add a student to start messaging.
            </p>
          ) : (
            threadList.map((thread) => {
              const isActive = thread.id === activeThreadId;
              return (
                <Link
                  key={thread.id}
                  href={isActive ? "/messages" : `/messages?thread=${thread.id}`}
                  className={`block rounded-2xl border px-3 py-3 text-sm transition ${
                    isActive
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-foreground">
                      {thread.students?.full_name ?? "Unnamed student"}
                    </p>
                    {thread.unread_for_tutor ? (
                      <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {thread.last_message_preview ?? "No messages yet"}
                  </p>
                </Link>
              );
            })
          )}
        </div>
      </aside>

      <section className="flex min-h-[540px] flex-col rounded-3xl border border-border bg-white/90 p-6 shadow-sm">
        {!activeThread ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <p className="text-lg font-semibold text-foreground">No conversation selected</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Pick a student on the left or invite a new one from the Students tab.
            </p>
          </div>
        ) : (
          <>
            <header className="border-b border-border/60 pb-4">
              <p className="text-lg font-semibold text-foreground">
                {activeThread.students?.full_name ?? "Student"}
              </p>
              <p className="text-xs text-muted-foreground">
                {activeThread.students?.email ?? "No email on file"}
              </p>
            </header>

            <div className="flex flex-1 flex-col gap-3 overflow-y-auto py-6">
              {messages.length === 0 ? (
                <div className="mt-10 text-center text-sm text-muted-foreground">
                  No messages yet. Send the first hello!
                </div>
              ) : (
                messages.map((message) => {
                  const isTutor = message.sender_role === "tutor";
                  const senderLabel = isTutor
                    ? "You"
                    : activeThread?.students?.full_name ?? "Student";
                  return (
                    <div key={message.id} className={`flex ${isTutor ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                          isTutor
                            ? "rounded-br-none bg-primary text-primary-foreground"
                            : "rounded-bl-none bg-muted/60 text-foreground"
                        }`}
                      >
                        <p
                          className={`mb-1 text-[11px] font-semibold ${
                            isTutor ? "text-primary-foreground/80" : "text-muted-foreground/90"
                          }`}
                        >
                          {senderLabel}
                        </p>
                        <p className="whitespace-pre-line">{message.body}</p>
                        <p
                          className={`mt-1 text-[10px] uppercase tracking-wide ${
                            isTutor ? "text-primary-foreground/70" : "text-muted-foreground/70"
                          }`}
                        >
                          {new Date(message.created_at).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <MessageComposer
              threadId={activeThread.id}
              placeholder={`Message ${activeThread.students?.full_name ?? "your student"}...`}
            />
          </>
        )}
      </section>
    </div>
  );
}

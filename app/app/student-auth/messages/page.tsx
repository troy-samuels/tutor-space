import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MessageComposer } from "@/components/messaging/message-composer";
import type { ConversationMessage } from "@/lib/actions/messaging";

type PageProps = {
  searchParams?: { thread?: string };
};

export default async function StudentMessagesPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/student-auth/login?redirect=/student-auth/messages");
  }

  const { data: student } = await supabase
    .from("students")
    .select("id, full_name, tutor_id, profiles:tutor_id(full_name)")
    .eq("user_id", user!.id)
    .maybeSingle();

  if (!student) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center text-center">
        <p className="text-xl font-semibold text-foreground">No student profile found</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Ask your tutor to approve your access request before messaging them here.
        </p>
        <Link
          href="/student-auth/request-access"
          className="mt-4 rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground"
        >
          Request access
        </Link>
      </div>
    );
  }

  const { data: threads } = await supabase
    .from("conversation_threads")
    .select(
      `
      id,
      tutor_id,
      student_id,
      last_message_preview,
      last_message_at,
      unread_for_student,
      profiles:tutor_id (
        full_name
      )
    `
    )
    .eq("student_id", student.id)
    .order("last_message_at", { ascending: false });

  const threadList = threads ?? [];
  const activeThreadId =
    searchParams?.thread && threadList.some((thread) => thread.id === searchParams.thread)
      ? searchParams.thread
      : threadList[0]?.id;

  let messages: ConversationMessage[] = [];
  const activeThread = threadList.find((thread) => thread.id === activeThreadId);

  if (activeThreadId) {
    const { data: messageRows } = await supabase
      .from("conversation_messages")
      .select("id, thread_id, sender_role, body, created_at")
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
      .update({ unread_for_student: false })
      .eq("id", activeThreadId);
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-6 rounded-3xl border border-border bg-white/80 p-6 shadow-sm lg:grid-cols-[260px,1fr]">
      <aside>
        <p className="text-sm font-semibold text-foreground">Your tutor</p>
        <div className="mt-3 space-y-2">
          {threadList.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No conversations yet. Book a lesson to connect with your tutor.
            </p>
          ) : (
            threadList.map((thread) => {
              const isActive = thread.id === activeThreadId;
              return (
                <Link
                  key={thread.id}
                  href={
                    isActive
                      ? "/student-auth/messages"
                      : `/student-auth/messages?thread=${thread.id}`
                  }
                  className={`block rounded-2xl border px-3 py-3 text-sm transition ${
                    isActive
                      ? "border-brand-brown bg-brand-brown/10"
                      : "border-border hover:border-brand-brown/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-foreground">
                      {thread.profiles?.full_name ?? "Tutor"}
                    </p>
                    {thread.unread_for_student ? (
                      <span className="h-2.5 w-2.5 rounded-full bg-brand-brown" />
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

      <section className="flex flex-col rounded-3xl border border-border/80 bg-white p-5 shadow-sm">
        {!activeThread ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <p className="text-lg font-semibold text-foreground">No conversation selected</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Once your tutor messages you, the conversation will appear here.
            </p>
          </div>
        ) : (
          <>
            <header className="border-b border-border/70 pb-4">
              <p className="text-lg font-semibold text-foreground">
                {activeThread.profiles?.full_name ?? "Your tutor"}
              </p>
              <p className="text-xs text-muted-foreground">Stay in touch between lessons.</p>
            </header>

            <div className="flex flex-1 flex-col gap-3 overflow-y-auto py-6">
              {messages.length === 0 ? (
                <div className="mt-10 text-center text-sm text-muted-foreground">
                  No messages yet. Say hello!
                </div>
              ) : (
                messages.map((message) => {
                  const isStudent = message.sender_role === "student";
                  return (
                    <div key={message.id} className={`flex ${isStudent ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                          isStudent
                            ? "rounded-br-none bg-brand-brown text-white"
                            : "rounded-bl-none bg-muted/60 text-foreground"
                        }`}
                      >
                        <p className="whitespace-pre-line">{message.body}</p>
                        <p
                          className={`mt-1 text-[10px] uppercase tracking-wide ${
                            isStudent ? "text-white/70" : "text-muted-foreground/70"
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
              placeholder={`Message ${activeThread.profiles?.full_name ?? "your tutor"}...`}
            />
          </>
        )}
      </section>
    </div>
  );
}

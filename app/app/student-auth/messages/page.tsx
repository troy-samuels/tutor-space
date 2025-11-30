import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StudentPortalLayout } from "@/components/student-auth/StudentPortalLayout";
import { MessageComposer } from "@/components/messaging/message-composer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Search } from "lucide-react";
import type { ConversationMessage } from "@/lib/actions/messaging";

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
    redirect("/student-auth/login?redirect=/student-auth/messages");
  }

  // Get all student records for this user (across all tutors)
  const { data: students } = await supabase
    .from("students")
    .select("id, full_name, tutor_id")
    .eq("user_id", user.id);

  const studentIds = students?.map((s) => s.id) || [];
  const studentName = students?.[0]?.full_name || user.user_metadata?.full_name || null;

  // If no student records, show empty state
  if (studentIds.length === 0) {
    return (
      <StudentPortalLayout studentName={studentName}>
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
          <MessageSquare className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h2 className="text-xl font-semibold text-foreground">No Messages Yet</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">
            Connect with tutors and book lessons to start messaging them.
          </p>
          <Link
            href="/student-auth/search"
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
      unread_for_student,
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

  const activeProfile = activeThread
    ? Array.isArray(activeThread.profiles)
      ? activeThread.profiles[0]
      : activeThread.profiles
    : null;

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <StudentPortalLayout studentName={studentName}>
      <div className="grid gap-6 rounded-2xl border border-border bg-white p-4 shadow-sm lg:grid-cols-[280px,1fr] min-h-[70vh]">
        {/* Sidebar - Tutor List */}
        <aside className="border-r border-border/50 pr-4 lg:pr-6">
          <h2 className="text-sm font-semibold text-foreground mb-3">Your Tutors</h2>
          <div className="space-y-2">
            {threadList.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No conversations yet. Book a lesson to start messaging.
              </p>
            ) : (
              threadList.map((thread) => {
                const isActive = thread.id === activeThreadId;
                const profileRaw = Array.isArray(thread.profiles)
                  ? thread.profiles[0]
                  : thread.profiles;
                const profile = profileRaw
                  ? {
                      full_name: profileRaw.full_name ?? null,
                      username: profileRaw.username ?? null,
                      avatar_url: profileRaw.avatar_url ?? null,
                    }
                  : null;
                return (
                  <Link
                    key={thread.id}
                    href={
                      isActive
                        ? "/student-auth/messages"
                        : `/student-auth/messages?thread=${thread.id}`
                    }
                    className={`flex items-center gap-3 rounded-xl border px-3 py-3 transition ${
                      isActive
                        ? "border-primary bg-primary/10"
                        : "border-transparent hover:border-border hover:bg-muted/30"
                    }`}
                  >
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage
                        src={profile?.avatar_url || undefined}
                        alt={profile?.full_name || "Tutor avatar"}
                      />
                      <AvatarFallback className="bg-primary/20 text-primary text-sm">
                        {getInitials(profile?.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-foreground truncate text-sm">
                          {profile?.full_name ?? "Tutor"}
                        </p>
                        {thread.unread_for_student && (
                          <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {thread.last_message_preview ?? "No messages yet"}
                      </p>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </aside>

        {/* Main - Conversation */}
        <section className="flex flex-col min-h-0">
          {!activeThread ? (
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-lg font-semibold text-foreground">No conversation selected</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Select a tutor from the sidebar or book a lesson to start chatting.
              </p>
            </div>
          ) : (
            <>
              {/* Header */}
              <header className="border-b border-border/70 pb-4 mb-4">
                {(() => {
                  const profileRaw = Array.isArray(activeThread.profiles)
                    ? activeThread.profiles[0]
                    : activeThread.profiles;
                  const activeProfile = profileRaw ?? null;
                  return (
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={activeProfile?.avatar_url || undefined}
                          alt={activeProfile?.full_name || "Tutor avatar"}
                        />
                        <AvatarFallback className="bg-primary/20 text-primary">
                          {getInitials(activeProfile?.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-foreground">
                          {activeProfile?.full_name ?? "Your tutor"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Stay in touch between lessons
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </header>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-3 py-2">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <p className="text-sm text-muted-foreground">No messages yet. Say hello!</p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isStudent = message.sender_role === "student";
                    const senderLabel = isStudent ? "You" : activeProfile?.full_name ?? "Tutor";
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isStudent ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                            isStudent
                              ? "rounded-br-none bg-primary text-primary-foreground"
                              : "rounded-bl-none bg-muted/60 text-foreground"
                          }`}
                        >
                          <p
                            className={`mb-1 text-[11px] font-semibold ${
                              isStudent ? "text-primary-foreground/80" : "text-muted-foreground/90"
                            }`}
                          >
                            {senderLabel}
                          </p>
                          <p className="whitespace-pre-line">{message.body}</p>
                          <p
                            className={`mt-1 text-[10px] uppercase tracking-wide ${
                              isStudent ? "text-primary-foreground/60" : "text-muted-foreground/70"
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

              {/* Composer */}
              <div className="pt-4 border-t border-border/70">
                <MessageComposer
                  threadId={activeThread.id}
                  placeholder={`Message ${activeProfile?.full_name ?? "your tutor"}...`}
                />
              </div>
            </>
          )}
        </section>
      </div>
    </StudentPortalLayout>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StudentPortalLayout } from "@/components/student-auth/StudentPortalLayout";
import { MessageComposer } from "@/components/messaging/message-composer";
import { MessageDisplay } from "@/components/messaging/message-display";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

  // Create a map of student_id to connection_status for quick lookups
  const connectionStatusMap = new Map<string, string | null>(
    students?.map((s) => [s.id, s.connection_status]) || []
  );

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
  const activeThread = threadList.find((thread) => thread.id === activeThreadId);

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
    <StudentPortalLayout studentName={studentName} avatarUrl={studentAvatarUrl} subscriptionSummary={subscriptionSummary}>
      <div className="grid gap-4 rounded-2xl border border-border bg-white p-3 shadow-sm lg:grid-cols-[280px,1fr] lg:gap-6 lg:p-4 min-h-[70vh]">
        {/* Sidebar - Tutor List */}
        <aside className="border-b border-border/50 pb-4 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-6">
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
                        ? "/student/messages"
                        : `/student/messages?thread=${thread.id}`
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
                        <div className="flex items-center gap-1.5 shrink-0">
                          {connectionStatusMap.get(thread.student_id) === "pending" && (
                            <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full font-medium">
                              Awaiting approval
                            </span>
                          )}
                          {thread.student_unread && (
                            <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                          )}
                        </div>
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
                <MessageDisplay
                  messages={messages}
                  currentUserRole="student"
                  otherPartyName={activeProfile?.full_name ?? "Tutor"}
                  currentUserAvatarUrl={studentAvatarUrl}
                  otherPartyAvatarUrl={activeProfile?.avatar_url}
                />
              </div>

              {/* Composer */}
              <div className="pt-4 border-t border-border/70">
                <MessageComposer
                  threadId={activeThread.id}
                  placeholder={`Message ${activeProfile?.full_name ?? "your tutor"}...`}
                  disabled={connectionStatusMap.get(activeThread.student_id) === "pending"}
                  disabledReason="Waiting for tutor to approve your connection request"
                />
              </div>
            </>
          )}
        </section>
      </div>
    </StudentPortalLayout>
  );
}

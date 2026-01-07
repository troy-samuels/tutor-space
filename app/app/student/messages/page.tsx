import Link from "next/link";
import { redirect } from "next/navigation";
import { StudentPortalLayout } from "@/components/student-auth/StudentPortalLayout";
import { StudentRealtimeMessagesContainer } from "@/components/messaging/StudentRealtimeMessagesContainer";
import { MessageSquare, Search, Clock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ConversationMessage } from "@/lib/actions/messaging";
import {
  listMessagesForThread,
  listThreadsForStudentIds,
  markMessagesReadByStudent,
  markThreadReadByStudent,
  getStudentMessagingContext,
} from "@/lib/repositories/messaging";
import { getStudentSubscriptionSummary } from "@/lib/actions/subscriptions";
import { getStudentAvatarUrl } from "@/lib/actions/student-avatar";
import { getSession } from "@/lib/auth";

type PageProps = {
  searchParams: Promise<{ thread?: string }>;
};

export default async function StudentMessagesPage({ searchParams }: PageProps) {
  const params = await searchParams;

  // Cached auth call - deduplicated across the request
  const { user, supabase } = await getSession();

  if (!user) {
    redirect("/student/login?redirect=/student/messages");
  }

  // Tier 1: Fetch all independent data in parallel
  const [messagingContextResult, { data: subscriptionSummary }, studentAvatarUrl] = await Promise.all([
    getStudentMessagingContext(supabase, user.id),
    getStudentSubscriptionSummary(),
    getStudentAvatarUrl(),
  ]);

  const { connections, studentRecords } = messagingContextResult.data ?? { connections: [], studentRecords: [] };

  // Filter connections by status
  const approvedConnections = connections.filter((c) => c.status === "approved");
  const pendingConnections = connections.filter((c) => c.status === "pending");

  // Get student IDs for approved connections (matching tutor_id)
  // Also include legacy students with approved connection_status but no explicit connection record
  const approvedTutorIds = new Set(approvedConnections.map((c) => c.tutor_id));
  const approvedStudentIds = studentRecords
    .filter((s) => approvedTutorIds.has(s.tutor_id) || s.connection_status === "approved")
    .map((s) => s.id);

  // Combine for unique student IDs (handles legacy + new connection system)
  const studentIds = [...new Set(approvedStudentIds)];
  const studentName = studentRecords?.[0]?.full_name || user.user_metadata?.full_name || null;

  const connectionStatuses = Object.fromEntries(
    studentRecords?.map((s) => [s.id, s.connection_status]) || []
  ) as Record<string, string | null>;

  // Case 1: No connections and no student records - show "Find Tutors"
  if (connections.length === 0 && studentRecords.length === 0) {
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

  // Case 2: Only pending connections - show "Awaiting Approval" state
  if (studentIds.length === 0 && pendingConnections.length > 0) {
    return (
      <StudentPortalLayout studentName={studentName} avatarUrl={studentAvatarUrl} subscriptionSummary={subscriptionSummary}>
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4">
          <Clock className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h2 className="text-xl font-semibold text-foreground">Awaiting Tutor Approval</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">
            You have {pendingConnections.length} pending connection request{pendingConnections.length > 1 ? "s" : ""}.
            You&apos;ll be able to message tutors once they approve your request.
          </p>

          {/* Show pending tutors */}
          <div className="mt-6 space-y-3">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Pending Requests</p>
            {pendingConnections.map((connection) => (
              <div
                key={connection.id}
                className="flex items-center gap-3 px-4 py-2 rounded-lg bg-muted/50"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={connection.profiles?.avatar_url || undefined} alt={connection.profiles?.full_name || "Tutor"} />
                  <AvatarFallback>
                    {connection.profiles?.full_name?.charAt(0) || "T"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-foreground">
                  {connection.profiles?.full_name || connection.profiles?.username || "Tutor"}
                </span>
                <span className="ml-auto text-xs text-muted-foreground bg-yellow-100 dark:bg-yellow-900/30 px-2 py-0.5 rounded">
                  Pending
                </span>
              </div>
            ))}
          </div>

          <Link
            href="/student/search"
            className="mt-6 text-sm text-primary hover:underline"
          >
            Find more tutors
          </Link>
        </div>
      </StudentPortalLayout>
    );
  }

  // Tier 2: Fetch threads (depends on studentIds)
  const { data: threads } = await listThreadsForStudentIds(supabase, studentIds);

  const threadList = threads ?? [];
  const activeThreadId =
    params?.thread && threadList.some((thread) => thread.id === params.thread)
      ? params.thread
      : threadList[0]?.id;

  let messages: ConversationMessage[] = [];

  if (activeThreadId) {
    const { data: messageRows } = await listMessagesForThread(supabase, activeThreadId);

    messages = (messageRows as ConversationMessage[] | null) ?? [];

    // Fire-and-forget: mark as read without blocking page render
    // These operations don't affect the UI, so no need to await
    Promise.all([
      markMessagesReadByStudent(supabase, activeThreadId),
      markThreadReadByStudent(supabase, activeThreadId),
    ]).catch((err) => console.error("[Messages] Failed to mark as read:", err));
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

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageComposer } from "@/components/messaging/message-composer";
import { MessageDisplay } from "@/components/messaging/message-display";
import { useRealtimeMessages } from "@/lib/hooks/useRealtimeMessages";
import { createClient } from "@/lib/supabase/client";
import type { ConversationMessage } from "@/lib/actions/messaging";

type StudentThreadProfile = {
  full_name: string | null;
  username?: string | null;
  avatar_url?: string | null;
};

type StudentConversationThread = {
  id: string;
  tutor_id: string;
  student_id: string;
  last_message_preview: string | null;
  last_message_at: string | null;
  student_unread: boolean;
  profiles: StudentThreadProfile | StudentThreadProfile[] | null;
};

type StudentRealtimeMessagesContainerProps = {
  studentIds: string[];
  connectionStatuses: Record<string, string | null>;
  initialThreads: StudentConversationThread[];
  initialMessages: ConversationMessage[];
  initialActiveThreadId: string | null;
  studentAvatarUrl?: string | null;
};

export function StudentRealtimeMessagesContainer({
  studentIds,
  connectionStatuses,
  initialThreads,
  initialMessages,
  initialActiveThreadId,
  studentAvatarUrl,
}: StudentRealtimeMessagesContainerProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const activeThreadId = searchParams.get("thread") ?? initialActiveThreadId ?? null;

  const [threads, setThreads] = useState(initialThreads);
  const [messages, setMessages] = useState(initialMessages);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialThreadIdRef = useRef<string | null>(initialActiveThreadId);

  useEffect(() => {
    setThreads(initialThreads);
  }, [initialThreads]);

  useEffect(() => {
    if (activeThreadId === initialThreadIdRef.current) {
      setMessages(initialMessages);
      return;
    }

    if (activeThreadId) {
      setMessages([]);
      initialThreadIdRef.current = activeThreadId;
    } else {
      setMessages(initialMessages);
    }
  }, [activeThreadId, initialMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const markThreadRead = useCallback(async () => {
    if (!activeThreadId) return;

    await supabase
      .from("conversation_messages")
      .update({ read_by_student: true })
      .eq("thread_id", activeThreadId)
      .eq("read_by_student", false);

    await supabase
      .from("conversation_threads")
      .update({ student_unread: false })
      .eq("id", activeThreadId);
  }, [activeThreadId, supabase]);

  const handleNewMessage = useCallback(
    (newMessage: ConversationMessage) => {
      if (!activeThreadId || newMessage.thread_id !== activeThreadId) return;

      setMessages((prev) => {
        if (prev.some((m) => m.id === newMessage.id)) return prev;
        return [...prev, newMessage];
      });

      if (newMessage.sender_role === "tutor") {
        setThreads((prev) =>
          prev.map((thread) =>
            thread.id === activeThreadId ? { ...thread, student_unread: false } : thread
          )
        );
        void markThreadRead();
      }
    },
    [activeThreadId, markThreadRead]
  );

  const handleThreadUpdate = useCallback(
    (updatedThread: Partial<StudentConversationThread> & { id: string }) => {
      setThreads((prev) => {
        const existingIndex = prev.findIndex((thread) => thread.id === updatedThread.id);
        const normalizedThread =
          updatedThread.id === activeThreadId
            ? { ...updatedThread, student_unread: false }
            : updatedThread;

        let newThreads: StudentConversationThread[];
        if (existingIndex >= 0) {
          newThreads = prev.map((thread) =>
            thread.id === normalizedThread.id ? { ...thread, ...normalizedThread } : thread
          );
        } else {
          router.refresh();
          return prev;
        }

        return newThreads.sort((a, b) => {
          const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
          const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
          return bTime - aTime;
        });
      });
    },
    [activeThreadId, router]
  );

  useRealtimeMessages({
    studentIds,
    threadId: activeThreadId,
    onNewMessage: handleNewMessage,
    onThreadUpdate: handleThreadUpdate,
  });

  const activeThread = threads.find((thread) => thread.id === activeThreadId) ?? null;
  const activeProfileRaw = activeThread
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
    <div className="grid gap-4 rounded-2xl border border-border bg-white p-3 shadow-sm lg:grid-cols-[280px,1fr] lg:gap-6 lg:p-4 min-h-[70vh]">
      {/* Sidebar - Tutor List */}
      <aside className="border-b border-border/50 pb-4 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-6">
        <h2 className="text-sm font-semibold text-foreground mb-3">Your Tutors</h2>
        <div className="space-y-2">
          {threads.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No conversations yet. Book a lesson to start messaging.
            </p>
          ) : (
            threads.map((thread) => {
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
                        {connectionStatuses[thread.student_id] === "pending" && (
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
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={activeProfileRaw?.avatar_url || undefined}
                    alt={activeProfileRaw?.full_name || "Tutor avatar"}
                  />
                  <AvatarFallback className="bg-primary/20 text-primary">
                    {getInitials(activeProfileRaw?.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-foreground">
                    {activeProfileRaw?.full_name ?? "Your tutor"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Stay in touch between lessons
                  </p>
                </div>
              </div>
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-3 py-2">
              <MessageDisplay
                messages={messages}
                currentUserRole="student"
                otherPartyName={activeProfileRaw?.full_name ?? "Tutor"}
                currentUserAvatarUrl={studentAvatarUrl}
                otherPartyAvatarUrl={activeProfileRaw?.avatar_url}
              />
              <div ref={messagesEndRef} />
            </div>

            {/* Composer */}
            <div className="pt-4 border-t border-border/70">
              <MessageComposer
                threadId={activeThread.id}
                placeholder={`Message ${activeProfileRaw?.full_name ?? "your tutor"}...`}
                disabled={connectionStatuses[activeThread.student_id] === "pending"}
                disabledReason="Waiting for tutor to approve your connection request"
              />
            </div>
          </>
        )}
      </section>
    </div>
  );
}

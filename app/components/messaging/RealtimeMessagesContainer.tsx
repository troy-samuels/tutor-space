"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { MessageComposer } from "@/components/messaging/message-composer";
import { MessageDisplay } from "@/components/messaging/message-display";
import { useRealtimeMessages } from "@/lib/hooks/useRealtimeMessages";
import { createClient } from "@/lib/supabase/client";
import { markMessagesReadByTutor, markThreadReadByTutor } from "@/lib/repositories/messaging";
import type { ConversationThread, ConversationMessage } from "@/lib/actions/messaging";

type Props = {
  tutorId: string;
  tutorAvatarUrl?: string | null;
  initialThreads: ConversationThread[];
  initialMessages: ConversationMessage[];
  initialActiveThreadId: string | null;
};

export function RealtimeMessagesContainer({
  tutorId,
  tutorAvatarUrl,
  initialThreads,
  initialMessages,
  initialActiveThreadId,
}: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const activeThreadId = searchParams.get("thread") ?? initialActiveThreadId;

  const [threads, setThreads] = useState(initialThreads);
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState(initialMessages);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync with server-provided data on navigation/prop changes
  useEffect(() => {
    setThreads(initialThreads);
  }, [initialThreads]);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleNewMessage = useCallback(
    (newMessage: ConversationMessage) => {
      // Only add if message is for the active thread
      if (newMessage.thread_id !== activeThreadId) return;

      setMessages((prev) => {
        // Avoid duplicates
        if (prev.some((m) => m.id === newMessage.id)) return prev;
        return [...prev, newMessage];
      });

      if (newMessage.sender_role === "student" && activeThreadId) {
        setThreads((prev) =>
          prev.map((thread) =>
            thread.id === activeThreadId ? { ...thread, tutor_unread: false } : thread
          )
        );
        void markMessagesReadByTutor(supabase, activeThreadId);
        void markThreadReadByTutor(supabase, activeThreadId);
      }
    },
    [activeThreadId, supabase]
  );

  const handleThreadUpdate = useCallback(
    (updatedThread: Partial<ConversationThread> & { id: string }) => {
      setThreads((prev) => {
        // Check if thread already exists
        const existingIndex = prev.findIndex((t) => t.id === updatedThread.id);
        const normalizedThread =
          updatedThread.id === activeThreadId
            ? { ...updatedThread, tutor_unread: false }
            : updatedThread;

        let newThreads: ConversationThread[];
        if (existingIndex >= 0) {
          // Update existing thread
          newThreads = prev.map((t) =>
            t.id === normalizedThread.id ? { ...t, ...normalizedThread } : t
          );
        } else {
          // New thread - add to list (will need full data from server eventually)
          // For now, just trigger a router refresh to get full data
          router.refresh();
          return prev;
        }

        // Re-sort by last_message_at (newest first)
        return newThreads.sort((a, b) => {
          const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
          const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
          return bTime - aTime;
        });
      });
    },
    [activeThreadId, router]
  );

  // Subscribe to realtime updates
  useRealtimeMessages({
    tutorId,
    threadId: activeThreadId,
    onNewMessage: handleNewMessage,
    onThreadUpdate: handleThreadUpdate,
  });

  const filteredThreads = threads.filter((thread) => {
    if (!query.trim()) return true;
    const haystack = `${thread.students?.full_name ?? ""} ${thread.last_message_preview ?? ""}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  const activeThread = threads.find((t) => t.id === activeThreadId);

  return (
    <div className="grid gap-6 lg:grid-cols-[280px,1fr]">
      {/* Sidebar with conversation threads */}
      <aside className={`flex min-h-[200px] flex-col rounded-3xl border border-border bg-white/70 p-4 shadow-sm ${threads.length === 0 ? "items-center justify-center" : ""}`}>
        <div className={`flex items-center justify-between ${threads.length === 0 ? "flex-col gap-2 text-center" : "mb-4 w-full"}`}>
          <p className="text-sm font-semibold text-foreground">Conversations</p>
          <Link href="/students" className="text-xs font-semibold text-primary hover:underline">
            Start new
          </Link>
        </div>
        {threads.length > 0 && (
          <>
            <div className="mb-3 flex items-center rounded-xl border border-border/60 bg-white px-2 py-1.5 text-sm">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                className="ml-2 h-6 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <div className="space-y-2">
              {(filteredThreads.length > 0 ? filteredThreads : threads).map((thread) => {
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
                      {thread.tutor_unread ? (
                        <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                      ) : null}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {thread.last_message_preview ?? "No messages yet"}
                    </p>
                  </Link>
                );
              })}
            </div>
          </>
        )}
        {threads.length === 0 && (
          <div className="text-center text-sm text-muted-foreground">
            No conversations yet. Start by messaging a student.
          </div>
        )}
      </aside>

      {/* Main message area */}
      <section className="flex min-h-[540px] flex-col rounded-3xl border border-border bg-white/90 p-6 shadow-sm">
        {!activeThread ? (
          threads.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <p className="font-semibold text-foreground">No messages yet</p>
              <Link href="/students" className="mt-2 text-sm text-primary hover:underline">
                Start a conversation
              </Link>
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <p className="text-muted-foreground">Select a conversation</p>
            </div>
          )
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
              <MessageDisplay
                messages={messages}
                currentUserRole="tutor"
                otherPartyName={activeThread?.students?.full_name ?? "Student"}
                currentUserAvatarUrl={tutorAvatarUrl}
                otherPartyAvatarUrl={null}
              />
              <div ref={messagesEndRef} />
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

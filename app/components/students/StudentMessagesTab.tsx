"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MessageCircle } from "lucide-react";
import { MessageComposer } from "@/components/messaging/message-composer";
import { useRealtimeMessages } from "@/lib/hooks/useRealtimeMessages";
import type { ConversationMessage } from "@/lib/actions/messaging";

type StudentMessagesTabProps = {
  threadId: string | null;
  messages: ConversationMessage[];
  studentName: string;
  tutorId: string;
};

export function StudentMessagesTab({
  threadId,
  messages: initialMessages,
  studentName,
  tutorId,
}: StudentMessagesTabProps) {
  const [messages, setMessages] = useState(initialMessages);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialThreadIdRef = useRef<string | null>(threadId);

  // Sync with server data when props change
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  // Auto-scroll when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Reset messages when switching to a newly created thread
  useEffect(() => {
    if (threadId === initialThreadIdRef.current) {
      setMessages(initialMessages);
      return;
    }

    if (threadId) {
      setMessages([]);
      initialThreadIdRef.current = threadId;
    } else {
      setMessages(initialMessages);
    }
  }, [threadId, initialMessages]);

  const handleNewMessage = useCallback(
    (newMessage: ConversationMessage) => {
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.some((m) => m.id === newMessage.id)) return prev;
        return [...prev, newMessage];
      });
    },
    []
  );

  // Subscribe to realtime messages
  useRealtimeMessages({
    tutorId,
    threadId,
    onNewMessage: handleNewMessage,
  });

  if (!threadId) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-border bg-white/70 p-8 text-center">
        <MessageCircle className="h-12 w-12 text-muted-foreground/40" />
        <p className="mt-4 text-lg font-semibold text-foreground">Start a conversation</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Send your first message to {studentName}
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[480px] flex-col rounded-2xl border border-border bg-white/90 shadow-sm">
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-6">
        {messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <MessageCircle className="h-10 w-10 text-muted-foreground/40" />
            <p className="mt-4 text-sm text-muted-foreground">
              No messages yet. Send the first message to {studentName}!
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const isTutor = message.sender_role === "tutor";
            const senderLabel = isTutor ? "You" : studentName;
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
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-border/60 p-4">
        <MessageComposer threadId={threadId} placeholder={`Message ${studentName}...`} />
      </div>
    </div>
  );
}

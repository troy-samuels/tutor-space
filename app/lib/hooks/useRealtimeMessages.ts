"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { ConversationMessage, ConversationThread } from "@/lib/actions/messaging";

type UseRealtimeMessagesOptions = {
  tutorId: string;
  threadId?: string | null;
  onNewMessage?: (message: ConversationMessage) => void;
  onThreadUpdate?: (thread: Partial<ConversationThread> & { id: string }) => void;
};

export function useRealtimeMessages({
  tutorId,
  threadId,
  onNewMessage,
  onThreadUpdate,
}: UseRealtimeMessagesOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Stable callback refs to avoid re-subscribing on callback changes
  const onNewMessageRef = useRef(onNewMessage);
  const onThreadUpdateRef = useRef(onThreadUpdate);

  useEffect(() => {
    onNewMessageRef.current = onNewMessage;
  }, [onNewMessage]);

  useEffect(() => {
    onThreadUpdateRef.current = onThreadUpdate;
  }, [onThreadUpdate]);

  useEffect(() => {
    if (!tutorId) return;

    const supabase = createClient();
    const channelName = `messaging-${tutorId}-${threadId ?? "all"}`;
    const channel = supabase.channel(channelName);

    // Listen to new messages in the specific thread
    if (threadId) {
      channel.on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "conversation_messages",
          filter: `thread_id=eq.${threadId}`,
        },
        (payload) => {
          onNewMessageRef.current?.(payload.new as ConversationMessage);
        }
      );
    }

    // Listen to thread updates for sidebar
    channel.on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "conversation_threads",
        filter: `tutor_id=eq.${tutorId}`,
      },
      (payload) => {
        onThreadUpdateRef.current?.(payload.new as Partial<ConversationThread> & { id: string });
      }
    );

    // Also listen for new threads
    channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "conversation_threads",
        filter: `tutor_id=eq.${tutorId}`,
      },
      (payload) => {
        onThreadUpdateRef.current?.(payload.new as Partial<ConversationThread> & { id: string });
      }
    );

    channel.subscribe();
    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [tutorId, threadId]);

  return channelRef;
}

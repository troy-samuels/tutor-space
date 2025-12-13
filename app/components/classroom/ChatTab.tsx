"use client";

import { useState, useRef, useEffect } from "react";
import {
  useConnectionState,
  useDataChannel,
  useLocalParticipant,
} from "@livekit/components-react";
import { ConnectionState } from "livekit-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  text: string;
  sender: string;
  senderIdentity: string;
  timestamp: number;
}

export function ChatTab() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const connectionState = useConnectionState();
  const { localParticipant } = useLocalParticipant();

  // Get current participant name
  const localName = localParticipant?.name || localParticipant?.identity || "You";
  const localIdentity = localParticipant?.identity || "local";

  // Use LiveKit's data channel for chat
  const { send, isSending } = useDataChannel("chat", (latestMessage) => {
    try {
      const decoder = new TextDecoder();
      const jsonString = decoder.decode(latestMessage.payload);
      const msg = JSON.parse(jsonString) as ChatMessage;
      if (!msg?.id || typeof msg.text !== "string") return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    } catch (err) {
      console.error("[Chat] Failed to parse message:", err);
    }
  });

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    setSendError(null);

    const msg: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      text: input.trim(),
      sender: localName,
      senderIdentity: localIdentity,
      timestamp: Date.now(),
    };

    // Add to local messages immediately
    setMessages((prev) => [...prev, msg]);

    // Send via data channel
    try {
      const encoder = new TextEncoder();
      const payload = encoder.encode(JSON.stringify(msg));
      await send(payload, { reliable: true });
    } catch (err) {
      console.error("[Chat] Failed to send message:", err);
      setSendError("Message failed to send. Try again.");
    }

    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (messages.length === 0) {
    return (
      <div className="h-full flex flex-col">
        {/* Empty state */}
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 px-4">
          <div className="rounded-full bg-muted p-4">
            <MessageSquare className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium text-foreground">No messages yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Send a message to start chatting during the lesson.
            </p>
          </div>
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="rounded-full"
              disabled={connectionState !== ConnectionState.Connected}
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!input.trim() || connectionState !== ConnectionState.Connected || isSending}
              className="rounded-full shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          {sendError && (
            <p className="mt-2 text-xs text-red-600">{sendError}</p>
          )}
          {connectionState !== ConnectionState.Connected && (
            <p className="mt-2 text-xs text-muted-foreground">
              Connecting… chat will enable once connected.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Messages List */}
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {messages.map((msg) => {
          const isLocal = msg.senderIdentity === localIdentity;
          return (
            <div
              key={msg.id}
              className={cn(
                "flex flex-col max-w-[85%]",
                isLocal ? "ml-auto items-end" : "items-start"
              )}
            >
              {!isLocal && (
                <span className="text-xs text-muted-foreground mb-1 px-1">
                  {msg.sender}
                </span>
              )}
              <div
                className={cn(
                  "px-3 py-2 rounded-2xl text-sm",
                  isLocal
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : "bg-muted text-foreground rounded-tl-sm"
                )}
              >
                {msg.text}
              </div>
              <span className="text-[10px] text-muted-foreground mt-1 px-1">
                {formatTime(msg.timestamp)}
              </span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="rounded-full"
            disabled={connectionState !== ConnectionState.Connected}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || connectionState !== ConnectionState.Connected || isSending}
            className="rounded-full shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        {sendError && (
          <p className="mt-2 text-xs text-red-600">{sendError}</p>
        )}
        {connectionState !== ConnectionState.Connected && (
          <p className="mt-2 text-xs text-muted-foreground">
            Connecting… chat will enable once connected.
          </p>
        )}
      </div>
    </div>
  );
}

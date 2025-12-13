"use client";

import { useState } from "react";
import { Play, Pause, Mic } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ConversationMessage, MessageAttachment } from "@/lib/actions/messaging";

type MessageDisplayProps = {
  messages: ConversationMessage[];
  currentUserRole: "tutor" | "student";
  otherPartyName: string;
  currentUserAvatarUrl?: string | null;
  otherPartyAvatarUrl?: string | null;
};

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export function MessageDisplay({
  messages,
  currentUserRole,
  otherPartyName,
  currentUserAvatarUrl,
  otherPartyAvatarUrl,
}: MessageDisplayProps) {
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const toggleAudio = (messageId: string, audioId: string) => {
    const audio = document.getElementById(audioId) as HTMLAudioElement;
    if (!audio) return;

    if (playingAudioId === messageId) {
      audio.pause();
      setPlayingAudioId(null);
    } else {
      // Pause any other playing audio
      if (playingAudioId) {
        const prevAudioId = messages.find(m => m.id === playingAudioId)?.attachments?.[0]
          ? `audio-${playingAudioId}-0`
          : null;
        if (prevAudioId) {
          const prevAudio = document.getElementById(prevAudioId) as HTMLAudioElement;
          prevAudio?.pause();
        }
      }
      audio.play();
      setPlayingAudioId(messageId);
    }
  };

  if (messages.length === 0) {
    return (
      <div className="mt-10 text-center text-sm text-muted-foreground">
        No messages yet. Send the first hello!
      </div>
    );
  }

  return (
    <>
      {messages.map((message) => {
        const isCurrentUser = message.sender_role === currentUserRole;
        const senderLabel = isCurrentUser ? "You" : otherPartyName;
        const avatarUrl = isCurrentUser ? currentUserAvatarUrl : otherPartyAvatarUrl;
        const avatarName = isCurrentUser ? "You" : otherPartyName;
        const audioAttachments = (message.attachments || []).filter(
          (a): a is MessageAttachment => a.type === "audio"
        );

        return (
          <div
            key={message.id}
            className={`flex gap-2 ${isCurrentUser ? "justify-end" : "justify-start"}`}
          >
            {/* Avatar on left for other party */}
            {!isCurrentUser && (
              <Avatar className="h-8 w-8 shrink-0 mt-1">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={avatarName} />}
                <AvatarFallback className="text-xs bg-muted">
                  {getInitials(otherPartyName)}
                </AvatarFallback>
              </Avatar>
            )}

            <div
              className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                isCurrentUser
                  ? "rounded-br-none bg-primary text-primary-foreground"
                  : "rounded-bl-none bg-muted/60 text-foreground"
              }`}
            >

              {/* Audio attachments */}
              {audioAttachments.length > 0 && (
                <div className="mb-2 space-y-2">
                  {audioAttachments.map((attachment, idx) => {
                    const audioId = `audio-${message.id}-${idx}`;
                    const isPlaying = playingAudioId === message.id;

                    return (
                      <div
                        key={audioId}
                        className={`flex items-center gap-2 rounded-lg p-2 ${
                          isCurrentUser
                            ? "bg-primary-foreground/10"
                            : "bg-muted"
                        }`}
                      >
                        <audio
                          id={audioId}
                          src={attachment.url}
                          onEnded={() => setPlayingAudioId(null)}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => toggleAudio(message.id, audioId)}
                          className={`flex h-8 w-8 items-center justify-center rounded-full ${
                            isCurrentUser
                              ? "bg-primary-foreground text-primary"
                              : "bg-primary text-primary-foreground"
                          }`}
                          aria-label={isPlaying ? "Pause voice note" : "Play voice note"}
                        >
                          {isPlaying ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4 ml-0.5" />
                          )}
                        </button>
                        <div className="flex flex-1 items-center justify-between gap-2 text-xs">
                          <div
                            className={`flex items-center gap-1.5 ${
                              isCurrentUser
                                ? "text-primary-foreground/70"
                                : "text-muted-foreground"
                            }`}
                          >
                            <Mic className="h-3.5 w-3.5" />
                            <span>
                              {attachment.duration_seconds
                                ? formatDuration(attachment.duration_seconds)
                                : "Voice note"}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Text body */}
              {message.body && (
                <p className="whitespace-pre-line">{message.body}</p>
              )}

              <p
                className={`mt-1 text-[10px] uppercase tracking-wide ${
                  isCurrentUser
                    ? "text-primary-foreground/70"
                    : "text-muted-foreground/70"
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

            {/* Avatar on right for current user */}
            {isCurrentUser && (
              <Avatar className="h-8 w-8 shrink-0 mt-1">
                {avatarUrl && <AvatarImage src={avatarUrl} alt="You" />}
                <AvatarFallback className="text-xs bg-primary/20 text-primary">
                  {currentUserRole === "student" ? "Me" : "Me"}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        );
      })}
    </>
  );
}

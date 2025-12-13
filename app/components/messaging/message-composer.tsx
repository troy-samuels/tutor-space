"use client";

import { useState, useRef, useTransition } from "react";
import { ArrowUpCircle, Loader2, Mic, X, Play, Pause } from "lucide-react";
import {
  uploadMessageAudio,
  sendMessageWithAudio,
  type MessageAttachment,
} from "@/lib/actions/messaging";
import { AudioRecorder } from "@/components/student/AudioRecorder";

const QUICK_REPLIES = [
  "Thanks for the update!",
  "Let’s book a time.",
  "Great work—keep it up.",
];

type MessageComposerProps = {
  threadId: string;
  placeholder?: string;
  disabled?: boolean;
  disabledReason?: string;
};

export function MessageComposer({ threadId, placeholder, disabled = false, disabledReason }: MessageComposerProps) {
  const [body, setBody] = useState("");
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const canSend = (body.trim() || audioBlob) && !disabled;

  const handleRecordingComplete = (blob: Blob, duration: number) => {
    setAudioBlob(blob);
    setAudioDuration(duration);
    setAudioUrl(URL.createObjectURL(blob));
    setShowAudioRecorder(false);
  };

  const clearAudio = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioDuration(0);
    setAudioUrl(null);
    setIsPlaying(false);
  };

  const togglePlayback = () => {
    if (!audioRef.current || !audioUrl) return;
    audioRef.current.playbackRate = playbackRate;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSend || isPending) return;

    setError(null);

    startTransition(async () => {
      try {
        const attachments: MessageAttachment[] = [];

        // Upload audio if present
        if (audioBlob) {
          const formData = new FormData();
          formData.append("file", audioBlob, `voice_message.${audioBlob.type === "audio/webm" ? "webm" : "mp4"}`);
          const uploadResult = await uploadMessageAudio(formData);

          if (uploadResult.error) {
            setError(uploadResult.error);
            return;
          }

          if (uploadResult.url) {
            attachments.push({
              type: "audio",
              url: uploadResult.url,
              duration_seconds: audioDuration,
              mime_type: audioBlob.type,
            });
          }
        }

        // Send message
        const result = await sendMessageWithAudio({
          threadId,
          body: body.trim() || undefined,
          attachments: attachments.length > 0 ? attachments : undefined,
        });

        if (result.error) {
          setError(result.error);
          return;
        }

        // Clear form on success
        setBody("");
        clearAudio();
        setShowAudioRecorder(false);
        textareaRef.current?.focus();
      } catch (err) {
        console.error("Failed to send message:", err);
        setError("Failed to send message. Please try again.");
      }
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Show disabled state when messaging is not allowed
  if (disabled) {
    return (
      <div className="rounded-2xl border border-border/70 bg-muted/50 px-4 py-4 text-center">
        <p className="text-sm text-muted-foreground">
          {disabledReason || "Messaging is currently unavailable"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {error && (
        <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {QUICK_REPLIES.map((reply) => (
          <button
            key={reply}
            type="button"
            onClick={() => setBody(reply)}
            className="rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-semibold text-foreground hover:border-primary/40"
          >
            {reply}
          </button>
        ))}
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-border/70 bg-white shadow-sm"
      >
        {/* Audio preview */}
        {audioUrl && (
          <div className="flex items-center gap-2 border-b border-border/50 px-4 py-2">
            <audio
              ref={audioRef}
              src={audioUrl}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />
            <button
              type="button"
              onClick={togglePlayback}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4 ml-0.5" />
              )}
            </button>
            <div className="flex flex-1 items-center justify-between gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Mic className="h-3.5 w-3.5" />
                <span>Voice message ({formatDuration(audioDuration)})</span>
              </div>
              <div className="flex items-center gap-1">
                <span>Speed</span>
                {[1, 1.5, 2].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => {
                      setPlaybackRate(rate);
                      if (audioRef.current) {
                        audioRef.current.playbackRate = rate;
                      }
                    }}
                    className={`rounded-full px-2 py-0.5 font-semibold ${
                      playbackRate === rate
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={clearAudio}
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Audio recorder */}
        {showAudioRecorder && !audioBlob && (
          <div className="border-b border-border/50 px-4 py-3">
            <AudioRecorder
              maxDurationSeconds={120}
              onRecordingComplete={handleRecordingComplete}
              variant="minimal"
            />
            <button
              type="button"
              onClick={() => setShowAudioRecorder(false)}
              className="mt-2 text-xs text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        )}

        <div className="flex items-end gap-3 px-4 py-3">
          <textarea
            ref={textareaRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={2}
            placeholder={placeholder ?? "Write a message..."}
            className="min-h-[48px] flex-1 resize-none border-0 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />

          {/* Mic button */}
          <button
            type="button"
            onClick={() => setShowAudioRecorder(!showAudioRecorder)}
            disabled={isPending || !!audioBlob}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-full transition ${
              showAudioRecorder
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            } disabled:opacity-50`}
            aria-label="Record voice message"
          >
            <Mic className="h-5 w-5" />
          </button>

          {/* Send button */}
          <button
            type="submit"
            disabled={isPending || !canSend}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow transition hover:bg-primary/90 disabled:opacity-60"
            aria-label="Send message"
          >
            {isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <ArrowUpCircle className="h-5 w-5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

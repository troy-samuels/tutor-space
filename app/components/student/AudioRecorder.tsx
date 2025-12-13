"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Trash2, Play, Pause, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AudioRecorderProps {
  onRecordingComplete: (audioBlob: Blob, duration: number) => void;
  maxDurationSeconds?: number;
  disabled?: boolean;
  className?: string;
  variant?: "default" | "minimal";
}

export function AudioRecorder({
  onRecordingComplete,
  maxDurationSeconds = 300, // 5 minutes default
  disabled = false,
  className,
  variant = "default",
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mimeTypeRef = useRef<string>("audio/webm");

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setIsRecording(false);
  }, []);

  const startRecording = useCallback(async () => {
    // Clear previous recording
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
      setAudioBlob(null);
    }

    audioChunksRef.current = [];
    setRecordingTime(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Determine supported mimeType
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";
      mimeTypeRef.current = mimeType;

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType,
        });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
      };

      mediaRecorder.start(100);
      setIsRecording(true);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 1;
          if (newTime >= maxDurationSeconds) {
            stopRecording();
          }
          return newTime;
        });
      }, 1000);
    } catch (err) {
      console.error("Failed to start recording:", err);
    }
  }, [audioUrl, maxDurationSeconds, stopRecording]);

  const deleteRecording = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setAudioBlob(null);
    setRecordingTime(0);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, [audioUrl]);

  const togglePlayback = useCallback(() => {
    if (!audioRef.current || !audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [audioUrl, isPlaying]);

  const handleSubmit = useCallback(async () => {
    if (!audioBlob) return;

    setIsUploading(true);
    try {
      onRecordingComplete(audioBlob, recordingTime);
    } finally {
      setIsUploading(false);
    }
  }, [audioBlob, onRecordingComplete, recordingTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Handle audio playback ended
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => setIsPlaying(false);
    audio.addEventListener("ended", handleEnded);
    return () => audio.removeEventListener("ended", handleEnded);
  }, [audioUrl]);

  const minimal = variant === "minimal";

  if (minimal) {
    return (
      <div className={cn("rounded-xl bg-muted/30 px-3 py-2", className)}>
        {!audioUrl ? (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={disabled}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full transition",
                isRecording
                  ? "bg-destructive text-destructive-foreground animate-pulse"
                  : "bg-primary/10 text-primary hover:bg-primary/20",
                disabled && "opacity-60"
              )}
              aria-label={isRecording ? "Stop recording" : "Record voice note"}
            >
              {isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
            <div className="flex flex-1 flex-col">
              <span className="text-sm font-semibold text-foreground">
                {isRecording ? "Recording..." : "Voice note"}
              </span>
              <span className="text-xs text-muted-foreground">
                {isRecording ? `Tap to stop · ${formatTime(recordingTime)}` : "Tap mic to record"}
              </span>
            </div>
            {isRecording && (
              <span className="text-xs font-semibold text-destructive tabular-nums">
                {formatTime(recordingTime)}
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <audio ref={audioRef} src={audioUrl} className="hidden" />
            <button
              type="button"
              onClick={togglePlayback}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground"
              aria-label={isPlaying ? "Pause voice note" : "Play voice note"}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <div className="flex flex-1 items-center gap-2 text-sm font-semibold text-foreground">
              <Mic className="h-4 w-4" />
              <span className="tabular-nums">{formatTime(recordingTime)}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isUploading}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary",
                  isUploading && "opacity-60"
                )}
                aria-label="Attach voice note"
              >
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={deleteRecording}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground"
                aria-label="Delete voice note"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Recording controls */}
      {!audioUrl ? (
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant={isRecording ? "destructive" : "outline"}
            size="sm"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={disabled}
            className={cn(
              "gap-2",
              isRecording && "animate-pulse"
            )}
          >
            {isRecording ? (
              <>
                <Square className="h-4 w-4" />
                Stop Recording
              </>
            ) : (
              <>
                <Mic className="h-4 w-4" />
                Record Audio
              </>
            )}
          </Button>

          {isRecording && (
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
              </span>
              <span className="text-sm font-medium text-red-600 tabular-nums">
                {formatTime(recordingTime)}
              </span>
              <span className="text-xs text-muted-foreground">
                / {formatTime(maxDurationSeconds)}
              </span>
            </div>
          )}
        </div>
      ) : (
        /* Playback controls */
        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
          <audio ref={audioRef} src={audioUrl} className="hidden" />

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={togglePlayback}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Recording</span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {formatTime(recordingTime)}
              </span>
            </div>
            <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all"
                style={{
                  width: isPlaying
                    ? `${((audioRef.current?.currentTime || 0) / recordingTime) * 100}%`
                    : "100%",
                }}
              />
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={deleteRecording}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Submit button - only show when recording is complete */}
      {audioUrl && audioBlob && (
        <Button
          type="button"
          size="sm"
          onClick={handleSubmit}
          disabled={isUploading}
          className="w-full"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            "Use this recording"
          )}
        </Button>
      )}
    </div>
  );
}

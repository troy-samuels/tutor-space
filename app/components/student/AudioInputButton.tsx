"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2, Square, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AudioBudget {
  enabled: boolean;
  remaining_seconds: number;
  limit_seconds: number;
  used_seconds: number;
}

interface AudioInputButtonProps {
  sessionId: string;
  language: string;
  onTranscript?: (transcript: string) => void;
  onAssessment?: (assessment: PronunciationAssessment) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
}

export interface PronunciationAssessment {
  assessment_id: string;
  transcript: string;
  scores: {
    accuracy: number;
    fluency: number;
    pronunciation: number;
    completeness: number;
  };
  word_scores?: Array<{
    word: string;
    accuracy: number;
    error_type?: string;
  }>;
  problem_phonemes?: string[];
  remaining_seconds: number;
  cost_cents?: number;
  mock?: boolean;
}

export function AudioInputButton({
  sessionId,
  language,
  onTranscript,
  onAssessment,
  onError,
  disabled = false,
  className,
}: AudioInputButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [budget, setBudget] = useState<AudioBudget | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch audio budget on mount
  useEffect(() => {
    fetchBudget();
  }, []);

  const fetchBudget = async () => {
    try {
      const response = await fetch("/api/practice/audio");
      if (response.ok) {
        const data = await response.json();
        setBudget(data);
      }
    } catch (err) {
      console.error("Failed to fetch audio budget:", err);
    }
  };

  const startRecording = useCallback(async () => {
    if (!budget?.enabled || budget.remaining_seconds <= 0) {
      setError("Audio practice limit reached for this period");
      onError?.("Audio practice limit reached for this period");
      return;
    }

    setError(null);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/mp4",
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType,
        });
        await processAudio(audioBlob);
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 1;
          // Auto-stop after 30 seconds (max per recording)
          if (newTime >= 30) {
            stopRecording();
          }
          return newTime;
        });
      }, 1000);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to access microphone";
      setError(message);
      onError?.(message);
    }
  }, [budget, onError]);

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

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    setError(null);

    try {
      // Convert to WAV for Azure Speech (better compatibility)
      const wavBlob = await convertToWav(audioBlob);

      const formData = new FormData();
      formData.append("audio", wavBlob, "recording.wav");
      formData.append("sessionId", sessionId);
      formData.append("language", language);

      const response = await fetch("/api/practice/audio", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process audio");
      }

      // Update budget with new remaining seconds
      if (data.remaining_seconds !== undefined) {
        setBudget((prev) =>
          prev
            ? { ...prev, remaining_seconds: data.remaining_seconds }
            : null
        );
      }

      // Notify parent of transcript
      if (data.transcript && onTranscript) {
        onTranscript(data.transcript);
      }

      // Notify parent of full assessment
      if (onAssessment) {
        onAssessment({
          assessment_id: data.assessment_id,
          transcript: data.transcript || "",
          scores: data.scores || {
            accuracy: 0,
            fluency: 0,
            pronunciation: 0,
            completeness: 0,
          },
          word_scores: data.word_scores,
          problem_phonemes: data.problem_phonemes,
          remaining_seconds: data.remaining_seconds,
          cost_cents: data.cost_cents,
          mock: data.mock,
        });
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to process audio";
      setError(message);
      onError?.(message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Simple WAV conversion (browser-compatible)
  const convertToWav = async (blob: Blob): Promise<Blob> => {
    // For simplicity, we'll send the original format
    // Azure can handle webm/mp4. In production, consider using
    // a proper audio conversion library for better compatibility.
    return new Blob([blob], { type: "audio/wav" });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const budgetPercentage = budget
    ? (budget.remaining_seconds / budget.limit_seconds) * 100
    : 0;

  const isDisabled =
    disabled || isProcessing || !budget?.enabled || budget?.remaining_seconds <= 0;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Recording button */}
      <Button
        type="button"
        variant={isRecording ? "destructive" : "outline"}
        size="icon"
        className={cn(
          "relative h-10 w-10 shrink-0 rounded-xl transition-all",
          isRecording && "animate-pulse"
        )}
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isDisabled}
        title={
          isRecording
            ? `Recording... ${formatTime(recordingTime)} (click to stop)`
            : budget?.remaining_seconds === 0
            ? "Audio limit reached"
            : "Record pronunciation"
        }
      >
        {isProcessing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isRecording ? (
          <Square className="h-4 w-4" />
        ) : budget?.remaining_seconds === 0 ? (
          <MicOff className="h-4 w-4" />
        ) : (
          <Mic className="h-4 w-4" />
        )}

        {/* Recording indicator */}
        {isRecording && (
          <span className="absolute -right-1 -top-1 flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
          </span>
        )}
      </Button>

      {/* Budget indicator */}
      {budget && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <div
            className={cn(
              "h-1.5 w-12 overflow-hidden rounded-full bg-muted",
              budgetPercentage < 20 && "bg-red-100"
            )}
          >
            <div
              className={cn(
                "h-full rounded-full transition-all",
                budgetPercentage > 50
                  ? "bg-emerald-500"
                  : budgetPercentage > 20
                  ? "bg-amber-500"
                  : "bg-red-500"
              )}
              style={{ width: `${budgetPercentage}%` }}
            />
          </div>
          <span className="tabular-nums">
            {Math.floor(budget.remaining_seconds)}s
          </span>
        </div>
      )}

      {/* Recording time display */}
      {isRecording && (
        <span className="text-xs font-medium text-red-600 tabular-nums">
          {formatTime(recordingTime)}
        </span>
      )}

      {/* Error display */}
      {error && (
        <div className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="h-3 w-3" />
          <span className="line-clamp-1">{error}</span>
        </div>
      )}
    </div>
  );
}

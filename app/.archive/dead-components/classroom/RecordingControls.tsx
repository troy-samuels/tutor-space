"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Circle, Square, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecordingControlsProps {
  roomName: string;
  isTutor: boolean;
}

export function RecordingControls({
  roomName,
  isTutor,
}: RecordingControlsProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [egressId, setEgressId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check initial recording status
  const checkStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/livekit/recording", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomName, action: "status" }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsRecording(data.isRecording);
        setEgressId(data.egressId);
      }
    } catch (err) {
      console.error("[Recording] Failed to check status:", err);
    }
  }, [roomName]);

  useEffect(() => {
    if (isTutor) {
      checkStatus();
    }
  }, [isTutor, checkStatus]);

  const handleStartRecording = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/livekit/recording", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomName, action: "start" }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to start recording");
        return;
      }

      setIsRecording(true);
      setEgressId(data.egressId);
    } catch (err) {
      console.error("[Recording] Error starting:", err);
      setError("Failed to start recording");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopRecording = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/livekit/recording", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomName, action: "stop", egressId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to stop recording");
        return;
      }

      setIsRecording(false);
      setEgressId(null);
    } catch (err) {
      console.error("[Recording] Error stopping:", err);
      setError("Failed to stop recording");
    } finally {
      setIsLoading(false);
    }
  };

  // Only tutors can control recording
  if (!isTutor) {
    // Show recording indicator for students if recording is active
    if (isRecording) {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 rounded-full">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
          </span>
          <span className="text-sm text-red-600 font-medium">Recording</span>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      {error && (
        <span className="text-xs text-destructive">{error}</span>
      )}

      {isRecording ? (
        <Button
          variant="destructive"
          size="sm"
          onClick={handleStopRecording}
          disabled={isLoading}
          className="gap-2"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Square className="h-4 w-4" />
          )}
          Stop Recording
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={handleStartRecording}
          disabled={isLoading}
          className={cn(
            "gap-2 border-red-200 hover:bg-red-50 hover:text-red-600 hover:border-red-300",
            isLoading && "opacity-50"
          )}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Circle className="h-4 w-4 fill-red-500 text-red-500" />
          )}
          Start Recording
        </Button>
      )}

      {isRecording && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 rounded-full">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
          </span>
          <span className="text-sm text-red-600 font-medium">Recording...</span>
        </div>
      )}
    </div>
  );
}

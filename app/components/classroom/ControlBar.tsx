"use client";

import { useState, useEffect, useCallback, useRef, type MouseEvent } from "react";
import { Track } from "livekit-client";
import { useTrackToggle, useDisconnectButton, useLocalParticipant } from "@livekit/components-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Mic, MicOff, Video, VideoOff, MonitorUp, MonitorOff, PhoneOff, Circle, Square, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { MicVolumeIndicator } from "./MicVolumeIndicator";
import { RecordingConsentModal, useRecordingConsent } from "./RecordingConsentModal";

type ControlBarToast = {
  id: string;
  message: string;
  type: "error" | "warning" | "success" | "info";
  action?: { label: string; onClick: () => void };
};

interface ControlBarProps {
  roomName: string;
  isTutor: boolean;
  className?: string;
  recordingEnabled?: boolean;
  onLeave?: () => void;
}

export function ControlBar({
  roomName,
  isTutor,
  className,
  recordingEnabled = true,
  onLeave,
}: ControlBarProps) {
  const [toasts, setToasts] = useState<ControlBarToast[]>([]);
  const toastTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const showToast = useCallback(
    (toast: Omit<ControlBarToast, "id">, duration = 5000) => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev.slice(-2), { ...toast, id }]);

      const timeout = setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
        toastTimeoutRef.current.delete(id);
      }, duration);

      toastTimeoutRef.current.set(id, timeout);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timeout = toastTimeoutRef.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      toastTimeoutRef.current.delete(id);
    }
  }, []);

  const {
    buttonProps: micButtonProps,
    enabled: micEnabled,
  } = useTrackToggle({
    source: Track.Source.Microphone,
    onDeviceError: (err) => {
      const msg = err?.message?.toLowerCase() || "";
      if (msg.includes("permission") || msg.includes("denied")) {
        showToast({ message: "Microphone access denied. Check browser permissions.", type: "error" });
      } else if (msg.includes("not found") || msg.includes("no device")) {
        showToast({ message: "No microphone found. Connect a microphone and try again.", type: "error" });
      } else {
        showToast({ message: err?.message || "Unable to access microphone.", type: "error" });
      }
    },
  });

  const {
    buttonProps: cameraButtonProps,
    enabled: cameraEnabled,
  } = useTrackToggle({
    source: Track.Source.Camera,
    onDeviceError: (err) => {
      const msg = err?.message?.toLowerCase() || "";
      if (msg.includes("permission") || msg.includes("denied")) {
        showToast({ message: "Camera access denied. Check browser permissions.", type: "error" });
      } else if (msg.includes("not found") || msg.includes("no device")) {
        showToast({ message: "No camera found. Connect a camera and try again.", type: "error" });
      } else {
        showToast({ message: err?.message || "Unable to access camera.", type: "error" });
      }
    },
  });

  const { localParticipant } = useLocalParticipant();
  const isScreenSharing = localParticipant?.isScreenShareEnabled ?? false;

  const toggleScreenShare = async () => {
    if (!localParticipant) return;
    try {
      await localParticipant.setScreenShareEnabled(!isScreenSharing);
    } catch (err) {
      console.error("[ScreenShare] Error:", err);
      showToast({
        message: isScreenSharing ? "Failed to stop screen share." : "Failed to start screen share.",
        type: "error",
      });
    }
  };

  const { buttonProps: disconnectButtonProps } = useDisconnectButton({
    stopTracks: true,
  });
  const { onClick: disconnectOnClick, ...disconnectButtonRest } = disconnectButtonProps;

  const handleDisconnect = (event: MouseEvent<HTMLButtonElement>) => {
    disconnectOnClick?.(event);
    if (event.defaultPrevented) return;
    onLeave?.();
  };

  const [isRecording, setIsRecording] = useState(false);
  const [isRecordingLoading, setIsRecordingLoading] = useState(false);
  const [egressId, setEgressId] = useState<string | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const { hasConsent } = useRecordingConsent();

  const checkRecordingStatus = useCallback(async () => {
    if (!recordingEnabled) return;
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
  }, [recordingEnabled, roomName]);

  useEffect(() => {
    if (!recordingEnabled) return;
    checkRecordingStatus();
    const id = window.setInterval(checkRecordingStatus, 5000);
    return () => window.clearInterval(id);
  }, [checkRecordingStatus, recordingEnabled]);

  useEffect(() => {
    if (!isRecording) {
      setRecordingSeconds(0);
      return;
    }

    const timer = setInterval(() => {
      setRecordingSeconds((s) => s + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isRecording]);

  useEffect(() => {
    const timeouts = toastTimeoutRef.current;
    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout));
      timeouts.clear();
    };
  }, []);

  const formatRecordingTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    if (h > 0) {
      return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const startRecording = async (retryCount = 0) => {
    const MAX_RETRIES = 2;
    setIsRecordingLoading(true);
    setShowConsentModal(false);

    try {
      const response = await fetch("/api/livekit/recording", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomName, action: "start" }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("[Recording] Server error:", response.status, data);

        if (response.status >= 500 && retryCount < MAX_RETRIES) {
          showToast({
            message: `Recording failed. Retrying... (${retryCount + 1}/${MAX_RETRIES})`,
            type: "warning",
          });
          await new Promise((r) => setTimeout(r, 1000 * (retryCount + 1)));
          return startRecording(retryCount + 1);
        }

        showToast({
          message: data?.error || "Unable to start recording.",
          type: "error",
          action: retryCount >= MAX_RETRIES
            ? { label: "Try again", onClick: () => startRecording(0) }
            : undefined,
        });
        return;
      }

      setIsRecording(true);
      setEgressId(data.egressId);
      showToast({ message: "Recording started.", type: "success" }, 3000);
    } catch (err) {
      console.error("[Recording] Error starting recording:", err);

      if (retryCount < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 1000 * (retryCount + 1)));
        return startRecording(retryCount + 1);
      }

      showToast({
        message: "Network error. Please check your connection.",
        type: "error",
        action: { label: "Retry", onClick: () => startRecording(0) },
      });
    } finally {
      setIsRecordingLoading(false);
    }
  };

  const stopRecording = async (retryCount = 0) => {
    const MAX_RETRIES = 2;
    setIsRecordingLoading(true);

    try {
      const response = await fetch("/api/livekit/recording", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomName, action: "stop", egressId }),
      });

      const stopData = await response.json();

      if (!response.ok) {
        console.error("[Recording] Stop error:", response.status, stopData);

        if (response.status >= 500 && retryCount < MAX_RETRIES) {
          showToast({
            message: `Stop failed. Retrying... (${retryCount + 1}/${MAX_RETRIES})`,
            type: "warning",
          });
          await new Promise((r) => setTimeout(r, 1000 * (retryCount + 1)));
          return stopRecording(retryCount + 1);
        }

        showToast({
          message: stopData?.error || "Unable to stop recording.",
          type: "error",
          action: retryCount >= MAX_RETRIES
            ? { label: "Try again", onClick: () => stopRecording(0) }
            : undefined,
        });
        return;
      }

      setIsRecording(false);
      setEgressId(null);
      showToast({ message: "Recording stopped.", type: "success" }, 3000);
    } catch (err) {
      console.error("[Recording] Error stopping recording:", err);

      if (retryCount < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 1000 * (retryCount + 1)));
        return stopRecording(retryCount + 1);
      }

      showToast({
        message: "Network error. Please check your connection.",
        type: "error",
        action: { label: "Retry", onClick: () => stopRecording(0) },
      });
    } finally {
      setIsRecordingLoading(false);
    }
  };

  const handleToggleRecording = () => {
    if (!recordingEnabled) return;
    if (isRecording) {
      stopRecording();
    } else {
      if (hasConsent) {
        startRecording();
      } else {
        setShowConsentModal(true);
      }
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 bg-card rounded-full shadow-xl",
        className
      )}
    >
      <div className="flex items-center gap-1.5">
        <ControlButton
          enabled={micEnabled}
          buttonProps={micButtonProps}
          enabledIcon={<Mic className="h-4 w-4" />}
          disabledIcon={<MicOff className="h-4 w-4" />}
          label={micEnabled ? "Mute" : "Unmute"}
          type="toggle"
        />
        {micEnabled && <MicVolumeIndicator className="h-5" />}
      </div>

      <ControlButton
        enabled={cameraEnabled}
        buttonProps={cameraButtonProps}
        enabledIcon={<Video className="h-4 w-4" />}
        disabledIcon={<VideoOff className="h-4 w-4" />}
        label={cameraEnabled ? "Turn off camera" : "Turn on camera"}
        type="toggle"
      />

      {isTutor && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleScreenShare}
              aria-label={isScreenSharing ? "Stop screen share" : "Share screen"}
              className={cn(
                "h-10 w-10 rounded-full transition-all duration-200",
                isScreenSharing
                  ? "bg-emerald-500 text-white hover:bg-emerald-600"
                  : "bg-card text-foreground hover:bg-muted shadow-sm"
              )}
            >
              {isScreenSharing ? (
                <MonitorOff className="h-4 w-4" />
              ) : (
                <MonitorUp className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            {isScreenSharing ? "Stop sharing" : "Share screen"}
          </TooltipContent>
        </Tooltip>
      )}

      {isTutor && recordingEnabled && (
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {isRecording && !isRecordingLoading && (
            <span className="hidden sm:inline text-xs font-medium text-red-600 tabular-nums min-w-[3rem]">
              {formatRecordingTime(recordingSeconds)}
            </span>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleRecording}
                disabled={isRecordingLoading}
                aria-label={isRecording ? "Stop recording" : "Start recording"}
                data-testid={isRecording ? "classroom-record-stop" : "classroom-record-start"}
                className={cn(
                  "h-10 w-10 rounded-full transition-all duration-300 relative overflow-hidden flex-shrink-0",
                  isRecording
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "bg-card text-foreground hover:bg-muted shadow-sm"
                )}
              >
                {isRecordingLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isRecording ? (
                  <Square className="h-3.5 w-3.5 fill-current" />
                ) : (
                  <Circle className="h-4 w-4 fill-red-500 text-red-500" />
                )}
                {isRecording && !isRecordingLoading && (
                  <span className="absolute inset-0 rounded-full animate-pulse bg-red-400/20" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              {isRecording ? "Stop recording" : "Start recording"}
            </TooltipContent>
          </Tooltip>
        </div>
      )}

      {recordingEnabled && !isTutor && isRecording && (
        <div className="flex items-center gap-1.5 px-2 py-1 bg-red-50 rounded-full">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
          <span className="text-xs text-red-600 font-medium">REC</span>
        </div>
      )}

      <div className="w-px h-8 bg-border mx-1" />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            {...disconnectButtonRest}
            onClick={handleDisconnect}
            aria-label="Leave meeting"
            className="h-10 w-10 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all duration-200"
          >
            <PhoneOff className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">Leave</TooltipContent>
      </Tooltip>

      {recordingEnabled && (
        <RecordingConsentModal
          open={showConsentModal}
          onOpenChange={setShowConsentModal}
          onConfirm={startRecording}
          onCancel={() => setShowConsentModal(false)}
        />
      )}

      {toasts.length > 0 && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-auto">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={cn(
                "min-w-[280px] max-w-[400px] rounded-xl border px-4 py-3 shadow-lg",
                "flex items-start gap-3 animate-in slide-in-from-bottom-2 fade-in duration-200",
                toast.type === "error" && "bg-red-50 border-red-200 text-red-900",
                toast.type === "warning" && "bg-amber-50 border-amber-200 text-amber-900",
                toast.type === "success" && "bg-emerald-50 border-emerald-200 text-emerald-900",
                toast.type === "info" && "bg-blue-50 border-blue-200 text-blue-900"
              )}
              role="alert"
            >
              <div className="flex-1">
                <p className="text-sm font-medium">{toast.message}</p>
                {toast.action && (
                  <button
                    onClick={toast.action.onClick}
                    className="mt-1 text-xs font-medium underline hover:no-underline"
                  >
                    {toast.action.label}
                  </button>
                )}
              </div>
              <button
                onClick={() => dismissToast(toast.id)}
                className="text-current opacity-60 hover:opacity-100 transition-opacity"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface ControlButtonProps {
  enabled: boolean;
  buttonProps: React.ButtonHTMLAttributes<HTMLButtonElement>;
  enabledIcon: React.ReactNode;
  disabledIcon: React.ReactNode;
  label: string;
  type?: "toggle" | "highlight";
}

function ControlButton({
  enabled,
  buttonProps,
  enabledIcon,
  disabledIcon,
  label,
  type = "toggle",
}: ControlButtonProps) {
  const isOff = !enabled && type === "toggle";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          {...buttonProps}
          aria-label={label}
          className={cn(
            "h-10 w-10 rounded-full transition-all duration-200",
            "bg-card text-foreground hover:bg-muted shadow-sm",
            isOff && "bg-red-500 text-white hover:bg-red-600 shadow-sm"
          )}
        >
          {enabled ? enabledIcon : disabledIcon}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
}

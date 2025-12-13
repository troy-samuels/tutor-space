"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Track } from "livekit-client";
import {
  useTrackToggle,
  useDisconnectButton,
  useLocalParticipant,
} from "@livekit/components-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  MonitorOff,
  PhoneOff,
  Circle,
  Square,
  Loader2,
  Settings,
  PictureInPicture,
  LayoutGrid,
  Check,
  MoreHorizontal,
  ChevronLeft,
  X,
} from "lucide-react";
import { BackgroundBlur } from "@livekit/track-processors";
import { cn } from "@/lib/utils";
import { MicVolumeIndicator } from "./MicVolumeIndicator";
import {
  RecordingConsentModal,
  useRecordingConsent,
} from "./RecordingConsentModal";

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
  layoutMode: "grid" | "presentation" | "cinema";
  onLayoutModeChange: (mode: "grid" | "presentation" | "cinema") => void;
  recordingEnabled?: boolean;
}

export function ControlBar({
  roomName,
  isTutor,
  className,
  layoutMode,
  onLayoutModeChange,
  recordingEnabled = true,
}: ControlBarProps) {
  // Toast notifications - defined first so error handlers can use it
  const [toasts, setToasts] = useState<ControlBarToast[]>([]);
  const toastTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const showToast = useCallback(
    (toast: Omit<ControlBarToast, "id">, duration = 5000) => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev.slice(-2), { ...toast, id }]); // Max 3 toasts

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

  // Track toggles with error handling
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

  const {
    buttonProps: screenShareButtonPropsRaw,
    enabled: screenShareEnabled,
    pending: screenSharePending,
  } = useTrackToggle({
    source: Track.Source.ScreenShare,
    onDeviceError: (err) => {
      const msg = err?.message?.toLowerCase() || "";
      if (msg.includes("permission") || msg.includes("denied")) {
        showToast({ message: "Screen share permission denied.", type: "error" });
      } else {
        showToast({ message: err?.message || "Unable to start screen sharing.", type: "error" });
      }
    },
  });

  const { localParticipant } = useLocalParticipant();

  // Disconnect
  const { buttonProps: disconnectButtonProps } = useDisconnectButton({
    stopTracks: true,
  });

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isRecordingLoading, setIsRecordingLoading] = useState(false);
  const [egressId, setEgressId] = useState<string | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const { hasConsent } = useRecordingConsent();

  // Background blur
  const [blurEnabled, setBlurEnabled] = useState(false);
  const [isApplyingBlur, setIsApplyingBlur] = useState(false);
  const blurProcessorRef = useRef<ReturnType<typeof BackgroundBlur> | null>(null);
  const [blurError, setBlurError] = useState<string | null>(null);

  // PiP
  const [isRequestingPiP, setIsRequestingPiP] = useState(false);

  // Collapsible controls
  const [isExpanded, setIsExpanded] = useState(false);

  const screenShareButtonProps = {
    ...screenShareButtonPropsRaw,
    disabled: screenSharePending || screenShareButtonPropsRaw.disabled,
  } satisfies React.ButtonHTMLAttributes<HTMLButtonElement>;

  // Check recording status (booking rooms only)
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

  // Recording timer
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

  // Clean up blur processor on unmount
  useEffect(() => {
    return () => {
      const publication = localParticipant?.getTrackPublication(Track.Source.Camera);
      const track = publication?.track;
      if (track) {
        void (track as any).setProcessor(undefined);
      }
    };
  }, [localParticipant]);

  // Clean up toast timeouts on unmount
  useEffect(() => {
    const timeouts = toastTimeoutRef.current;
    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout));
      timeouts.clear();
    };
  }, []);

  // Reset blur state if camera is off
  useEffect(() => {
    if (!cameraEnabled && blurEnabled) {
      setBlurEnabled(false);
    }
  }, [cameraEnabled, blurEnabled]);

  const toggleBlur = useCallback(
    async (nextEnabled: boolean) => {
      setBlurError(null);
      if (!localParticipant) {
        setBlurError("Camera not ready yet.");
        return;
      }

      const publication = localParticipant.getTrackPublication(Track.Source.Camera);
      const track = publication?.track;

      if (!track) {
        setBlurError("Camera track unavailable.");
        setBlurEnabled(false);
        return;
      }

      setIsApplyingBlur(true);

      try {
        if (nextEnabled) {
          if (!blurProcessorRef.current) {
            blurProcessorRef.current = BackgroundBlur();
          }
          await track.setProcessor(blurProcessorRef.current as NonNullable<ReturnType<typeof BackgroundBlur>>);
        } else {
          await (track as any).setProcessor(undefined);
        }
        setBlurEnabled(nextEnabled);
      } catch (err) {
        console.error("[Blur] Failed to toggle blur", err);
        setBlurError("Unable to apply blur. Try again.");
        showToast({ message: "Unable to apply background blur.", type: "error" });
        setBlurEnabled(false);
      } finally {
        setIsApplyingBlur(false);
      }
    },
    [localParticipant, showToast]
  );

  const handleTogglePiP = async () => {
    setIsRequestingPiP(true);

    try {
      const selectors = [
        'video[data-lk-local-participant="false"][data-lk-source="camera"]',
        'video[data-lk-local-participant="false"][data-lk-source="screen_share"]',
        'video[data-lk-local-participant="false"]',
      ] as const;

      let remoteVideo: HTMLVideoElement | null = null;
      for (const selector of selectors) {
        const candidates = Array.from(document.querySelectorAll<HTMLVideoElement>(selector));
        remoteVideo =
          candidates.find((v) => v.readyState >= 2 && !v.paused) ??
          candidates.find((v) => v.readyState >= 2) ??
          candidates[0] ??
          null;
        if (remoteVideo) break;
      }

      if (!remoteVideo) {
        showToast({ message: "No remote video available for Picture-in-Picture.", type: "info" });
        return;
      }

      if (!("requestPictureInPicture" in remoteVideo)) {
        showToast({ message: "Picture-in-Picture is not supported by this browser.", type: "warning" });
        return;
      }

      if (document.pictureInPictureElement && document.pictureInPictureElement !== remoteVideo) {
        await document.exitPictureInPicture();
      }

      if (document.pictureInPictureElement === remoteVideo) {
        await document.exitPictureInPicture();
        showToast({ message: "Exited Picture-in-Picture.", type: "info" }, 3000);
        return;
      }

      await remoteVideo.requestPictureInPicture();
      showToast({ message: "Picture-in-Picture started.", type: "success" }, 3000);
    } catch (err) {
      console.error("[PiP] Failed to start Picture-in-Picture", err);
      showToast({ message: "Failed to start Picture-in-Picture.", type: "error" });
    } finally {
      setIsRequestingPiP(false);
    }
  };

  // Format recording time as MM:SS or H:MM:SS
  const formatRecordingTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    if (h > 0) {
      return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Start recording with retry mechanism
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

        // Retry on server errors (5xx)
        if (response.status >= 500 && retryCount < MAX_RETRIES) {
          showToast({
            message: `Recording failed. Retrying... (${retryCount + 1}/${MAX_RETRIES})`,
            type: "warning",
          });
          await new Promise((r) => setTimeout(r, 1000 * (retryCount + 1))); // Exponential backoff
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

  // Stop recording with retry mechanism
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

        // Retry on server errors (5xx)
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
      // Stop recording directly
      stopRecording();
    } else {
      // Check if we need consent
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
        "flex items-center gap-3 px-4 py-3 bg-card rounded-full shadow-xl",
        className
      )}
    >
      {/* Essential Controls - Always Visible */}

      {/* Mic Toggle with Volume Indicator */}
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

      {/* Camera Toggle */}
      <ControlButton
        enabled={cameraEnabled}
        buttonProps={cameraButtonProps}
        enabledIcon={<Video className="h-4 w-4" />}
        disabledIcon={<VideoOff className="h-4 w-4" />}
        label={cameraEnabled ? "Stop video" : "Start video"}
        type="toggle"
      />

      {/* Expand/Collapse Button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label={isExpanded ? "Collapse controls" : "More controls"}
            className="h-10 w-10 rounded-full bg-card text-foreground hover:bg-muted shadow-sm"
          >
            {isExpanded ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <MoreHorizontal className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          {isExpanded ? "Collapse" : "More controls"}
        </TooltipContent>
      </Tooltip>

      {/* Secondary Controls - Collapsible */}
      <div
        className={cn(
          "flex items-center gap-3 min-w-0 overflow-hidden transition-all duration-300 ease-in-out",
          isExpanded
            ? "max-w-[500px] opacity-100"
            : "max-w-0 opacity-0 pointer-events-none"
        )}
      >
        {/* Layout selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Layout"
              title="Layout"
              className="h-10 w-10 rounded-full bg-card text-foreground hover:bg-muted shadow-sm flex-shrink-0"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-44">
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Stage layout
            </DropdownMenuLabel>
            {[
              { value: "grid", label: "Grid (50/50)" },
              { value: "presentation", label: "Presentation" },
              { value: "cinema", label: "Cinema" },
            ].map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => {
                  onLayoutModeChange(option.value as ControlBarProps["layoutMode"]);
                }}
                className="flex items-center justify-between text-sm"
              >
                <span>{option.label}</span>
                <div className="flex items-center gap-1">
                  {(option.value === "presentation" || option.value === "cinema") && !screenShareEnabled && (
                    <span className="text-[10px] text-muted-foreground">(no share)</span>
                  )}
                  {layoutMode === option.value && (
                    <Check className="h-4 w-4 text-emerald-500" />
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Settings (Background blur) */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Video settings"
              title="Video settings"
              className="h-10 w-10 rounded-full bg-card text-foreground hover:bg-muted shadow-sm flex-shrink-0"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Blur background</p>
                <p className="text-xs text-muted-foreground">
                  Softly blur your camera backdrop.
                </p>
              </div>
              <Switch
                checked={blurEnabled}
                onCheckedChange={(checked) => toggleBlur(checked)}
                disabled={!cameraEnabled || isApplyingBlur}
                aria-label="Toggle background blur"
              />
            </div>
            {!cameraEnabled && (
              <p className="mt-2 text-xs text-muted-foreground">
                Enable camera to use background blur.
              </p>
            )}
            {isApplyingBlur && (
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Applying blur...
              </div>
            )}
            {blurError && (
              <p className="mt-2 text-xs text-red-600">{blurError}</p>
            )}
          </PopoverContent>
        </Popover>

        {/* Screen Share Toggle */}
        <ControlButton
          enabled={screenShareEnabled}
          buttonProps={screenShareButtonProps}
          enabledIcon={<MonitorOff className="h-4 w-4" />}
          disabledIcon={<MonitorUp className="h-4 w-4" />}
          label={screenShareEnabled ? "Stop sharing" : "Share screen"}
          type="highlight"
        />

        {/* Picture-in-Picture */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleTogglePiP}
              disabled={isRequestingPiP}
              aria-label="Picture-in-Picture"
              className="h-10 w-10 rounded-full bg-card text-foreground hover:bg-muted shadow-sm flex-shrink-0"
            >
              {isRequestingPiP ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <PictureInPicture className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">Picture-in-Picture</TooltipContent>
        </Tooltip>

        {/* Recording Button (Tutors Only, booking rooms only) */}
        {isTutor && recordingEnabled && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Recording Timer */}
            {isRecording && !isRecordingLoading && (
              <span className="text-xs font-medium text-red-600 tabular-nums min-w-[3rem]">
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
                  {/* Subtle breathing animation when recording */}
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
      </div>


      {/* Recording indicator for students (always visible when recording) */}
      {recordingEnabled && !isTutor && isRecording && (
        <div className="flex items-center gap-1.5 px-2 py-1 bg-red-50 rounded-full">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
          <span className="text-xs text-red-600 font-medium">REC</span>
        </div>
      )}

      {/* Separator */}
      <div className="w-px h-8 bg-border mx-1" />

      {/* Leave Button - Always Visible */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            {...disconnectButtonProps}
            aria-label="Leave meeting"
            className="h-10 w-10 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all duration-200"
          >
            <PhoneOff className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">Leave</TooltipContent>
      </Tooltip>

      {/* Recording Consent Modal */}
      {recordingEnabled && (
        <RecordingConsentModal
          open={showConsentModal}
          onOpenChange={setShowConsentModal}
          onConfirm={startRecording}
          onCancel={() => setShowConsentModal(false)}
        />
      )}

      {/* Toast notifications - fixed position above control bar */}
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

// Helper component for consistent control buttons
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
  const isActive = enabled && type === "highlight";

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
            // Default (ON): Card background with foreground icon
            "bg-card text-foreground hover:bg-muted shadow-sm",
            // OFF state: Red with white icon
            isOff && "bg-red-500 text-white hover:bg-red-600 shadow-sm",
            // Active highlight (screen share): Emerald green
            isActive && "bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm"
          )}
        >
          {enabled ? enabledIcon : disabledIcon}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
}

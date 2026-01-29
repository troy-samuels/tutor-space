"use client";

import { useCallback, useEffect, useState } from "react";
import { useRoomContext } from "@livekit/components-react";
import { ConnectionQuality, RoomEvent, Participant } from "livekit-client";
import { cn } from "@/lib/utils";
import {
  Wifi,
  WifiOff,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  VideoOff,
} from "lucide-react";

// ============================================
// TYPES
// ============================================

export type ConnectionState = "excellent" | "good" | "poor" | "lost" | "unknown";

export interface ConnectionQualityIndicatorProps {
  className?: string;
  showTips?: boolean;
  onVideoToggleSuggested?: () => void;
  compact?: boolean;
}

interface TipConfig {
  message: string;
  action?: string;
  icon: React.ReactNode;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function mapQualityToState(quality: ConnectionQuality): ConnectionState {
  switch (quality) {
    case ConnectionQuality.Excellent:
      return "excellent";
    case ConnectionQuality.Good:
      return "good";
    case ConnectionQuality.Poor:
      return "poor";
    case ConnectionQuality.Lost:
      return "lost";
    default:
      return "unknown";
  }
}

function getStateConfig(state: ConnectionState): {
  label: string;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
  tip: TipConfig | null;
} {
  switch (state) {
    case "excellent":
      return {
        label: "Excellent",
        color: "text-emerald-500",
        bgColor: "bg-emerald-500/10",
        icon: <CheckCircle className="w-4 h-4" />,
        tip: null,
      };
    case "good":
      return {
        label: "Good",
        color: "text-emerald-400",
        bgColor: "bg-emerald-400/10",
        icon: <Wifi className="w-4 h-4" />,
        tip: null,
      };
    case "poor":
      return {
        label: "Poor",
        color: "text-amber-500",
        bgColor: "bg-amber-500/10",
        icon: <AlertTriangle className="w-4 h-4" />,
        tip: {
          message: "Your connection is unstable",
          action: "Try turning off video to improve quality",
          icon: <VideoOff className="w-3.5 h-3.5" />,
        },
      };
    case "lost":
      return {
        label: "Disconnected",
        color: "text-red-500",
        bgColor: "bg-red-500/10",
        icon: <WifiOff className="w-4 h-4" />,
        tip: {
          message: "Connection lost",
          action: "Attempting to reconnect...",
          icon: <Wifi className="w-3.5 h-3.5 animate-pulse" />,
        },
      };
    default:
      return {
        label: "Checking...",
        color: "text-slate-400",
        bgColor: "bg-slate-400/10",
        icon: <Wifi className="w-4 h-4 animate-pulse" />,
        tip: null,
      };
  }
}

// ============================================
// SIGNAL BARS COMPONENT
// ============================================

function SignalBars({ state }: { state: ConnectionState }) {
  const barCount = 4;
  const activeBars =
    state === "excellent" ? 4 :
    state === "good" ? 3 :
    state === "poor" ? 2 :
    state === "lost" ? 0 : 1;

  const color =
    state === "excellent" || state === "good" ? "bg-emerald-500" :
    state === "poor" ? "bg-amber-500" :
    state === "lost" ? "bg-red-500" : "bg-slate-400";

  return (
    <div className="flex items-end gap-0.5 h-4">
      {Array.from({ length: barCount }, (_, i) => (
        <div
          key={i}
          className={cn(
            "w-1 rounded-sm transition-all duration-200",
            i < activeBars ? color : "bg-slate-600/50"
          )}
          style={{ height: `${((i + 1) / barCount) * 100}%` }}
        />
      ))}
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function ConnectionQualityIndicator({
  className,
  showTips = true,
  onVideoToggleSuggested,
  compact = false,
}: ConnectionQualityIndicatorProps) {
  const room = useRoomContext();
  const [connectionState, setConnectionState] = useState<ConnectionState>("unknown");
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Track connection quality changes
  useEffect(() => {
    if (!room) return;

    const handleQualityChange = (
      quality: ConnectionQuality,
      participant?: Participant
    ) => {
      if (participant && !participant.isLocal) return;
      const newState = mapQualityToState(quality);
      setConnectionState(newState);

      // Auto-expand on poor connection
      if (newState === "poor" || newState === "lost") {
        setExpanded(true);
        setDismissed(false);
      }
    };

    // Get initial quality
    if (room.localParticipant) {
      handleQualityChange(
        room.localParticipant.connectionQuality,
        room.localParticipant
      );
    }

    room.on(RoomEvent.ConnectionQualityChanged, handleQualityChange);

    return () => {
      room.off(RoomEvent.ConnectionQualityChanged, handleQualityChange);
    };
  }, [room]);

  const config = getStateConfig(connectionState);

  const handleTipAction = useCallback(() => {
    if (connectionState === "poor" && onVideoToggleSuggested) {
      onVideoToggleSuggested();
    }
  }, [connectionState, onVideoToggleSuggested]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    setExpanded(false);
  }, []);

  // Compact mode - just signal bars
  if (compact) {
    return (
      <div
        className={cn(
          "flex items-center gap-1.5 px-2 py-1 rounded-full",
          config.bgColor,
          className
        )}
        title={`Connection: ${config.label}`}
      >
        <SignalBars state={connectionState} />
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {/* Main indicator badge */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full transition-all",
          "border border-white/10 backdrop-blur-sm shadow-sm",
          config.bgColor,
          "hover:bg-opacity-20"
        )}
      >
        <span className={config.color}>{config.icon}</span>
        <SignalBars state={connectionState} />
        <span className={cn("text-xs font-medium", config.color)}>
          {config.label}
        </span>
        {showTips && config.tip && !dismissed && (
          <span className={cn("transition-transform", expanded ? "rotate-180" : "")}>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </span>
        )}
      </button>

      {/* Expanded tip panel */}
      {showTips && config.tip && expanded && !dismissed && (
        <div
          className={cn(
            "absolute top-full right-0 mt-2 w-72 p-4 rounded-xl",
            "bg-slate-900/95 border border-white/10 backdrop-blur-lg shadow-xl",
            "animate-in fade-in slide-in-from-top-2 duration-200"
          )}
        >
          <div className="flex items-start gap-3">
            <div className={cn("p-2 rounded-lg", config.bgColor)}>
              <span className={config.color}>{config.icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">
                {config.tip.message}
              </p>
              {config.tip.action && (
                <p className="mt-1 text-xs text-slate-400">
                  {config.tip.action}
                </p>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-4 flex items-center gap-2">
            {connectionState === "poor" && onVideoToggleSuggested && (
              <button
                onClick={handleTipAction}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium",
                  "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors"
                )}
              >
                <VideoOff className="w-3.5 h-3.5" />
                Turn off video
              </button>
            )}
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// FLOATING INDICATOR (for bottom-corner positioning)
// ============================================

export function FloatingConnectionIndicator({
  className,
  ...props
}: ConnectionQualityIndicatorProps) {
  return (
    <div className={cn("fixed bottom-24 right-4 z-50", className)}>
      <ConnectionQualityIndicator {...props} />
    </div>
  );
}

// ============================================
// INLINE STATUS (for header/toolbar)
// ============================================

export function InlineConnectionStatus({ className }: { className?: string }) {
  const room = useRoomContext();
  const [connectionState, setConnectionState] = useState<ConnectionState>("unknown");

  useEffect(() => {
    if (!room) return;

    const handleQualityChange = (
      quality: ConnectionQuality,
      participant?: Participant
    ) => {
      if (participant && !participant.isLocal) return;
      setConnectionState(mapQualityToState(quality));
    };

    if (room.localParticipant) {
      handleQualityChange(
        room.localParticipant.connectionQuality,
        room.localParticipant
      );
    }

    room.on(RoomEvent.ConnectionQualityChanged, handleQualityChange);

    return () => {
      room.off(RoomEvent.ConnectionQualityChanged, handleQualityChange);
    };
  }, [room]);

  const config = getStateConfig(connectionState);

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-xs",
        config.color,
        className
      )}
    >
      {config.icon}
      <span className="hidden sm:inline">{config.label}</span>
    </div>
  );
}

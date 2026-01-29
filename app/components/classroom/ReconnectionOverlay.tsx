"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRoomContext } from "@livekit/components-react";
import { ConnectionState, RoomEvent } from "livekit-client";
import { cn } from "@/lib/utils";
import {
  Wifi,
  WifiOff,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
} from "lucide-react";

// ============================================
// TYPES
// ============================================

export type ReconnectionState =
  | "connected"
  | "reconnecting"
  | "reconnected"
  | "disconnected"
  | "failed";

export interface ReconnectionOverlayProps {
  className?: string;
  maxRetries?: number;
  onReconnectionFailed?: () => void;
  onManualReconnect?: () => void;
}

interface ReconnectionConfig {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  showCountdown: boolean;
  showRetryButton: boolean;
  bgColor: string;
}

// ============================================
// CONSTANTS
// ============================================

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 8000;

// ============================================
// HELPER FUNCTIONS
// ============================================

function getReconnectionConfig(
  state: ReconnectionState,
  attempt: number,
  maxRetries: number
): ReconnectionConfig {
  switch (state) {
    case "reconnecting":
      return {
        title: "Reconnecting...",
        subtitle: `Attempt ${attempt} of ${maxRetries}`,
        icon: <RefreshCw className="w-8 h-8 animate-spin" />,
        showCountdown: true,
        showRetryButton: false,
        bgColor: "from-amber-500/20 to-amber-500/5",
      };
    case "reconnected":
      return {
        title: "Back online!",
        subtitle: "Connection restored successfully",
        icon: <CheckCircle className="w-8 h-8 text-emerald-400" />,
        showCountdown: false,
        showRetryButton: false,
        bgColor: "from-emerald-500/20 to-emerald-500/5",
      };
    case "disconnected":
      return {
        title: "Connection lost",
        subtitle: "Trying to reconnect automatically...",
        icon: <WifiOff className="w-8 h-8 text-amber-400" />,
        showCountdown: true,
        showRetryButton: false,
        bgColor: "from-amber-500/20 to-amber-500/5",
      };
    case "failed":
      return {
        title: "Unable to reconnect",
        subtitle: "Please check your internet connection",
        icon: <AlertTriangle className="w-8 h-8 text-red-400" />,
        showCountdown: false,
        showRetryButton: true,
        bgColor: "from-red-500/20 to-red-500/5",
      };
    default:
      return {
        title: "",
        subtitle: "",
        icon: null,
        showCountdown: false,
        showRetryButton: false,
        bgColor: "",
      };
  }
}

// ============================================
// COUNTDOWN COMPONENT
// ============================================

function CountdownTimer({
  seconds,
  className,
}: {
  seconds: number;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2 text-sm text-slate-400", className)}>
      <Clock className="w-4 h-4" />
      <span>Retrying in {seconds}s</span>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function ReconnectionOverlay({
  className,
  maxRetries = MAX_RETRIES,
  onReconnectionFailed,
  onManualReconnect,
}: ReconnectionOverlayProps) {
  const room = useRoomContext();
  const [reconnectionState, setReconnectionState] = useState<ReconnectionState>("connected");
  const [currentAttempt, setCurrentAttempt] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [visible, setVisible] = useState(false);

  const isMountedRef = useRef(true);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptRef = useRef(0);
  const reconnectionStateRef = useRef<ReconnectionState>("connected");

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    reconnectionStateRef.current = reconnectionState;
  }, [reconnectionState]);

  // Start countdown timer
  const startCountdown = useCallback((seconds: number) => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setCountdown(seconds);

    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // Handle room events
  useEffect(() => {
    if (!room) return;

    const handleReconnecting = () => {
      if (!isMountedRef.current) return;
      if (reconnectionStateRef.current === "reconnecting") return;
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);

      const nextAttempt = Math.min(attemptRef.current + 1, maxRetries);
      attemptRef.current = nextAttempt;
      setReconnectionState("reconnecting");
      reconnectionStateRef.current = "reconnecting";
      setCurrentAttempt(nextAttempt);
      setVisible(true);

      // Calculate backoff delay
      const delay = Math.min(
        MAX_DELAY_MS,
        BASE_DELAY_MS * Math.pow(2, Math.max(0, nextAttempt - 1))
      );
      startCountdown(Math.ceil(delay / 1000));
    };

    const handleReconnected = () => {
      if (!isMountedRef.current) return;
      setReconnectionState("reconnected");
      reconnectionStateRef.current = "reconnected";
      attemptRef.current = 0;
      setCurrentAttempt(0);
      if (countdownRef.current) clearInterval(countdownRef.current);

      // Auto-hide after showing success
      hideTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          setVisible(false);
          setReconnectionState("connected");
        }
      }, 2000);
    };

    const handleDisconnected = () => {
      if (!isMountedRef.current) return;

      if (attemptRef.current >= maxRetries) {
        setReconnectionState("failed");
        reconnectionStateRef.current = "failed";
        setVisible(true);
        onReconnectionFailed?.();
      } else {
        setReconnectionState("disconnected");
        reconnectionStateRef.current = "disconnected";
        setVisible(true);
      }
    };

    const handleStateChange = (state: ConnectionState) => {
      if (!isMountedRef.current) return;

      switch (state) {
        case ConnectionState.Connected:
          if (
            reconnectionStateRef.current === "reconnecting" ||
            reconnectionStateRef.current === "disconnected"
          ) {
            handleReconnected();
          }
          break;
        case ConnectionState.Reconnecting:
          handleReconnecting();
          break;
        case ConnectionState.Disconnected:
          handleDisconnected();
          break;
      }
    };

    room.on(RoomEvent.SignalReconnecting, handleReconnecting);
    room.on(RoomEvent.Reconnecting, handleReconnecting);
    room.on(RoomEvent.Reconnected, handleReconnected);
    room.on(RoomEvent.Disconnected, handleDisconnected);
    room.on(RoomEvent.ConnectionStateChanged, handleStateChange);

    return () => {
      room.off(RoomEvent.SignalReconnecting, handleReconnecting);
      room.off(RoomEvent.Reconnecting, handleReconnecting);
      room.off(RoomEvent.Reconnected, handleReconnected);
      room.off(RoomEvent.Disconnected, handleDisconnected);
      room.off(RoomEvent.ConnectionStateChanged, handleStateChange);
    };
  }, [room, maxRetries, startCountdown, onReconnectionFailed]);

  const handleManualRetry = useCallback(() => {
    const nextAttempt = Math.min(1, maxRetries);
    attemptRef.current = nextAttempt;
    setCurrentAttempt(nextAttempt);
    setReconnectionState("reconnecting");
    reconnectionStateRef.current = "reconnecting";
    setVisible(true);
    onManualReconnect?.();
  }, [maxRetries, onManualReconnect]);

  // Don't render if connected
  if (!visible || reconnectionState === "connected") {
    return null;
  }

  const config = getReconnectionConfig(reconnectionState, currentAttempt, maxRetries);

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center",
        "bg-black/60 backdrop-blur-sm",
        "animate-in fade-in duration-200",
        className
      )}
    >
      <div
        className={cn(
          "relative w-full max-w-sm mx-4 p-6 rounded-2xl",
          "bg-gradient-to-b border border-white/10",
          "bg-slate-900/95 shadow-2xl",
          config.bgColor
        )}
      >
        {/* Progress indicator for reconnecting state */}
        {reconnectionState === "reconnecting" && (
          <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl overflow-hidden bg-white/5">
            <div
              className="h-full bg-amber-500 transition-all duration-1000"
              style={{
                width: `${((maxRetries - currentAttempt + 1) / maxRetries) * 100}%`,
              }}
            />
          </div>
        )}

        <div className="flex flex-col items-center text-center">
          {/* Icon */}
          <div
            className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center mb-4",
              reconnectionState === "reconnected" ? "bg-emerald-500/20" :
              reconnectionState === "failed" ? "bg-red-500/20" :
              "bg-amber-500/20"
            )}
          >
            <span
              className={cn(
                reconnectionState === "reconnected" ? "text-emerald-400" :
                reconnectionState === "failed" ? "text-red-400" :
                "text-amber-400"
              )}
            >
              {config.icon}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-white mb-1">
            {config.title}
          </h3>

          {/* Subtitle */}
          <p className="text-sm text-slate-400 mb-4">
            {config.subtitle}
          </p>

          {/* Countdown */}
          {config.showCountdown && countdown > 0 && (
            <CountdownTimer seconds={countdown} className="mb-4" />
          )}

          {/* Retry button */}
          {config.showRetryButton && (
            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={handleManualRetry}
                className={cn(
                  "w-full flex items-center justify-center gap-2",
                  "px-4 py-2.5 rounded-xl font-medium text-sm",
                  "bg-white text-slate-900 hover:bg-slate-100",
                  "transition-colors"
                )}
              >
                <RefreshCw className="w-4 h-4" />
                Try again
              </button>
              <p className="text-xs text-slate-500">
                If problems persist, try refreshing the page or checking your network settings.
              </p>
            </div>
          )}

          {/* Tips during reconnection */}
          {reconnectionState === "reconnecting" && (
            <div className="mt-4 p-3 rounded-lg bg-white/5 text-xs text-slate-400">
              <p className="flex items-center gap-2">
                <Wifi className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Chat messages are preserved during brief disconnections</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// MINIMAL TOAST-STYLE INDICATOR
// ============================================

export function ReconnectionToast({
  className,
}: {
  className?: string;
}) {
  const room = useRoomContext();
  const [state, setState] = useState<ReconnectionState>("connected");
  const [visible, setVisible] = useState(false);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!room) return;

    const showToast = (newState: ReconnectionState) => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      setState(newState);
      setVisible(true);

      if (newState === "reconnected") {
        hideTimeoutRef.current = setTimeout(() => setVisible(false), 2000);
      }
    };

    const handleReconnecting = () => showToast("reconnecting");
    const handleReconnected = () => showToast("reconnected");
    const handleDisconnected = () => showToast("disconnected");

    room.on(RoomEvent.Reconnecting, handleReconnecting);
    room.on(RoomEvent.Reconnected, handleReconnected);
    room.on(RoomEvent.Disconnected, handleDisconnected);

    return () => {
      room.off(RoomEvent.Reconnecting, handleReconnecting);
      room.off(RoomEvent.Reconnected, handleReconnected);
      room.off(RoomEvent.Disconnected, handleDisconnected);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, [room]);

  if (!visible) return null;

  return (
    <div
      className={cn(
        "fixed top-4 left-1/2 -translate-x-1/2 z-50",
        "px-4 py-2 rounded-full",
        "flex items-center gap-2 text-sm font-medium",
        "shadow-lg backdrop-blur-sm border border-white/10",
        "animate-in slide-in-from-top-2 fade-in duration-200",
        state === "reconnected" && "bg-emerald-500/20 text-emerald-400",
        state === "reconnecting" && "bg-amber-500/20 text-amber-400",
        state === "disconnected" && "bg-red-500/20 text-red-400",
        className
      )}
    >
      {state === "reconnecting" && (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Reconnecting...</span>
        </>
      )}
      {state === "reconnected" && (
        <>
          <CheckCircle className="w-4 h-4" />
          <span>Back online</span>
        </>
      )}
      {state === "disconnected" && (
        <>
          <WifiOff className="w-4 h-4" />
          <span>Connection lost</span>
        </>
      )}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRoomContext } from "@livekit/components-react";
import { ConnectionState, RoomEvent } from "livekit-client";

export type ConnectionToastState = {
  id: number;
  message: string;
  tone: "warning" | "success";
};

interface ConnectionMonitorOptions {
  serverUrl?: string;
  token?: string;
  maxRetries?: number;
  onGiveUp?: () => void;
}

const DEFAULT_MAX_RETRIES = 3;
const BASE_DELAY_MS = 700;
const MAX_DELAY_MS = 5000;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function useLiveKitConnectionMonitor({
  serverUrl,
  token,
  maxRetries = DEFAULT_MAX_RETRIES,
  onGiveUp,
}: ConnectionMonitorOptions) {
  const room = useRoomContext();
  const [toast, setToast] = useState<ConnectionToastState | null>(null);
  const isMountedRef = useRef(true);
  const reconnectingRef = useRef(false);
  const retryRef = useRef(0);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, tone: ConnectionToastState["tone"]) => {
    if (!isMountedRef.current) return;
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast({ id: Date.now(), message, tone });
    toastTimeoutRef.current = setTimeout(() => setToast(null), 3200);
  }, []);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!room || !serverUrl || !token) return;

    const handleReconnecting = () => {
      showToast("Connection is unstable. Reconnecting...", "warning");
    };

    const handleReconnected = () => {
      retryRef.current = 0;
      reconnectingRef.current = false;
      showToast("Back online in the classroom.", "success");
    };

    const attemptReconnect = async () => {
      if (reconnectingRef.current || room.state !== ConnectionState.Disconnected) return;
      reconnectingRef.current = true;

      while (
        isMountedRef.current &&
        retryRef.current < maxRetries &&
        room.state === ConnectionState.Disconnected
      ) {
        const attempt = retryRef.current + 1;
        retryRef.current = attempt;

        if (attempt > 1) {
          const delayMs = Math.min(MAX_DELAY_MS, BASE_DELAY_MS * Math.pow(2, attempt - 1));
          await wait(delayMs);
        }
        showToast("Connection dropped. Trying to rejoin...", "warning");

        try {
          await room.connect(serverUrl, token);
          handleReconnected();
          reconnectingRef.current = false;
          return;
        } catch (error) {
          console.error("[LiveKit] reconnect attempt failed", error);
        }
      }

      reconnectingRef.current = false;
      showToast("We couldn't restore the classroom connection.", "warning");
      onGiveUp?.();
    };

    const handleDisconnected = () => {
      if (!isMountedRef.current) return;
      void attemptReconnect();
    };

    room.on(RoomEvent.SignalReconnecting, handleReconnecting);
    room.on(RoomEvent.Reconnecting, handleReconnecting);
    room.on(RoomEvent.Reconnected, handleReconnected);
    room.on(RoomEvent.Disconnected, handleDisconnected);

    return () => {
      room.off(RoomEvent.SignalReconnecting, handleReconnecting);
      room.off(RoomEvent.Reconnecting, handleReconnecting);
      room.off(RoomEvent.Reconnected, handleReconnected);
      room.off(RoomEvent.Disconnected, handleDisconnected);
      reconnectingRef.current = false;
      retryRef.current = 0;
    };
  }, [room, serverUrl, token, maxRetries, onGiveUp, showToast]);

  return { toast };
}

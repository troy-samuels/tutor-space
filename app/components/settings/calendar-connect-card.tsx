"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, CalendarDays } from "lucide-react";
import { requestCalendarConnection, disconnectCalendar } from "@/lib/actions/calendar";
import { resolveCalendarOAuthErrorMessage } from "@/lib/calendar/errors";
import type { CalendarConnectionStatus } from "@/lib/actions/types";

const ICONS = {
  google: CalendarDays,
  outlook: CalendarClock,
} as const;

type ProviderKey = keyof typeof ICONS;

export function CalendarConnectCard({
  provider,
  title,
  description,
  connection,
}: {
  provider: ProviderKey;
  title: string;
  description: string;
  connection: CalendarConnectionStatus;
}) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const popupRef = useRef<Window | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const Icon = ICONS[provider];
  const isConnected = connection.connected;

  // Listen for OAuth callback message from popup
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verify origin for security
      if (event.origin !== window.location.origin) return;

      const data = event.data;
      if (data?.type !== "calendar-oauth-callback") return;
      if (!popupRef.current) return;

      if (data.success) {
        // Refresh the page to show updated connection status
        setFeedback(null);
        setIsPopupOpen(false);
        router.refresh();
      } else if (data.error) {
        const message = data.error
          ? resolveCalendarOAuthErrorMessage(data.error)
          : "Calendar connection failed. Please try again.";
        setFeedback(message);
        setIsPopupOpen(false);
      }

      popupRef.current = null;

      // Clear polling interval when message is received
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
      // Clean up polling interval on unmount
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [router]);

  const handleConnect = () => {
    if (isPending || isPopupOpen) {
      popupRef.current?.focus();
      setFeedback("Calendar sync is already in progress. Finish the popup or close it to retry.");
      return;
    }
    setFeedback(null);
    startTransition(() => {
      (async () => {
        const result = await requestCalendarConnection(provider, { popup: true });
        if (result?.error) {
          setFeedback(result.error);
          setIsPopupOpen(false);
          return;
        }
        if (result?.url) {
          // Open OAuth in popup window instead of redirecting
          popupRef.current = window.open(result.url, "_blank", "width=600,height=700");

          if (!popupRef.current) {
            setFeedback("Popup was blocked. Please allow popups for this site.");
            setIsPopupOpen(false);
          } else {
            setIsPopupOpen(true);
            // Start polling to detect if popup is closed without completing
            pollIntervalRef.current = setInterval(() => {
              if (popupRef.current?.closed) {
                // Popup was closed without completing - reset state
                if (pollIntervalRef.current) {
                  clearInterval(pollIntervalRef.current);
                  pollIntervalRef.current = null;
                }
                setFeedback("Calendar connection was cancelled. Click 'Connect' to try again.");
                setIsPopupOpen(false);
                popupRef.current = null;
              }
            }, 500);
          }
        }
      })();
    });
  };

  const handleDisconnect = () => {
    setFeedback(null);
    startTransition(() => {
      (async () => {
        const result = await disconnectCalendar(provider);
        if (result?.error) {
          setFeedback(result.error);
          return;
        }
        router.refresh();
      })();
    });
  };

  return (
    <div className="flex h-full flex-col justify-between rounded-2xl border border-border/60 bg-white/80 p-5 shadow-sm backdrop-blur">
      <div className="space-y-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
          <Icon className="h-6 w-6 text-primary" />
        </span>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground">{title}</p>
            {isConnected ? (
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-600">
                Connected
              </span>
            ) : null}
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
          {isConnected && (connection.accountEmail || connection.accountName) ? (
            <p className="text-xs text-primary">
              {connection.accountName ?? connection.accountEmail}
            </p>
          ) : null}
          {isConnected && connection.lastSyncedAt ? (
            <p className="text-[11px] text-muted-foreground">
              Last synced {new Date(connection.lastSyncedAt).toLocaleString()}
            </p>
          ) : null}
          {connection.error ? (
            <p className="text-xs text-destructive">{connection.error}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-6 space-y-2">
        {isConnected ? (
          <button
            type="button"
            onClick={handleDisconnect}
            disabled={isPending}
            className="inline-flex h-10 w-full items-center justify-center rounded-full border border-border bg-white px-4 text-xs font-semibold text-foreground shadow-sm transition hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isPending ? "Disconnecting..." : "Disconnect"}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleConnect}
            disabled={isPending || isPopupOpen}
            className="inline-flex h-10 w-full items-center justify-center rounded-full bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isPending ? "Starting sync..." : isPopupOpen ? "Finish in popup..." : `Connect ${title}`}
          </button>
        )}
        {feedback ? (
          <p className="text-xs text-destructive">{feedback}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Secure OAuth opens in a new window—no passwords stored on TutorLingua.
          </p>
        )}
      </div>
    </div>
  );
}

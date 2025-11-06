"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, CalendarDays } from "lucide-react";
import {
  requestCalendarConnection,
  disconnectCalendar,
  type CalendarConnectionStatus,
} from "@/lib/actions/calendar";

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

  const Icon = ICONS[provider];
  const isConnected = connection.connected;

  const handleConnect = () => {
    setFeedback(null);
    startTransition(() => {
      (async () => {
        const result = await requestCalendarConnection(provider);
        if (result?.error) {
          setFeedback(result.error);
          return;
        }
        if (result?.url) {
          window.location.href = result.url;
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
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-brown/10">
          <Icon className="h-6 w-6 text-brand-brown" />
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
            <p className="text-xs text-brand-brown">
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
            className="inline-flex h-10 w-full items-center justify-center rounded-full border border-brand-brown/40 bg-white px-4 text-xs font-semibold text-brand-brown shadow-sm transition hover:bg-brand-brown/10 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isPending ? "Disconnecting..." : "Disconnect"}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleConnect}
            disabled={isPending}
            className="inline-flex h-10 w-full items-center justify-center rounded-full bg-brand-brown px-4 text-xs font-semibold text-brand-white shadow-sm transition hover:bg-brand-brown/90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isPending ? "Starting sync..." : `Connect ${title}`}
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

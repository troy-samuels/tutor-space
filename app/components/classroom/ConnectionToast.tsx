"use client";

import { Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConnectionToastState } from "@/lib/hooks/useLiveKitConnectionMonitor";

interface ConnectionToastProps {
  toast: ConnectionToastState | null;
}

export function ConnectionToast({ toast }: ConnectionToastProps) {
  if (!toast) return null;

  const isWarning = toast.tone === "warning";
  const icon = isWarning ? (
    <WifiOff className="h-4 w-4 text-amber-600" aria-hidden />
  ) : (
    <Wifi className="h-4 w-4 text-emerald-600" aria-hidden />
  );

  return (
    <div className="fixed top-6 right-6 z-50">
      <div
        className={cn(
          "min-w-[260px] rounded-xl border px-4 py-3 shadow-lg",
          "flex items-start gap-3",
          isWarning
            ? "bg-amber-50 border-amber-200 text-amber-900"
            : "bg-emerald-50 border-emerald-200 text-emerald-900"
        )}
        role="status"
        aria-live="polite"
      >
        <div className="mt-0.5">{icon}</div>
        <div className="space-y-0.5">
          <p className="text-sm font-semibold leading-tight">{toast.message}</p>
          <p className="text-xs text-muted-foreground">
            {isWarning
              ? "We're trying to reconnect you automatically."
              : "You're back in the room."}
          </p>
        </div>
      </div>
    </div>
  );
}

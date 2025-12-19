"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Check, XCircle, Loader2 } from "lucide-react";
import { getCalendarOAuthErrorMessage } from "@/lib/calendar/errors";

export default function CalendarCallbackPage() {
  const searchParams = useSearchParams();
  const connected = searchParams.get("connected");
  const error = searchParams.get("calendar_error");

  useEffect(() => {
    // Notify parent window of the result
    if (window.opener) {
      window.opener.postMessage(
        {
          type: "calendar-oauth-callback",
          success: !!connected,
          provider: connected || null,
          error: error || null,
        },
        window.location.origin
      );
    }

    // Auto-close the popup after a short delay
    const timer = setTimeout(() => {
      window.close();
    }, 2000);

    return () => clearTimeout(timer);
  }, [connected, error]);

  const providerName = connected === "google" ? "Google Calendar" :
                       connected === "outlook" ? "Outlook Calendar" :
                       "Calendar";

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <div className="space-y-2">
            <h1 className="text-lg font-semibold text-foreground">
              Connection Failed
            </h1>
            <p className="text-sm text-muted-foreground">
              {getErrorMessage(error)}
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            This window will close automatically...
          </p>
          <button
            onClick={() => window.close()}
            className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            Close Window
          </button>
        </div>
      </div>
    );
  }

  if (connected) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <Check className="h-8 w-8 text-emerald-600" />
          </div>
          <div className="space-y-2">
            <h1 className="text-lg font-semibold text-foreground">
              {providerName} Connected!
            </h1>
            <p className="text-sm text-muted-foreground">
              Your calendar is now synced. We&apos;ll keep your availability updated automatically.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Closing window...</span>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-4 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Processing...</p>
      </div>
    </div>
  );
}

function getErrorMessage(error: string): string {
  return getCalendarOAuthErrorMessage(error);
}

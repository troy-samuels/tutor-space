"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { Loader2, Calendar, ExternalLink } from "lucide-react";
import { saveOnboardingStep } from "@/lib/actions/onboarding";
import { requestCalendarConnection } from "@/lib/actions/calendar";

type StepCalendarSyncProps = {
  onComplete: () => void;
};

export function StepCalendarSync({
  onComplete,
}: StepCalendarSyncProps) {
  const [, startTransition] = useTransition();
  const [selectedProvider, setSelectedProvider] = useState<"google" | "outlook" | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const popupRef = useRef<Window | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Listen for OAuth callback message from popup
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verify origin for security
      if (event.origin !== window.location.origin) return;

      const data = event.data;
      if (data?.type !== "calendar-oauth-callback") return;

      // Clear polling interval when message is received
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }

      if (data.success && data.provider) {
        // Advance immediately - calendar IS connected (tokens saved during OAuth)
        onComplete();

        // Save metadata in background - don't show error if this fails
        // The calendar connection is already saved in calendar_connections table
        startTransition(async () => {
          try {
            await saveOnboardingStep(5, {
              calendar_provider: data.provider,
            });
          } catch (error) {
            // Log but don't show error - this is non-critical metadata
            console.error("Background save failed for step 5:", error);
          }
        });

        setIsConnecting(false);
        setSelectedProvider(null);
        popupRef.current = null;
      } else if (data.error) {
        setErrors({ submit: data.error || "Calendar connection failed. Please try again." });
        setIsConnecting(false);
        setSelectedProvider(null);
        popupRef.current = null;
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
  }, [onComplete, startTransition]);

  const handleConnect = async (provider: "google" | "outlook") => {
    setIsConnecting(true);
    setSelectedProvider(provider);
    setErrors({});

    try {
      const result = await requestCalendarConnection(provider, { popup: true });

      if (result.url) {
        // Open OAuth in new window with popup flag
        popupRef.current = window.open(result.url, "_blank", "width=600,height=700");

        // Check if popup was blocked
        if (!popupRef.current) {
          setErrors({ submit: "Popup was blocked. Please allow popups for this site." });
          setIsConnecting(false);
          setSelectedProvider(null);
        } else {
          // Start polling to detect if popup is closed without completing
          pollIntervalRef.current = setInterval(() => {
            if (popupRef.current?.closed) {
              // Popup was closed without completing - reset state
              if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
              }
              setIsConnecting(false);
              setSelectedProvider(null);
              setErrors({ submit: "Calendar connection was cancelled. Please try again or skip this step." });
              popupRef.current = null;
            }
          }, 500);
        }
        // Don't complete here - wait for the message from the popup
      } else if (result.error) {
        setErrors({ submit: result.error });
        setIsConnecting(false);
        setSelectedProvider(null);
      }
    } catch (error) {
      console.error("Error connecting calendar:", error);
      setErrors({ submit: "Failed to connect calendar. Please check your connection and try again." });
      setIsConnecting(false);
      setSelectedProvider(null);
    }
  };

  const handleSkip = () => {
    // Advance immediately
    onComplete();

    // Save in background - don't show error if this fails
    startTransition(async () => {
      try {
        await saveOnboardingStep(5, {
          calendar_provider: null,
        });
      } catch (error) {
        console.error("Background save failed for step 5:", error);
      }
    });
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Sync your calendar to automatically show availability and prevent double bookings.
      </p>

      {/* Calendar Provider Selection */}
      <div className="space-y-3">
        {/* Google Calendar */}
        <button
          type="button"
          onClick={() => handleConnect("google")}
          disabled={isConnecting}
          className={`flex w-full items-start gap-4 rounded-xl border p-4 text-left transition ${
            selectedProvider === "google"
              ? "border-primary bg-primary/10"
              : "border-border hover:border-primary/50"
          } disabled:cursor-not-allowed disabled:opacity-50`}
        >
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-lg ${
              selectedProvider === "google"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            <Calendar className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">
                Google Calendar
              </span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                Popular
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Sync with your Google account for automatic availability updates.
            </p>
          </div>
          {isConnecting && selectedProvider === "google" ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : (
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {/* Outlook */}
        <button
          type="button"
          onClick={() => handleConnect("outlook")}
          disabled={isConnecting}
          className={`flex w-full items-start gap-4 rounded-xl border p-4 text-left transition ${
            selectedProvider === "outlook"
              ? "border-primary bg-primary/10"
              : "border-border hover:border-primary/50"
          } disabled:cursor-not-allowed disabled:opacity-50`}
        >
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-lg ${
              selectedProvider === "outlook"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            <Calendar className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <span className="text-sm font-semibold text-foreground">
              Outlook Calendar
            </span>
            <p className="mt-1 text-xs text-muted-foreground">
              Sync with Microsoft Outlook for automatic availability updates.
            </p>
          </div>
          {isConnecting && selectedProvider === "outlook" ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : (
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      </div>

      {/* Info box */}
      <div className="rounded-xl bg-blue-50 p-4">
        <p className="text-xs text-blue-800">
          Calendar sync opens in a new window. You can also connect your calendar
          later from Settings &rarr; Calendar.
        </p>
      </div>

      {errors.submit && (
        <p className="text-sm text-red-600">{errors.submit}</p>
      )}

      {/* Skip button */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleSkip}
          disabled={isConnecting}
          className="inline-flex h-10 items-center justify-center rounded-full border border-border px-6 text-sm font-semibold text-muted-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}

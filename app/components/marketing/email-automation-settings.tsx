"use client";

import { useActionState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { updateEmailAutomationSettings } from "@/lib/actions/email-preferences";

const initialState = {
  error: undefined,
  success: undefined,
};

type EmailAutomationSettingsProps = {
  autoWelcomeEnabled: boolean;
  autoReengageEnabled: boolean;
  autoReengageDays: number;
};

export function EmailAutomationSettings({
  autoWelcomeEnabled,
  autoReengageEnabled,
  autoReengageDays,
}: EmailAutomationSettingsProps) {
  const [state, formAction, isPending] = useActionState(
    updateEmailAutomationSettings,
    initialState
  );

  return (
    <form
      action={formAction}
      className="rounded-3xl border border-border bg-white/80 px-6 py-5 shadow-sm"
    >
      <div className="flex flex-col gap-1 border-b border-border/70 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">Automations</p>
          <p className="text-xs text-muted-foreground">
            Keep students warm with automatic welcome and re-engagement flows.
          </p>
        </div>
        {state.success ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            {state.success}
          </span>
        ) : state.error ? (
          <span className="text-xs font-semibold text-red-600">{state.error}</span>
        ) : null}
      </div>

      <div className="mt-4 space-y-4">
        <label className="flex items-start gap-3 rounded-2xl border border-border/60 bg-muted/30 px-4 py-3">
          <input
            type="checkbox"
            name="auto_welcome_enabled"
            defaultChecked={autoWelcomeEnabled}
            className="mt-1 h-4 w-4 rounded border-border accent-primary"
          />
          <div>
            <p className="text-sm font-semibold text-foreground">Auto welcome new students</p>
            <p className="text-xs text-muted-foreground">
              Send the “Welcome & Next Steps” template whenever a new student is added.
            </p>
          </div>
        </label>

        <div className="rounded-2xl border border-border/60 bg-muted/30 px-4 py-3">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              name="auto_reengage_enabled"
              defaultChecked={autoReengageEnabled}
              className="mt-1 h-4 w-4 rounded border-border accent-primary"
            />
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">
                Re-engage inactive students automatically
              </p>
              <p className="text-xs text-muted-foreground">
                We’ll send the “Re-engage inactive students” template when a student is inactive
                longer than your threshold.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="number"
                  name="auto_reengage_days"
                  min={7}
                  max={180}
                  defaultValue={autoReengageDays}
                  className="h-9 w-24 rounded-lg border border-border bg-white px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <span className="text-xs text-muted-foreground">days of inactivity</span>
              </div>
            </div>
          </label>
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save automations"}
      </button>
    </form>
  );
}

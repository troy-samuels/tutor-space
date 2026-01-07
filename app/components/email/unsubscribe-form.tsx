"use client";

import { useActionState } from "react";
import { unsubscribeStudentAction } from "@/lib/actions/email-preferences";
import type { UnsubscribeActionState } from "@/lib/actions/types";
import { CheckCircle2, Info } from "lucide-react";

const initialState: UnsubscribeActionState = {};

export function EmailUnsubscribeForm({ token }: { token: string }) {
  const [state, formAction, isPending] = useActionState(unsubscribeStudentAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />

      {/* Explain what emails are affected */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
        <div className="flex items-start gap-2">
          <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <div className="space-y-2">
            <p className="font-medium">What this affects:</p>
            <ul className="list-disc space-y-1 pl-4 text-blue-600">
              <li>Marketing emails and newsletters</li>
              <li>Re-engagement campaigns</li>
              <li>Promotional announcements</li>
            </ul>
            <p className="mt-2 text-xs text-blue-500">
              You will still receive essential transactional emails like booking confirmations,
              lesson reminders, and payment receipts. These cannot be unsubscribed.
            </p>
          </div>
        </div>
      </div>

      {state?.success ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <div>
              <p>{state.success}</p>
              <p className="mt-1 text-xs text-emerald-600">
                You will still receive booking confirmations and lesson reminders.
              </p>
            </div>
          </div>
        </div>
      ) : state?.error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      ) : null}
      <button
        type="submit"
        disabled={isPending || Boolean(state?.success)}
        className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-primary text-sm font-semibold text-primary-foreground shadow transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Processing…" : state?.success ? "Unsubscribed" : "Unsubscribe from marketing emails"}
      </button>
    </form>
  );
}

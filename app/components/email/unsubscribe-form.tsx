"use client";

import { useActionState } from "react";
import { unsubscribeStudentAction, type UnsubscribeActionState } from "@/lib/actions/email-preferences";
import { CheckCircle2 } from "lucide-react";

const initialState: UnsubscribeActionState = {};

export function EmailUnsubscribeForm({ token }: { token: string }) {
  const [state, formAction, isPending] = useActionState(unsubscribeStudentAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      {state?.success ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            {state.success}
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
        className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-brand-brown text-sm font-semibold text-white shadow transition hover:bg-brand-brown/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Processing…" : state?.success ? "Unsubscribed" : "Confirm unsubscribe"}
      </button>
    </form>
  );
}

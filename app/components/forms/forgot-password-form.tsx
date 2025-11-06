"use client";

import { useActionState } from "react";
import { resetPassword, type AuthActionState } from "@/lib/actions/auth";

const initialState: AuthActionState = { error: undefined, success: undefined };

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState<AuthActionState, FormData>(
    resetPassword,
    initialState
  );

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium text-foreground">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="you@example.com"
        />
      </div>

      {state?.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      {state?.success && (
        <p className="rounded-md bg-emerald-100 px-3 py-2 text-sm text-emerald-700">
          {state.success}
        </p>
      )}

      <button
        type="submit"
        className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isPending}
      >
        {isPending ? "Sending..." : "Send reset link"}
      </button>
    </form>
  );
}

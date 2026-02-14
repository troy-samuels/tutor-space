"use client";

import { useActionState } from "react";
import { resendSignupConfirmation, type EmailVerificationState } from "@/lib/actions/auth";

const initialState: EmailVerificationState = {
  error: undefined,
  success: undefined,
};

type VerifyEmailFormProps = {
  role: "tutor" | "student";
  email?: string | null;
  next?: string | null;
};

export function VerifyEmailForm({ role, email, next }: VerifyEmailFormProps) {
  const [state, formAction, isPending] = useActionState(resendSignupConfirmation, initialState);

  return (
    <div className="space-y-4">
      {state?.error && (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {state.success}
        </div>
      )}

      <form action={formAction} className="space-y-3">
        <input type="hidden" name="role" value={role} />
        {next ? <input type="hidden" name="next" value={next} /> : null}

        <label htmlFor="email" className="block text-sm font-medium text-foreground">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          defaultValue={email ?? ""}
          required
          className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="you@example.com"
          autoComplete="email"
        />

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending ? "Sending..." : "Resend confirmation email"}
        </button>
      </form>

      <p className="text-xs text-muted-foreground">
        Check your spam folder if you don&apos;t see the email within a few minutes.
      </p>
    </div>
  );
}

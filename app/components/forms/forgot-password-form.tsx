"use client";

import { resetPassword } from "@/lib/actions/auth";
import { FormStatusAlert } from "@/components/forms/form-status-alert";
import { useAuthForm } from "@/components/forms/use-auth-form";

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useAuthForm(resetPassword);

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
          autoComplete="email"
          className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="you@example.com"
        />
      </div>

      <FormStatusAlert tone="error" message={state?.error} as="p" />

      <FormStatusAlert tone="success" message={state?.success} as="p" />

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

"use client";

import { updatePassword } from "@/lib/actions/auth";
import { FormStatusAlert } from "@/components/forms/form-status-alert";
import { PasswordInput } from "@/components/forms/password-input";
import { useAuthForm } from "@/components/forms/use-auth-form";

export function ResetPasswordForm() {
  const [state, formAction, isPending] = useAuthForm(updatePassword);

  return (
    <form action={formAction} className="space-y-6">
      <PasswordInput
        id="password"
        name="password"
        label="New password"
        required
        minLength={6}
        autoComplete="new-password"
        fieldClassName="space-y-2"
        labelClassName="block text-sm font-medium text-foreground"
        containerClassName="relative"
        inputClassName="block w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        buttonClassName="absolute inset-y-0 right-2 inline-flex items-center text-muted-foreground hover:text-foreground"
      />

      <PasswordInput
        id="confirm_password"
        name="confirm_password"
        label="Confirm password"
        required
        minLength={6}
        autoComplete="new-password"
        fieldClassName="space-y-2"
        labelClassName="block text-sm font-medium text-foreground"
        containerClassName="relative"
        inputClassName="block w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        buttonClassName="absolute inset-y-0 right-2 inline-flex items-center text-muted-foreground hover:text-foreground"
      />

      <FormStatusAlert tone="error" message={state?.error} as="p" />

      <button
        type="submit"
        className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isPending}
      >
        {isPending ? "Updating..." : "Update password"}
      </button>
    </form>
  );
}

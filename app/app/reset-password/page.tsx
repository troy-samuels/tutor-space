import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/forms/reset-password-form";

export const metadata: Metadata = {
  title: "Create New Password | TutorLingua",
  description: "Choose a new password to regain access to your tutor account.",
};

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-muted via-muted/30 to-white px-4 py-12">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-border bg-white/90 p-8 shadow-lg backdrop-blur">
        <header className="space-y-1 text-center">
          <h1 className="text-3xl font-semibold text-primary">Create a new password</h1>
          <p className="text-sm text-muted-foreground">
            Enter and confirm your new password to finish the reset process.
          </p>
        </header>

        <ResetPasswordForm />
      </div>
    </div>
  );
}


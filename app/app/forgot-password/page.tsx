import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/forms/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot Password | TutorLingua",
  description: "Request a password reset link for your tutor account.",
};

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-cream via-brand-cream/30 to-white px-4 py-12">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-brand-brown/20 bg-white/90 p-8 shadow-lg backdrop-blur">
        <header className="space-y-1 text-center">
          <h1 className="text-3xl font-semibold text-brand-brown">Reset your password</h1>
          <p className="text-sm text-muted-foreground">
            Enter the email you use for TutorLingua and we&apos;ll send a reset link.
          </p>
        </header>

        <ForgotPasswordForm />

        <p className="text-center text-sm text-muted-foreground">
          Remembered your password?{" "}
          <Link href="/login" className="font-semibold text-brand-brown hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}

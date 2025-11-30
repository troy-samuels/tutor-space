import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "@/components/forms/signup-form";

export const metadata: Metadata = {
  title: "Create Tutor Account | TutorLingua",
  description: "Set up your TutorLingua workspace in minutes.",
};

export default function TutorSignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-muted via-muted/30 to-white px-4 py-12">
      <div className="w-full max-w-md space-y-6 rounded-3xl bg-white/90 p-8 shadow-lg backdrop-blur">
        <header className="space-y-1 text-center">
          <h1 className="text-3xl font-semibold text-primary">Join TutorLingua</h1>
          <p className="text-sm text-muted-foreground">
            Founders offer: 2 months free, then a one-time lifetime payment for the first 10 tutors.
          </p>
        </header>

        <SignupForm />

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

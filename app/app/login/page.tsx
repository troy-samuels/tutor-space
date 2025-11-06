import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/forms/login-form";

export const metadata: Metadata = {
  title: "Tutor Login | TutorLingua",
  description: "Sign in to manage your TutorLingua workspace.",
};

export default function TutorLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-cream via-brand-cream/30 to-white px-4 py-12">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-brand-brown/20 bg-white/90 p-8 shadow-lg backdrop-blur">
        <header className="space-y-1 text-center">
          <h1 className="text-3xl font-semibold text-brand-brown">TutorLingua</h1>
          <p className="text-sm text-muted-foreground">Log in to your tutor dashboard</p>
        </header>

        <LoginForm />

        <p className="text-center text-sm text-muted-foreground">
          Need student access?{" "}
          <Link href="/student-auth/login" className="font-semibold text-brand-brown hover:underline">
            Student login
          </Link>
        </p>
      </div>
    </div>
  );
}


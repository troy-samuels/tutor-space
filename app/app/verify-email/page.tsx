import type { Metadata } from "next";
import Link from "next/link";
import { sanitizeRedirectPath } from "@/lib/auth/redirects";
import { VerifyEmailForm } from "@/components/forms/verify-email-form";

export const metadata: Metadata = {
  title: "Verify Email | TutorLingua",
  description: "Confirm your email to continue.",
};

type PageProps = {
  searchParams: Promise<{ role?: string; email?: string; next?: string }>;
};

export default async function VerifyEmailPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const role = params.role === "student" ? "student" : "tutor";
  const email = typeof params.email === "string" ? params.email : null;
  const nextPath = sanitizeRedirectPath(params.next) ?? null;

  const heading =
    role === "student"
      ? "Confirm your email to continue"
      : "Confirm your email to start onboarding";
  const subtitle =
    role === "student"
      ? "We sent a confirmation link to finish setting up your student account."
      : "We sent a confirmation link to finish setting up your tutor account.";

  const loginHref = role === "student" ? "/student/login" : "/login";
  const signupHref = role === "student" ? "/student/signup" : "/signup";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-muted via-muted/30 to-white px-4 py-12">
      <div className="w-full max-w-md space-y-6 rounded-3xl bg-white/90 p-8 shadow-lg backdrop-blur">
        <header className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold text-primary">{heading}</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
          {email ? (
            <p className="text-xs text-muted-foreground">
              Sent to <span className="font-medium text-foreground">{email}</span>
            </p>
          ) : null}
        </header>

        <VerifyEmailForm role={role} email={email} next={nextPath} />

        <div className="space-y-2 text-center text-sm text-muted-foreground">
          <p>
            Already confirmed?{" "}
            <Link href={loginHref} className="font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </p>
          <p>
            Need a different email?{" "}
            <Link href={signupHref} className="font-semibold text-primary hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

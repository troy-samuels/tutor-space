import type { Metadata } from "next";
import Link from "next/link";
import { sanitizeRedirectPath } from "@/lib/auth/redirects";

export const metadata: Metadata = {
  title: "Continue Signup | TutorLingua",
  description: "Sign in to continue setting up your account.",
};

type PageProps = {
  searchParams: Promise<{ role?: string; email?: string; next?: string }>;
};

export default async function VerifyEmailPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const role = params.role === "student" ? "student" : "tutor";
  const email = typeof params.email === "string" ? params.email : null;
  const nextPath = sanitizeRedirectPath(params.next) ?? null;

  const loginHref = role === "student" ? "/student/login" : "/login";
  const signupHref = role === "student" ? "/student/signup" : "/signup";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-muted via-muted/30 to-white px-4 py-12">
      <div className="w-full max-w-md space-y-6 rounded-3xl bg-white/90 p-8 shadow-lg backdrop-blur">
        <header className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold text-primary">You're ready to continue</h1>
          <p className="text-sm text-muted-foreground">
            Email confirmation is no longer required. Sign in to finish setting up your account.
          </p>
          {email ? (
            <p className="text-xs text-muted-foreground">
              Account email: <span className="font-medium text-foreground">{email}</span>
            </p>
          ) : null}
        </header>

        <div className="space-y-3">
          <Link
            href={loginHref}
            className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            Sign in to continue
          </Link>
          {nextPath ? (
            <p className="text-xs text-muted-foreground text-center">
              After signing in, we&apos;ll send you to{" "}
              <span className="font-medium text-foreground">{nextPath}</span>.
            </p>
          ) : null}
        </div>

        <div className="space-y-2 text-center text-sm text-muted-foreground">
          <p>
            Need a different account?{" "}
            <Link href={signupHref} className="font-semibold text-primary hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

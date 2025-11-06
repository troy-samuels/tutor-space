import Link from "next/link";

export default function AuthErrorPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-background p-8 text-center shadow-lg">
        <h1 className="text-2xl font-semibold text-foreground">Authentication issue</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We couldn&apos;t complete the sign-in process. Please try again or contact support if the problem persists.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/login"
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Back to login
          </Link>
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-md border border-input px-4 text-sm font-semibold hover:bg-muted"
          >
            Return to homepage
          </Link>
        </div>
      </div>
    </main>
  );
}

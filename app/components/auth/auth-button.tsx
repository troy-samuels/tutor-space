"use client";

import Link from "next/link";
import { useTransition } from "react";
import { signOut } from "@/lib/actions/auth";
import { useAuth } from "@/lib/hooks/useAuth";

type AuthButtonProps = {
  /**
   * Optional override for authentication state.
   * When explicitly set to `false`, skips loading state entirely.
   * Used by landing page where server already determined auth status.
   */
  isAuthenticated?: boolean;
};

/** Unauthenticated state buttons - extracted for reuse */
function UnauthenticatedButtons() {
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <Link
        href="/login"
        className="inline-flex h-8 sm:h-9 items-center justify-center whitespace-nowrap rounded-full px-3 sm:px-4 text-sm font-medium text-foreground transition hover:bg-stone-100"
      >
        Log in
      </Link>
      <Link
        href="/signup"
        className="inline-flex h-8 sm:h-9 items-center justify-center whitespace-nowrap rounded-full bg-primary px-3 sm:px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
      >
        Sign up
      </Link>
    </div>
  );
}

export function AuthButton({ isAuthenticated }: AuthButtonProps = {}) {
  const { user, loading } = useAuth();
  const [isPending, startTransition] = useTransition();

  // Fast path: server explicitly told us user is NOT authenticated
  // Skip loading state entirely - the answer is already known
  if (isAuthenticated === false) {
    return <UnauthenticatedButtons />;
  }

  if (loading) {
    return (
      <span className="inline-flex h-9 min-w-[80px] items-center justify-center rounded-full bg-muted text-sm">
        Loading...
      </span>
    );
  }

  if (!user) {
    return <UnauthenticatedButtons />;
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const channel = new BroadcastChannel("auth");
          channel.postMessage("auth:update");
          channel.close();
      await signOut();
    })
      }
      className="inline-flex h-9 items-center justify-center rounded-full border border-input bg-background px-3 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-60"
    >
      Sign out
    </button>
  );
}

"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export type AppError = Error & {
  digest?: string;
  status?: number;
  statusCode?: number;
};

export function extractStatus(error: AppError): number | undefined {
  const statusValue =
    (error as { status?: unknown })?.status ??
    (error as { statusCode?: unknown })?.statusCode;
  return typeof statusValue === "number" ? statusValue : undefined;
}

export function logClientError(error: AppError) {
  try {
    const status = extractStatus(error);
    const sentry =
      typeof window !== "undefined"
        ? (window as unknown as {
            Sentry?: { captureException?: (err: unknown, ctx?: unknown) => void };
          }).Sentry
        : undefined;

    if (sentry?.captureException) {
      sentry.captureException(error, { extra: { status, digest: error.digest } });
    }

    if (!sentry?.captureException || process.env.NODE_ENV !== "production") {
      console.error("[app:error]", error);
    }
  } catch (loggingError) {
    console.error("[app:error] failed to log error", loggingError);
  }
}

export default function Error({
  error,
  reset,
}: {
  error: AppError;
  reset: () => void;
}) {
  const status = extractStatus(error);
  const isServerError = typeof status === "number" ? status >= 500 : Boolean(error.digest);

  useEffect(() => {
    logClientError(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-gradient-to-b from-background to-background-alt px-6 py-12">
      <div className="flex w-full max-w-2xl flex-col items-center gap-6 rounded-xl border bg-card/70 p-8 text-center shadow-sm backdrop-blur">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <span className="text-lg font-semibold">!</span>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-semibold text-destructive">
            {isServerError ? "Server issue" : "Unexpected error"}
          </p>
          <h1 className="text-2xl font-semibold">We hit a snag</h1>
          <p className="text-muted-foreground">
            {isServerError
              ? "Our servers had a moment. Please try again in a few seconds."
              : "An unexpected error occurred. You can retry or head back to the dashboard."}
          </p>
          {error.digest ? (
            <p className="text-xs text-muted-foreground">Reference: {error.digest}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button onClick={reset}>Try again</Button>
          <Button variant="outline" asChild>
            <Link href="/">Go home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

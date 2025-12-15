"use client";

import "./globals.css";
import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AppError, extractStatus, logClientError } from "./error";

export default function GlobalError({
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
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground">
        <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-12 text-center">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <span className="text-xl font-semibold">!</span>
          </div>
          <div className="space-y-3">
            <p className="text-sm font-semibold text-destructive">
              {isServerError ? "Server issue" : "Application error"}
            </p>
            <h1 className="text-3xl font-semibold">We could not load this page</h1>
            <p className="text-muted-foreground">
              {isServerError
                ? "It looks like something went wrong on our end. Try again, and if it keeps happening, contact support at support@tutorlingua.co."
                : "An unexpected issue occurred while loading this page. You can retry or return home. Need help? Contact support@tutorlingua.co."}
            </p>
            {error.digest ? (
              <p className="text-xs text-muted-foreground">Reference: {error.digest}</p>
            ) : null}
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button onClick={reset}>Try again</Button>
            <Button variant="outline" asChild>
              <Link href="/">Back to home</Link>
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}

"use client";

import Link from "next/link";
import { Search, Home, HelpCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-6 py-16">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Search className="h-5 w-5" />
        </div>
        <h1 className="mt-5 text-2xl font-semibold text-foreground">
          Page not found
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className={buttonVariants({ variant: "default", size: "sm" })}
          >
            <Home className="mr-2 h-4 w-4" />
            Go to homepage
          </Link>
          <Link
            href="/help"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <HelpCircle className="mr-2 h-4 w-4" />
            Help center
          </Link>
        </div>
      </div>
    </div>
  );
}

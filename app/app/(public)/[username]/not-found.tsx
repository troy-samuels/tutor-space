"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-6 py-16">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Search className="h-4 w-4" />
        </div>
        <h1 className="mt-5 text-xl font-semibold text-foreground">
          Profile not found
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This tutor page doesn't exist or isn't published yet.
        </p>
        <div className="mt-6">
          <Link
            href="/"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Go to homepage
          </Link>
        </div>
      </div>
    </div>
  );
}

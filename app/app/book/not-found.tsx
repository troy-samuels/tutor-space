"use client";

import Link from "next/link";
import { Calendar, Home } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function BookingNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-6 py-16">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Calendar className="h-5 w-5" />
        </div>
        <h1 className="mt-5 text-xl font-semibold text-foreground">
          Booking page not found
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This tutor doesn't have booking available or the page has been removed.
        </p>
        <div className="mt-6">
          <Link
            href="/"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <Home className="mr-2 h-4 w-4" />
            Go to homepage
          </Link>
        </div>
      </div>
    </div>
  );
}

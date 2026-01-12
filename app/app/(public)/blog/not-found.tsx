"use client";

import Link from "next/link";
import { FileText, Home, BookOpen } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function BlogNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-6 py-16">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <FileText className="h-5 w-5" />
        </div>
        <h1 className="mt-5 text-xl font-semibold text-foreground">
          Article not found
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This blog post doesn't exist or has been removed.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/blog"
            className={buttonVariants({ variant: "default", size: "sm" })}
          >
            <BookOpen className="mr-2 h-4 w-4" />
            Browse articles
          </Link>
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

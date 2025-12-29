"use client";

import { useState } from "react";
import { Link2, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type InviteStudentsCardProps = {
  username: string;
  tutorName: string;
  className?: string;
};

export function InviteStudentsCard({
  username,
  className,
}: InviteStudentsCardProps) {
  const baseUrl = typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL ?? "https://tutorlingua.co";
  const bookingUrl = `${baseUrl}/book/${username}`;
  const displayUrl = bookingUrl.replace(/^https?:\/\//, "");

  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(bookingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-stone-200 bg-white p-5 sm:rounded-3xl sm:p-6",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Link2 className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Booking Link
            </p>
            <p className="truncate text-sm text-foreground">{displayUrl}</p>
          </div>
        </div>
        <Button
          size="sm"
          variant={copied ? "ghost" : "default"}
          onClick={handleCopy}
          className="shrink-0"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

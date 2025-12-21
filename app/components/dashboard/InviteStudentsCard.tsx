"use client";

import Link from "next/link";
import { Users, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { BookingLinkCopy } from "./BookingLinkCopy";
import { QuickEmailInvite } from "./QuickEmailInvite";

type InviteStudentsCardProps = {
  username: string;
  tutorName: string;
  className?: string;
};

export function InviteStudentsCard({
  username,
  tutorName,
  className,
}: InviteStudentsCardProps) {
  const baseUrl = typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL ?? "https://tutorlingua.co";
  const bookingUrl = `${baseUrl}/book/${username}`;

  return (
    <div
      className={cn(
        "rounded-2xl border border-stone-200 bg-white p-6 sm:rounded-3xl",
        className
      )}
    >
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Users className="h-5 w-5 text-primary" />
        </div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Invite your students
        </h3>
      </div>

      <div className="space-y-5">
        <BookingLinkCopy bookingUrl={bookingUrl} />

        <div className="border-t border-stone-100 pt-5">
          <QuickEmailInvite tutorName={tutorName} bookingUrl={bookingUrl} />
        </div>
      </div>

      <div className="mt-5 border-t border-stone-100 pt-4">
        <Link
          href="/students?tab=invite-links"
          className="group inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          Manage all invite links
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}

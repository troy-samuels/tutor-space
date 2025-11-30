"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useUnreadMessages } from "@/lib/hooks/useUnreadMessages";

export function DashboardQuickLinks() {
  const unreadCount = useUnreadMessages("tutor", { pollIntervalMs: 30000 });
  const hasUnread = unreadCount > 0;

  return (
    <div className="flex w-full flex-wrap items-center justify-center gap-2">
      <Button
      variant="outline"
      size="sm"
      asChild
      className="w-full max-w-xs shrink-0 whitespace-nowrap text-center sm:w-auto"
    >
      <Link href="/calendar">Calendar</Link>
    </Button>
      <Button
        variant="outline"
        size="sm"
        asChild
        className="w-full max-w-xs shrink-0 whitespace-nowrap text-center sm:w-auto"
      >
        <Link href="/services">Services</Link>
      </Button>
      <Button
        variant="outline"
        size="sm"
        asChild
        className="w-full max-w-xs shrink-0 whitespace-nowrap text-center sm:w-auto"
      >
        <Link href="/students">Students</Link>
      </Button>
      <Button
        variant="outline"
        size="sm"
        asChild
        className="w-full max-w-xs shrink-0 whitespace-nowrap text-center sm:w-auto"
      >
        <Link href="/pages">Pages</Link>
      </Button>
      <Button
        variant="outline"
        size="sm"
        asChild
        className="relative w-full max-w-xs shrink-0 whitespace-nowrap text-center sm:w-auto"
      >
        <Link href="/messages">
          Messages
          {hasUnread && (
            <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-primary" />
          )}
        </Link>
      </Button>
      <Button
        variant="outline"
        size="sm"
        asChild
        className="w-full max-w-xs shrink-0 whitespace-nowrap text-center sm:w-auto"
      >
        <Link href="/analytics">Analytics</Link>
      </Button>
    </div>
  );
}

"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useUnreadMessages } from "@/lib/hooks/useUnreadMessages";

export function DashboardQuickLinks() {
  const unreadCount = useUnreadMessages("tutor", { pollIntervalMs: 30000 });
  const hasUnread = unreadCount > 0;

  return (
    <div className="flex max-w-full items-center justify-center gap-2 overflow-x-auto">
      <Button
        variant="outline"
        size="sm"
        asChild
        className="shrink-0 whitespace-nowrap"
      >
        <Link href="/calendar">Calendar</Link>
      </Button>
      <Button
        variant="outline"
        size="sm"
        asChild
        className="shrink-0 whitespace-nowrap"
      >
        <Link href="/bookings">Bookings</Link>
      </Button>
      <Button
        variant="outline"
        size="sm"
        asChild
        className="shrink-0 whitespace-nowrap"
      >
        <Link href="/services">Services</Link>
      </Button>
      <Button
        variant="outline"
        size="sm"
        asChild
        className="shrink-0 whitespace-nowrap"
      >
        <Link href="/students">Students</Link>
      </Button>
      <Button
        variant="outline"
        size="sm"
        asChild
        className="shrink-0 whitespace-nowrap"
      >
        <Link href="/pages">Pages</Link>
      </Button>
      <Button
        variant="outline"
        size="sm"
        asChild
        className="relative shrink-0 whitespace-nowrap"
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
        className="shrink-0 whitespace-nowrap"
      >
        <Link href="/analytics">Analytics</Link>
      </Button>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, CalendarDays, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/student-auth/search", label: "Search", icon: Search },
  { href: "/student-auth/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/student-auth/messages", label: "Messages", icon: MessageSquare },
];

type StudentBottomNavProps = {
  unreadCount?: number;
};

export function StudentBottomNav({ unreadCount }: StudentBottomNavProps) {
  const pathname = usePathname();
  const hasUnread = Boolean(unreadCount && unreadCount > 0);

  return (
    <nav
      aria-label="Student navigation"
      className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-center justify-around border-t border-border bg-background/95 backdrop-blur"
    >
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative flex flex-1 flex-col items-center justify-center py-2 text-xs font-medium transition-colors",
              isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon
              className={cn(
                "h-5 w-5 mb-1",
                isActive && "stroke-[2.5]"
              )}
            />
            <span>{item.label}</span>
            {item.href === "/student-auth/messages" && hasUnread && (
              <span className="absolute right-6 top-2 h-2.5 w-2.5 rounded-full bg-primary" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

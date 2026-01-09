"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, CalendarPlus, CalendarDays, MessageSquare, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/student/search", label: "Search", icon: Search },
  { href: "/student/calendar", label: "Book", icon: CalendarPlus },
  { href: "/student/schedule", label: "Schedule", icon: CalendarDays },
  { href: "/student/messages", label: "Messages", icon: MessageSquare },
  { href: "/student/homework", label: "Homework", icon: ClipboardList },
];

type StudentBottomNavProps = {
  unreadCount?: number;
  homeworkCount?: number;
};

export function StudentBottomNav({ unreadCount, homeworkCount }: StudentBottomNavProps) {
  const pathname = usePathname();
  const hasUnread = Boolean(unreadCount && unreadCount > 0);
  const hasHomework = Boolean(homeworkCount && homeworkCount > 0);

  return (
    <nav
      aria-label="Student navigation"
      className="fixed inset-x-0 bottom-0 z-40 flex h-[calc(4rem+env(safe-area-inset-bottom))] items-center justify-around border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] pt-1 backdrop-blur"
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
                "h-[18px] w-[18px] mb-0.5",
                isActive && "stroke-[2.5]"
              )}
            />
            <span className="text-xs">{item.label}</span>
            {item.href === "/student/messages" && hasUnread && (
              <span className="absolute right-6 top-2 h-2.5 w-2.5 rounded-full bg-primary" />
            )}
            {item.href === "/student/homework" && hasHomework && (
              <span className="absolute right-6 top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1 text-xs font-semibold text-primary-foreground">
                {homeworkCount! > 9 ? "9+" : homeworkCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

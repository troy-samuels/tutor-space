"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CalendarDays, Users, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Home", icon: BarChart3 },
  { href: "/bookings", label: "Bookings", icon: CalendarDays },
  { href: "/students", label: "Students", icon: Users },
  { href: "/services", label: "Services", icon: Briefcase },
];

export function DashboardBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Dashboard quick navigation"
      className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-center justify-around border-t border-border bg-background/90 backdrop-blur lg:hidden"
    >
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center text-xs font-medium transition-colors",
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon className={cn("h-5 w-5", isActive && "stroke-[2.5]")} />
            <span className="mt-1">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  Users,
  Briefcase,
  Menu,
  Clock,
  Settings,
  Sparkles,
  LayoutGrid,
  MessageSquare,
  type LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetOverlay } from "@/components/ui/sheet";

const AI_TOOLS_ENABLED = process.env.NEXT_PUBLIC_AI_TOOLS_ENABLED === "true";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Home", icon: BarChart3 },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/students", label: "Students", icon: Users },
  { href: "/services", label: "Services", icon: Briefcase },
];

const MORE_ITEMS = [
  { href: "/availability", label: "Availability", icon: Clock, description: "Set your teaching schedule" },
  { href: "/settings", label: "Settings", icon: Settings, description: "Profile & account settings" },
  AI_TOOLS_ENABLED
    ? { href: "/ai", label: "AI Tools", icon: Sparkles, description: "Lesson planning & resources" }
    : null,
  { href: "/analytics", label: "Analytics", icon: LayoutGrid, description: "View insights & reports" },
  { href: "/marketing", label: "Marketing", icon: MessageSquare, description: "Link-in-bio & promotion" },
].filter(Boolean) as Array<{
  href: string;
  label: string;
  icon: LucideIcon;
  description: string;
}>;

export function DashboardBottomNav() {
  const pathname = usePathname();
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  // Check if any "More" item is active
  const isMoreActive = MORE_ITEMS.some(item => pathname.startsWith(item.href));

  return (
    <nav
      aria-label="Dashboard quick navigation"
      className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-center justify-around bg-background/90 backdrop-blur lg:hidden shadow-sm"
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

      {/* More Menu */}
      <button
        onClick={() => setMoreMenuOpen(true)}
        className={cn(
          "flex flex-col items-center text-xs font-medium transition-colors",
          isMoreActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
        )}
        aria-label="More menu"
      >
        <Menu className={cn("h-5 w-5", isMoreActive && "stroke-[2.5]")} />
        <span className="mt-1">More</span>
      </button>

      <Sheet open={moreMenuOpen} onOpenChange={setMoreMenuOpen} side="bottom">
        <SheetOverlay onClick={() => setMoreMenuOpen(false)} />
        <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
          <div className="mb-6 pb-4 shadow-sm">
            <h2 className="text-lg font-semibold">More Options</h2>
          </div>
          <div className="space-y-1">
            {MORE_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreMenuOpen(false)}
                  className={cn(
                    "flex items-start gap-4 rounded-xl p-4 transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted"
                  )}
                >
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg",
                    isActive ? "bg-primary/20" : "bg-muted"
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{item.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.description}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}

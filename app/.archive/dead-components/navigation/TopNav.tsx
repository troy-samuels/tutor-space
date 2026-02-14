"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  type UserRole,
  getNavItems,
  isNavItemActive,
} from "@/lib/navigation/config";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TopNavProps = {
  role: UserRole;
  /** Optional: render extra content on the right (profile dropdown, notifications). */
  rightSlot?: React.ReactNode;
};

// ---------------------------------------------------------------------------
// TopNav
// ---------------------------------------------------------------------------

/**
 * Horizontal desktop navigation bar.
 * Reads from the centralised navigation config, renders same items as BottomNav.
 * Hidden on mobile (shown ≥1024px).
 */
export function TopNav({ role, rightSlot }: TopNavProps) {
  const pathname = usePathname();
  const navItems = getNavItems(role).filter((item) => item.href !== "#more");

  if (navItems.length === 0) return null;

  return (
    <nav
      aria-label={`${role} desktop navigation`}
      className="hidden lg:flex items-center gap-1"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = isNavItemActive(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon className={cn("h-4 w-4", isActive && "stroke-[2.5]")} />
            {item.label}
          </Link>
        );
      })}

      {rightSlot && (
        <div className="ml-auto flex items-center gap-2">
          {rightSlot}
        </div>
      )}
    </nav>
  );
}

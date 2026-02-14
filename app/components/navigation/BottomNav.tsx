"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  type UserRole,
  type NavItem,
  type MoreItem,
  getNavItems,
  getMoreItems,
  isNavItemActive,
} from "@/lib/navigation/config";
import { Sheet, SheetContent, SheetOverlay } from "@/components/ui/sheet";
import { springSnap } from "@/lib/animations";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type BadgeCounts = {
  unreadMessages?: number;
  homeworkCount?: number;
};

type BottomNavProps = {
  role: UserRole;
  badges?: BadgeCounts;
};

// ---------------------------------------------------------------------------
// Nav Tab
// ---------------------------------------------------------------------------

function NavTab({
  item,
  isActive,
  badgeCount,
  onClick,
}: {
  item: NavItem;
  isActive: boolean;
  badgeCount?: number;
  onClick?: () => void;
}) {
  const Icon = item.icon;
  const hasBadge = Boolean(badgeCount && badgeCount > 0);
  const isMore = item.href === "#more";

  const content = (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center py-2 text-xs font-medium transition-colors",
        item.centre && "relative -mt-3",
        isActive ? "text-primary" : "text-muted-foreground"
      )}
    >
      {/* Centre elevated icon */}
      {item.centre ? (
        <motion.div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full shadow-lg",
            isActive
              ? "bg-primary text-white shadow-primary/30"
              : "bg-primary/10 text-primary"
          )}
          whileTap={{ scale: 0.92 }}
          transition={springSnap}
        >
          <Icon className="h-5 w-5" />
        </motion.div>
      ) : (
        <Icon className={cn("h-5 w-5", isActive && "stroke-[2.5]")} />
      )}

      <span className={cn("mt-1", item.centre && "mt-1.5 text-[10px]")}>
        {item.label}
      </span>

      {/* Badge dot */}
      {hasBadge && !item.centre && (
        badgeCount! > 1 ? (
          <span className="absolute right-0 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
            {badgeCount! > 9 ? "9+" : badgeCount}
          </span>
        ) : (
          <span className="absolute right-1 top-2 h-2 w-2 rounded-full bg-primary" />
        )
      )}

      {/* Active indicator line */}
      {isActive && !item.centre && (
        <motion.div
          layoutId="bottomNavIndicator"
          className="absolute -bottom-1 h-0.5 w-4 rounded-full bg-primary"
          transition={springSnap}
        />
      )}
    </div>
  );

  if (isMore) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex flex-1 items-center justify-center"
        aria-label="More menu"
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      href={item.href}
      className="flex flex-1 items-center justify-center"
      aria-current={isActive ? "page" : undefined}
    >
      {content}
    </Link>
  );
}

// ---------------------------------------------------------------------------
// More Menu
// ---------------------------------------------------------------------------

function MoreMenu({
  items,
  open,
  onOpenChange,
  pathname,
}: {
  items: MoreItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pathname: string;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} side="bottom">
      <SheetOverlay onClick={() => onOpenChange(false)} />
      <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
        <div className="mb-6 pb-4 shadow-sm">
          <h2 className="text-lg font-semibold">More</h2>
        </div>
        <div className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onOpenChange(false)}
                className={cn(
                  "flex items-start gap-4 rounded-xl p-4 transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-muted"
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg",
                    isActive ? "bg-primary/20" : "bg-muted"
                  )}
                >
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
  );
}

// ---------------------------------------------------------------------------
// BottomNav
// ---------------------------------------------------------------------------

/**
 * Unified bottom navigation that renders the correct tabs for any role.
 * Reads from the centralised navigation config.
 */
export function BottomNav({ role, badges = {} }: BottomNavProps) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const navItems = getNavItems(role);
  const moreItems = getMoreItems(role);

  if (navItems.length === 0) return null;

  // Check if any "More" item is active
  const isMoreActive = moreItems.some((item) => pathname.startsWith(item.href));

  return (
    <>
      <nav
        aria-label={`${role} navigation`}
        className="fixed inset-x-0 bottom-0 z-40 flex h-[calc(4rem+env(safe-area-inset-bottom))] items-center justify-around border-t border-border/50 bg-background/95 pb-[env(safe-area-inset-bottom)] pt-1 backdrop-blur-lg lg:hidden"
      >
        {navItems.map((item) => {
          const isMore = item.href === "#more";
          const isActive = isMore
            ? isMoreActive
            : isNavItemActive(pathname, item.href);

          const badgeCount = item.badgeKey ? badges[item.badgeKey] : undefined;

          return (
            <NavTab
              key={item.href}
              item={item}
              isActive={isActive}
              badgeCount={badgeCount}
              onClick={isMore ? () => setMoreOpen(true) : undefined}
            />
          );
        })}
      </nav>

      <MoreMenu
        items={moreItems}
        open={moreOpen}
        onOpenChange={setMoreOpen}
        pathname={pathname}
      />
    </>
  );
}

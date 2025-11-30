"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/hooks/useAuth";
import { ChevronDown, Lock } from "lucide-react";
import {
  NAV_SECTIONS,
  type NavSection,
  type NavItem,
} from "@/components/dashboard/nav-config";

type SidebarProps = {
  className?: string;
  onNavigate?: () => void;
};

export function DashboardSidebar({ className, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { entitlements } = useAuth();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const navItemMap = useMemo(() => {
    const entries = new Map<
      string,
      {
        item: NavItem;
        section: NavSection;
      }
    >();
    NAV_SECTIONS.forEach((section) => {
      section.items.forEach((item) => {
        entries.set(item.href, { item, section });
      });
    });
    return entries;
  }, []);

  const canAccessSection = (requiredPlan?: string) => {
    if (!requiredPlan) return true;
    const currentPlan = entitlements?.plan || "professional";
    if (currentPlan === "founder_lifetime") return true;
    if (requiredPlan === "professional") return true;
    return currentPlan === requiredPlan;
  };

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [label]: prev[label] === undefined ? false : !prev[label],
    }));
  };

  const renderNavLink = (item: NavItem, section: NavSection) => {
    const isActive = pathname === item.href;
    const disabled = !!item.disabled;
    const requiredPlan = item.plan ?? section.plan;
    const lockedByPlan = !canAccessSection(requiredPlan);
    const locked = lockedByPlan || disabled;
    const href = disabled ? "#" : item.href;

    return (
      <Link
        key={`${section.label}-${item.label}`}
        href={href}
        onClick={(event) => {
          if (disabled) {
            event.preventDefault();
            return;
          }
          onNavigate?.();
        }}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        className={cn(
          "flex items-center gap-3 rounded-md px-4 py-2 text-sm transition-colors",
          locked
            ? "border border-dashed border-border/60 text-muted-foreground/70"
            : isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        <item.icon className={cn("h-4 w-4", locked ? "text-muted-foreground/70" : undefined)} />
        <span className="flex-1 truncate">{item.label}</span>
        {locked ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
            <Lock className="h-3 w-3" />
            {lockedByPlan ? (requiredPlan === "growth" ? "Growth" : "Studio") : "Soon"}
          </span>
        ) : null}
      </Link>
    );
  };

  const groupedConfigs: Array<{
    label: string;
    hrefs: string[];
    collapsible?: boolean;
  }> = [];

  const groupedHrefSet = new Set<string>();

  return (
    <div className={cn("flex h-full w-full flex-col px-2 pb-8 pt-6", className)}>
      <Link
        href="/dashboard"
        onClick={onNavigate}
        className="px-4 pb-6 text-xl font-semibold tracking-tight hover:text-primary transition-colors"
      >
        TutorLingua
      </Link>
      <nav className="flex-1 space-y-6">
        {groupedConfigs.map((group) => {
          const entries = group.hrefs
            .map((href) => navItemMap.get(href))
            .filter(
              (value): value is { item: NavItem; section: NavSection } =>
                value !== undefined
            );

          if (entries.length === 0) {
            return null;
          }

          entries.forEach(({ item }) => groupedHrefSet.add(item.href));

          if (!group.collapsible || entries.length === 1) {
            return (
              <div key={group.label}>
                <p className="px-4 text-xs font-semibold uppercase text-muted-foreground">
                  {group.label}
                </p>
                <div className="mt-2 space-y-1">
                  {entries.map(({ item, section }) => renderNavLink(item, section))}
                </div>
              </div>
            );
          }

          const isOpen = openGroups[group.label] ?? true;

          return (
            <div key={group.label}>
              <button
                type="button"
                onClick={() => toggleGroup(group.label)}
                className="flex w-full items-center justify-between rounded-md px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <span>{group.label}</span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform",
                    isOpen ? "rotate-180" : "rotate-0"
                  )}
                />
              </button>
              {isOpen ? (
                <div className="mt-1 space-y-1">
                  {entries.map(({ item, section }) => renderNavLink(item, section))}
                </div>
              ) : null}
            </div>
          );
        })}

        {NAV_SECTIONS.map((section) => {
          const remainingItems = section.items.filter(
            (item) => !groupedHrefSet.has(item.href)
          );

          if (remainingItems.length === 0) {
            return null;
          }

          return (
            <div key={section.label || "default"}>
              {section.label ? (
                <p className="px-4 text-xs font-semibold uppercase text-muted-foreground">
                  {section.label}
                </p>
              ) : null}
              <div className={section.label ? "mt-2 space-y-1" : "space-y-1"}>
                {remainingItems.map((item) => renderNavLink(item, section))}
              </div>
            </div>
          );
        })}
      </nav>
    </div>
  );
}

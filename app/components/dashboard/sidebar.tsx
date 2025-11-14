"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/hooks/useAuth";
import { Lock } from "lucide-react";
import {
  NAV_SECTIONS,
  type NavSection,
  type NavItem,
  type PlanName,
} from "@/components/dashboard/nav-config";

type SidebarProps = {
  className?: string;
  onNavigate?: () => void;
};

export function DashboardSidebar({ className, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { entitlements } = useAuth();

  const canAccessSection = (plan?: PlanName) => {
    if (!plan) return true;
    return plan === "growth" ? entitlements.growth : entitlements.studio;
  };

  return (
    <div className={cn("flex h-full w-full flex-col px-2 pb-8 pt-6", className)}>
      <div className="px-4 pb-6 text-xl font-semibold tracking-tight">TutorLingua</div>
      <nav className="flex-1 space-y-6">
        {NAV_SECTIONS.map((section) => {
          return (
            <div key={section.label}>
              <p className="px-4 text-xs font-semibold uppercase text-muted-foreground">
                {section.label}
              </p>
              <div className="mt-2 space-y-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.href;
                  const disabled = !!item.disabled;
                  const requiredPlan = (item as any).plan ?? section.plan;
                  const lockedByPlan = requiredPlan ? !canAccessSection(requiredPlan) : false;
                  const locked = lockedByPlan || disabled;
                  const href = lockedByPlan ? `/upgrade?plan=${requiredPlan}` : disabled ? "#" : item.href;

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
                          {lockedByPlan ? ((requiredPlan as any) === "growth" ? "Growth" : "Studio") : "Soon"}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
    </div>
  );
}

function PlanUpgradeTeaser({ plan }: { plan: PlanName }) {
  const copy =
    plan === "growth"
      ? {
          title: "Unlock the Growth plan",
          description:
            "Lead funnels, campaign analytics, and AI marketing prompts help you stay fully booked.",
        }
      : {
          title: "Scale with Studio",
          description:
            "Run group sessions, list curriculum in the marketplace, and access studio dashboards.",
        };

  return (
    <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 px-4 py-5">
      <p className="text-sm font-semibold">{copy.title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{copy.description}</p>
      <Link
        href={`/upgrade?plan=${plan}`}
        className="mt-3 inline-flex text-sm font-semibold text-primary"
      >
        View plans →
      </Link>
    </div>
  );
}

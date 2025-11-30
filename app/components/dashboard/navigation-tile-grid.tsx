"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NAV_SECTIONS, type PlanName } from "@/components/dashboard/nav-config";
import type { LucideIcon } from "lucide-react";
import { Lock } from "lucide-react";
import type { PlatformBillingPlan } from "@/lib/types/payments";

type NavigationTile = {
  href: string;
  label: string;
  description: string;
  Icon: LucideIcon;
  section: string;
  lockedReason?: "plan" | "soon";
  upgradePlan?: PlanName;
  order?: number;
};

type NavigationTileGridProps = {
  plan: PlatformBillingPlan;
};

export function NavigationTileGrid({ plan }: NavigationTileGridProps) {
  const canAccessSection = (required?: PlanName) => {
    if (!required) return true;
    if (plan === "founder_lifetime") return true;
    if (required === "professional") return true;
    return plan === required;
  };

  const tiles: NavigationTile[] = [];

  NAV_SECTIONS.forEach((section) => {
    section.items.forEach((item) => {
      // Include all items; mark locked if section or item plan is not accessible or item is disabled (Soon)
      const requiredPlan = (item as any).plan ?? section.plan;
      const lockedByPlan = !!requiredPlan && !canAccessSection(requiredPlan);
      const lockedBySoon = !!item.disabled;

      const cleanedLabel = item.label.replace(/\s+\(Soon\)$/i, "");
      const description = item.description ?? `Navigate to ${cleanedLabel}`;

      tiles.push({
        href: lockedByPlan ? `/upgrade?plan=${requiredPlan}` : item.href,
        label: cleanedLabel,
        description,
        Icon: item.icon,
        section: section.label,
        lockedReason: lockedByPlan ? "plan" : lockedBySoon ? "soon" : undefined,
        upgradePlan: lockedByPlan ? requiredPlan : undefined,
        order: (item as any).order,
      });
    });
  });

  // Remove duplicates based on href
  const uniqueTiles = Array.from(
    new Map(tiles.map((tile) => [`${tile.section}|${tile.label}`, tile])).values()
  );

  // Sort by explicit order first (ascending), then by section then label
  const sortedTiles = uniqueTiles.sort((a, b) => {
    const orderA = a.order ?? Number.POSITIVE_INFINITY;
    const orderB = b.order ?? Number.POSITIVE_INFINITY;
    if (orderA !== orderB) return orderA - orderB;
    if (a.section !== b.section) return a.section.localeCompare(b.section);
    return a.label.localeCompare(b.label);
  });

  return (
    <section className="grid gap-4 sm:grid-cols-2">
      {sortedTiles.map((tile) => {
        const isLocked = !!tile.lockedReason;
        const href = isLocked && tile.lockedReason === "soon" ? "#" : tile.href;
        return (
          <Link
            key={`${tile.section}-${tile.label}`}
            href={href}
            onClick={(event) => {
              if (isLocked && tile.lockedReason === "soon") {
                event.preventDefault();
              }
            }}
            className="group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2"
            aria-disabled={isLocked && tile.lockedReason === "soon"}
            tabIndex={isLocked && tile.lockedReason === "soon" ? -1 : 0}
          >
            <Card
              className={[
                "h-full rounded-3xl border bg-background/95 shadow-sm transition duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md",
                isLocked
                  ? "border-dashed border-border/70 opacity-90"
                  : "border-border/60 group-hover:border-primary/50",
              ].join(" ")}
            >
              <CardHeader className="flex flex-row items-start justify-between space-y-0 p-6 pb-2">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {tile.section}
                  </p>
                  <CardTitle className="mt-1 flex items-center gap-2 text-lg font-semibold text-foreground">
                    {tile.label}
                    {isLocked ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                        <Lock className="h-3 w-3" />
                        {tile.lockedReason === "plan" ? "Upgrade" : "Soon"}
                      </span>
                    ) : null}
                  </CardTitle>
                </div>
                <tile.Icon
                  className={[
                    "h-5 w-5 shrink-0 transition-colors",
                    isLocked ? "text-muted-foreground/60" : "text-muted-foreground group-hover:text-primary",
                  ].join(" ")}
                />
              </CardHeader>
              <CardContent className="px-6 pb-6 pt-0">
                <p className="text-sm text-muted-foreground">{tile.description}</p>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </section>
  );
}

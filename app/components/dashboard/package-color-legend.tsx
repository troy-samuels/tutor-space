"use client";

import { PACKAGE_COLORS, type PackageType } from "@/lib/types/calendar";

type PackageColorLegendProps = {
  showExternal?: boolean;
  className?: string;
};

// Define the order of items to display
const LEGEND_ITEMS: { type: PackageType; show: boolean }[] = [
  { type: "trial", show: true },
  { type: "one_off", show: true },
  { type: "subscription", show: true },
  { type: "external", show: true },
];

export function PackageColorLegend({
  showExternal = true,
  className = "",
}: PackageColorLegendProps) {
  const items = LEGEND_ITEMS.filter(
    (item) => item.show && (item.type !== "external" || showExternal)
  );

  return (
    <div className={`flex flex-wrap items-center gap-3 text-xs ${className}`}>
      {items.map(({ type }) => {
        const colors = PACKAGE_COLORS[type];
        return (
          <div key={type} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-full ${colors.dot}`} />
            <span className="text-muted-foreground">{colors.label}</span>
          </div>
        );
      })}
    </div>
  );
}

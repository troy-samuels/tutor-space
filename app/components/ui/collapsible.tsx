"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Collapsible section component for expandable content.
 * Features a header with title, optional icon, and badge.
 *
 * @example
 * // Basic collapsible
 * <Collapsible title="Details">
 *   <p>Hidden content here...</p>
 * </Collapsible>
 *
 * @example
 * // With icon and defaultOpen
 * <Collapsible
 *   title="Settings"
 *   icon={<Settings className="h-4 w-4" />}
 *   defaultOpen
 * >
 *   <SettingsForm />
 * </Collapsible>
 *
 * @example
 * // With badge (e.g., count indicator)
 * <Collapsible
 *   title="Notifications"
 *   badge={<Badge variant="destructive">5</Badge>}
 * >
 *   <NotificationList />
 * </Collapsible>
 */
type CollapsibleProps = {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  badge?: ReactNode;
};

export function Collapsible({
  title,
  icon,
  children,
  defaultOpen = false,
  badge,
}: CollapsibleProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="rounded-3xl border border-border/60 bg-background/90 shadow-sm backdrop-blur">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between p-6 text-left transition-colors hover:bg-muted/20"
      >
        <div className="flex items-center gap-2">
          {icon && <span className="text-muted-foreground">{icon}</span>}
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          {badge && <span>{badge}</span>}
        </div>
        <ChevronDown
          className={cn(
            "h-5 w-5 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>
      {isOpen && (
        <div className="space-y-4 px-6 pb-6">
          {children}
        </div>
      )}
    </div>
  );
}

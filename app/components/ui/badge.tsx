"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Badge component props for status indicators and labels.
 *
 * @example
 * // Default badge (primary color)
 * <Badge>New</Badge>
 *
 * @example
 * // Success status
 * <Badge variant="success">Active</Badge>
 *
 * @example
 * // Destructive/error status
 * <Badge variant="destructive">Failed</Badge>
 *
 * @example
 * // Outline style
 * <Badge variant="outline">Draft</Badge>
 *
 * @example
 * // Secondary style
 * <Badge variant="secondary">Archived</Badge>
 */
export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Badge style variant.
   * - `default`: Primary brand color (orange)
   * - `secondary`: Secondary muted style
   * - `outline`: Bordered with transparent background
   * - `success`: Green for positive states (Active, Complete)
   * - `destructive`: Red for errors or warnings (Failed, Expired)
   */
  variant?: "default" | "secondary" | "outline" | "success" | "destructive";
}

const variantClasses: Record<NonNullable<BadgeProps["variant"]>, string> = {
  default: "bg-primary text-primary-foreground",
  secondary: "bg-secondary text-secondary-foreground",
  outline: "border border-border text-foreground",
  success: "bg-emerald-100 text-emerald-800",
  destructive: "bg-destructive text-destructive-foreground",
};

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-full px-3.5 py-1.5 text-xs font-semibold",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  )
);
Badge.displayName = "Badge";

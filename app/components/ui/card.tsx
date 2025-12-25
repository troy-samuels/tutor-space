"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Card container component for grouping related content.
 * Uses rounded corners (rounded-3xl), subtle shadow, and backdrop blur.
 *
 * @example
 * // Basic card with header and content
 * <Card>
 *   <CardHeader>
 *     <CardTitle>Lesson Summary</CardTitle>
 *     <CardDescription>Your progress this week</CardDescription>
 *   </CardHeader>
 *   <CardContent>
 *     <p>You completed 5 lessons!</p>
 *   </CardContent>
 *   <CardFooter>
 *     <Button>View Details</Button>
 *   </CardFooter>
 * </Card>
 *
 * @example
 * // Simple card without header
 * <Card className="p-6">
 *   <p>Quick content card</p>
 * </Card>
 */
export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-3xl bg-card text-foreground shadow-md backdrop-blur",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Card header section. Contains title and description.
 * Applies vertical spacing (space-y-1.5) between children.
 */
export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col space-y-1.5", className)} {...props} />
  );
}

/**
 * Card title component. Renders as h3 with semibold weight.
 * Use inside CardHeader for proper spacing.
 */
export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("text-lg font-semibold leading-none", className)} {...props} />
  );
}

/**
 * Card description component. Renders muted text below the title.
 * Use inside CardHeader for proper spacing.
 */
export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

/**
 * Card content section. The main body of the card.
 * Has top margin (mt-4) and fills available space (flex-1).
 */
export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-4 flex-1", className)} {...props} />;
}

/**
 * Card footer section. Typically contains action buttons.
 * Has top padding (pt-4) to separate from content.
 */
export function CardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("pt-4", className)} {...props} />
  );
}


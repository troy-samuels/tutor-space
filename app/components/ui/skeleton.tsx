"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Loading placeholder component with pulse animation.
 * Use to indicate loading state while content is being fetched.
 *
 * @example
 * // Basic skeleton (rectangle)
 * <Skeleton className="h-4 w-[200px]" />
 *
 * @example
 * // Card skeleton
 * <Card>
 *   <CardHeader>
 *     <Skeleton className="h-6 w-[150px]" />
 *     <Skeleton className="h-4 w-[100px]" />
 *   </CardHeader>
 *   <CardContent>
 *     <Skeleton className="h-20 w-full" />
 *   </CardContent>
 * </Card>
 *
 * @example
 * // Circle skeleton (avatar placeholder)
 * <Skeleton className="h-10 w-10 rounded-full" />
 */
export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
);
Skeleton.displayName = "Skeleton";

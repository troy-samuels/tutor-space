"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/lib/utils";

/**
 * Progress bar component for showing completion status.
 * Built on Radix UI Progress for accessibility.
 *
 * @example
 * // Basic progress bar
 * <Progress value={33} />
 *
 * @example
 * // Full progress
 * <Progress value={100} />
 *
 * @example
 * // Custom styled progress
 * <Progress
 *   value={75}
 *   className="h-2"
 *   indicatorClassName="bg-green-500"
 * />
 *
 * @example
 * // Progress with label
 * <div>
 *   <p className="text-sm mb-1">Uploading: 45%</p>
 *   <Progress value={45} />
 * </div>
 */
interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  indicatorClassName?: string;
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, indicatorClassName, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn("h-full w-full flex-1 bg-primary transition-all duration-500 ease-out", indicatorClassName)}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };

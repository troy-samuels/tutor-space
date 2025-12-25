"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Multi-line text input component.
 * Styled consistently with Input component.
 *
 * @example
 * // Basic textarea
 * <Textarea placeholder="Enter your message..." />
 *
 * @example
 * // With rows configuration
 * <Textarea rows={5} placeholder="Detailed notes..." />
 *
 * @example
 * // With label
 * <Label htmlFor="notes">Lesson Notes</Label>
 * <Textarea id="notes" placeholder="What did you cover?" />
 *
 * @example
 * // Disabled state
 * <Textarea disabled value="Read-only content" />
 */
export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

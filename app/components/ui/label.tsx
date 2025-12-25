"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Form label component for input fields.
 * Styled to work with the Input, Textarea, and Checkbox components.
 *
 * @example
 * // Basic label with input
 * <Label htmlFor="email">Email Address</Label>
 * <Input id="email" type="email" />
 *
 * @example
 * // Label with checkbox
 * <div className="flex items-center gap-2">
 *   <Checkbox id="terms" />
 *   <Label htmlFor="terms">Accept terms and conditions</Label>
 * </div>
 *
 * @example
 * // Required field indicator
 * <Label htmlFor="name">
 *   Name <span className="text-destructive">*</span>
 * </Label>
 * <Input id="name" required />
 */
export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn("text-sm font-medium leading-none text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)}
      {...props}
    />
  )
);
Label.displayName = "Label";

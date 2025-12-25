"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Input component props. Extends all standard HTML input attributes.
 *
 * @example
 * // Basic text input
 * <Input placeholder="Enter your name" />
 *
 * @example
 * // Email input with label
 * <Label htmlFor="email">Email</Label>
 * <Input id="email" type="email" placeholder="you@example.com" />
 *
 * @example
 * // Disabled input
 * <Input disabled value="Cannot edit" />
 *
 * @example
 * // With custom className
 * <Input className="max-w-sm" placeholder="Short input" />
 */
export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-md bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
);
Input.displayName = "Input";

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Checkbox input component with indeterminate state support.
 *
 * @example
 * // Basic checkbox
 * <Checkbox id="terms" />
 * <Label htmlFor="terms">Accept terms</Label>
 *
 * @example
 * // Controlled checkbox
 * <Checkbox
 *   checked={isChecked}
 *   onCheckedChange={setIsChecked}
 * />
 *
 * @example
 * // Indeterminate state (partial selection)
 * <Checkbox indeterminate />
 *
 * @example
 * // Disabled checkbox
 * <Checkbox disabled checked />
 */
export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  /** When true, shows indeterminate/partial state (e.g., for "select all" with partial selection) */
  indeterminate?: boolean;
  /** Callback when checked state changes. Simpler than onChange for boolean state. */
  onCheckedChange?: (checked: boolean) => void;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, indeterminate, onCheckedChange, onChange, ...props }, ref) => {
    const internalRef = React.useRef<HTMLInputElement | null>(null);

    React.useEffect(() => {
      if (internalRef.current) {
        internalRef.current.indeterminate = !!indeterminate;
      }
    }, [indeterminate]);

    return (
      <input
        ref={(node) => {
          internalRef.current = node;
          if (typeof ref === "function") {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        }}
        type="checkbox"
        className={cn(
          "h-4 w-4 rounded border border-input text-primary focus:ring-2 focus:ring-primary/50 focus:ring-offset-2",
          className
        )}
        onChange={(event) => {
          onCheckedChange?.(event.target.checked);
          onChange?.(event);
        }}
        {...props}
      />
    );
  }
);
Checkbox.displayName = "Checkbox";

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Custom Select component system with dropdown functionality.
 * Provides a consistent select/dropdown interface across the design system.
 *
 * @example
 * // Basic select
 * <Select value={selected} onValueChange={setSelected}>
 *   <SelectTrigger>
 *     <SelectValue placeholder="Choose an option" />
 *   </SelectTrigger>
 *   <SelectContent>
 *     <SelectItem value="option1">Option 1</SelectItem>
 *     <SelectItem value="option2">Option 2</SelectItem>
 *     <SelectItem value="option3">Option 3</SelectItem>
 *   </SelectContent>
 * </Select>
 *
 * @example
 * // Disabled select
 * <Select disabled>
 *   <SelectTrigger>
 *     <SelectValue placeholder="Unavailable" />
 *   </SelectTrigger>
 *   <SelectContent>...</SelectContent>
 * </Select>
 */

type SelectContextValue = {
  value?: string;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  open: boolean;
  setOpen: (open: boolean) => void;
  onSelect: (value: string, label?: string) => void;
};

const SelectContext = React.createContext<SelectContextValue | null>(null);

function useSelectContext() {
  const context = React.useContext(SelectContext);
  if (!context) {
    throw new Error("Select components must be used within <Select>");
  }
  return context;
}

/**
 * Select root component props.
 */
export interface SelectProps {
  /** Controlled value */
  value?: string;
  /** Initial value for uncontrolled usage */
  defaultValue?: string;
  /** Placeholder text when no value is selected */
  placeholder?: string;
  /** Disables the select */
  disabled?: boolean;
  /** Callback when selection changes */
  onValueChange?: (value: string) => void;
  /** SelectTrigger and SelectContent */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

export function Select({
  value,
  defaultValue,
  placeholder,
  disabled,
  onValueChange,
  children,
  className,
}: SelectProps) {
  const [open, setOpen] = React.useState(false);
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const [label, setLabel] = React.useState<string | undefined>();

  const currentValue = value ?? internalValue;

  const handleSelect = (nextValue: string, nextLabel?: string) => {
    setInternalValue(nextValue);
    setLabel(nextLabel ?? nextValue);
    onValueChange?.(nextValue);
    setOpen(false);
  };

  return (
    <SelectContext.Provider
      value={{
        value: currentValue,
        label,
        placeholder,
        disabled,
        open,
        setOpen,
        onSelect: handleSelect,
      }}
    >
      <div className={cn("relative inline-block w-full min-w-[200px]", className)}>
        {children}
      </div>
    </SelectContext.Provider>
  );
}

export interface SelectTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const { open, setOpen, disabled } = useSelectContext();
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
          open ? "ring-2 ring-primary/50" : null,
          className
        )}
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);
SelectTrigger.displayName = "SelectTrigger";

export function SelectValue({ placeholder }: { placeholder?: string }) {
  const { value, label, placeholder: ctxPlaceholder } = useSelectContext();
  return (
    <span className="truncate text-left text-sm text-foreground">
      {label || value || placeholder || ctxPlaceholder || "Select an option"}
    </span>
  );
}

export interface SelectContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const SelectContent = React.forwardRef<HTMLDivElement, SelectContentProps>(
  ({ className, children, ...props }, ref) => {
    const { open } = useSelectContext();
    if (!open) return null;

    return (
      <div
        ref={ref}
        className={cn(
          "absolute z-50 mt-2 w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-lg",
          className
        )}
        {...props}
      >
        <div className="max-h-60 overflow-y-auto py-1">{children}</div>
      </div>
    );
  }
);
SelectContent.displayName = "SelectContent";

export interface SelectItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  children: React.ReactNode;
}

export const SelectItem = React.forwardRef<HTMLButtonElement, SelectItemProps>(
  ({ value, children, className, ...props }, ref) => {
    const { value: selected, onSelect } = useSelectContext();
    const isSelected = selected === value;

    return (
      <button
        ref={ref}
        type="button"
        role="option"
        aria-selected={isSelected}
        className={cn(
          "flex w-full items-center justify-between px-3 py-2 text-sm text-left hover:bg-muted focus:bg-muted focus:outline-none",
          isSelected ? "bg-primary/10 text-primary" : "text-foreground",
          className
        )}
        onClick={() => onSelect(value, typeof children === "string" ? children : undefined)}
        {...props}
      >
        <span>{children}</span>
        {isSelected ? <span className="text-xs font-semibold">Selected</span> : null}
      </button>
    );
  }
);
SelectItem.displayName = "SelectItem";

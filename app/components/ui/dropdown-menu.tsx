"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type DropdownContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const DropdownMenuContext = React.createContext<DropdownContextValue | null>(null);

function useDropdownContext() {
  const context = React.useContext(DropdownMenuContext);
  if (!context) {
    throw new Error("DropdownMenu components must be used within <DropdownMenu>");
  }
  return context;
}

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block">{children}</div>
    </DropdownMenuContext.Provider>
  );
}

export interface DropdownMenuTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  children: React.ReactNode;
}

export const DropdownMenuTrigger = React.forwardRef<HTMLButtonElement, DropdownMenuTriggerProps>(
  ({ className, asChild, children, ...props }, ref) => {
    const { open, setOpen } = useDropdownContext();
    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<any>;
      return React.cloneElement(child, {
        onClick: (event: React.MouseEvent) => {
          child.props?.onClick?.(event);
          setOpen(!open);
        },
      });
    }

    return (
      <button
        ref={ref}
        type="button"
        className={cn("inline-flex items-center gap-2", className)}
        onClick={() => setOpen(!open)}
        {...props}
      >
        {children}
      </button>
    );
  }
);
DropdownMenuTrigger.displayName = "DropdownMenuTrigger";

export interface DropdownMenuContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  align?: "start" | "end";
}

export const DropdownMenuContent = React.forwardRef<HTMLDivElement, DropdownMenuContentProps>(
  ({ className, align = "start", children, ...props }, ref) => {
    const { open, setOpen } = useDropdownContext();
    if (!open) return null;

    const alignment = align === "end" ? "right-0" : "left-0";

    return (
      <div
        ref={ref}
        className={cn(
          "absolute z-50 mt-2 min-w-[180px] rounded-md border bg-popover p-1 text-popover-foreground shadow-lg",
          alignment,
          className
        )}
        role="menu"
        onMouseLeave={() => setOpen(false)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
DropdownMenuContent.displayName = "DropdownMenuContent";

export const DropdownMenuItem = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    className={cn(
      "flex w-full items-center justify-between rounded-sm px-3 py-2 text-sm text-left hover:bg-muted focus:bg-muted focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    role="menuitem"
    {...props}
  >
    {children}
  </button>
));
DropdownMenuItem.displayName = "DropdownMenuItem";

export const DropdownMenuLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground", className)}
    {...props}
  />
));
DropdownMenuLabel.displayName = "DropdownMenuLabel";

export const DropdownMenuSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("my-1 h-px w-full bg-border", className)}
    role="separator"
    {...props}
  />
));
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";

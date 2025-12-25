"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Sheet (Side Drawer) component system for slide-out panels.
 * Can slide in from any side of the screen.
 *
 * @example
 * // Left sidebar sheet
 * const [open, setOpen] = useState(false);
 *
 * <Sheet open={open} onOpenChange={setOpen} side="left">
 *   <SheetOverlay onClick={() => setOpen(false)} />
 *   <SheetContent>
 *     <nav>Navigation items...</nav>
 *   </SheetContent>
 * </Sheet>
 *
 * @example
 * // Right panel sheet
 * <Sheet open={open} onOpenChange={setOpen} side="right">
 *   <SheetOverlay onClick={() => setOpen(false)} />
 *   <SheetContent className="w-96">
 *     <h2>Details Panel</h2>
 *     <p>Content here...</p>
 *   </SheetContent>
 * </Sheet>
 *
 * @example
 * // Bottom sheet (mobile-style)
 * <Sheet open={open} onOpenChange={setOpen} side="bottom">
 *   <SheetOverlay onClick={() => setOpen(false)} />
 *   <SheetContent>
 *     <div className="p-4">Bottom sheet content</div>
 *   </SheetContent>
 * </Sheet>
 */

type SheetSide = "left" | "right" | "top" | "bottom";

type SheetContextValue = {
  open: boolean;
  side: SheetSide;
  setOpen?: (open: boolean) => void;
};

const SheetContext = React.createContext<SheetContextValue | null>(null);

export interface SheetProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  side?: SheetSide;
}

export function Sheet({ open, onOpenChange, children, side = "left" }: SheetProps) {
  return (
    <SheetContext.Provider value={{ open, side, setOpen: onOpenChange }}>
      {children}
    </SheetContext.Provider>
  );
}

function useSheetContext() {
  const context = React.useContext(SheetContext);
  if (!context) {
    throw new Error("Sheet components must be used within <Sheet>");
  }
  return context;
}

export interface SheetContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: SheetSide;
}

export const SheetContent = React.forwardRef<HTMLDivElement, SheetContentProps>(
  ({ className, side: overridesSide, ...props }, ref) => {
    const { open, side: contextSide } = useSheetContext();
    const side = overridesSide ?? contextSide;

    const sideClasses: Record<SheetSide, string> = {
      left: open ? "translate-x-0" : "-translate-x-full",
      right: open ? "translate-x-0" : "translate-x-full",
      top: open ? "translate-y-0" : "-translate-y-full",
      bottom: open ? "translate-y-0" : "translate-y-full",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "fixed inset-y-0 z-50 flex h-full w-72 max-w-full flex-col border-r border-border bg-background shadow-lg transition-transform duration-300 ease-in-out",
          side === "right" && "right-0 border-l border-r-0",
          side === "left" && "left-0",
          side === "top" && "top-0 h-auto border-b border-t-0",
          side === "bottom" && "bottom-0 h-auto border-t border-b-0",
          sideClasses[side],
          className,
        )}
        {...props}
      />
    );
  },
);
SheetContent.displayName = "SheetContent";

export type SheetOverlayProps = React.HTMLAttributes<HTMLDivElement>;

export const SheetOverlay = React.forwardRef<HTMLDivElement, SheetOverlayProps>(
  ({ className, ...props }, ref) => {
    const { open } = useSheetContext();

    return (
      <div
        ref={ref}
        aria-hidden="true"
        className={cn(
          "fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ease-in-out",
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
          className,
        )}
        {...props}
      />
    );
  },
);
SheetOverlay.displayName = "SheetOverlay";

export function useSheetController() {
  const { setOpen } = useSheetContext();
  return React.useCallback(
    (open: boolean) => {
      setOpen?.(open);
    },
    [setOpen],
  );
}

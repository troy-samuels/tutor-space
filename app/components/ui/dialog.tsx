"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Dialog (Modal) component system for overlays and popups.
 * Built with accessibility in mind - manages focus, body scroll lock, and backdrop.
 *
 * @example
 * // Basic dialog
 * const [open, setOpen] = useState(false);
 *
 * <Button onClick={() => setOpen(true)}>Open Dialog</Button>
 * <Dialog open={open} onOpenChange={setOpen}>
 *   <DialogContent>
 *     <DialogHeader>
 *       <DialogTitle>Confirm Action</DialogTitle>
 *       <DialogDescription>Are you sure you want to continue?</DialogDescription>
 *     </DialogHeader>
 *     <DialogBody>
 *       <p>This action cannot be undone.</p>
 *     </DialogBody>
 *     <DialogFooter>
 *       <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
 *       <Button onClick={handleConfirm}>Confirm</Button>
 *     </DialogFooter>
 *   </DialogContent>
 * </Dialog>
 *
 * @example
 * // Full-width dialog for complex content
 * <Dialog open={open} onOpenChange={setOpen}>
 *   <DialogContent size="full">
 *     <DialogHeader>
 *       <DialogTitle>Full Page Editor</DialogTitle>
 *     </DialogHeader>
 *     <DialogBody>{children}</DialogBody>
 *   </DialogContent>
 * </Dialog>
 */

type DialogContextValue = {
  open: boolean;
  setOpen?: (open: boolean) => void;
};

const DialogContext = React.createContext<DialogContextValue | null>(null);

/**
 * Dialog root component. Controls open state and provides context.
 */
export interface DialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when open state should change (e.g., clicking backdrop or close button) */
  onOpenChange?: (open: boolean) => void;
  /** Dialog content and related components */
  children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <DialogContext.Provider value={{ open, setOpen: onOpenChange }}>
      {children}
    </DialogContext.Provider>
  );
}

function useDialogContext() {
  const context = React.useContext(DialogContext);
  if (!context) {
    throw new Error("Dialog components must be used within <Dialog>");
  }
  return context;
}

/**
 * Dialog content container. Renders the modal panel with backdrop.
 */
export interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Dialog width size.
   * - `sm`: max-w-md (448px) - Simple confirmations
   * - `md`: max-w-2xl (672px) - Forms
   * - `lg`: max-w-4xl (896px) - Complex content (default)
   * - `xl`: max-w-6xl (1152px) - Large forms/tables
   * - `full`: max-w-[95vw] - Full screen content
   */
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

export const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, size = "lg", children, ...props }, ref) => {
    const { open, setOpen } = useDialogContext();

    if (!open) return null;

    const sizeClasses = {
      sm: "max-w-md",
      md: "max-w-2xl",
      lg: "max-w-4xl",
      xl: "max-w-6xl",
      full: "max-w-[95vw]",
    };

    return (
      <>
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen?.(false)}
        />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            ref={ref}
            className={cn(
              "relative w-full rounded-3xl bg-background shadow-2xl",
              sizeClasses[size],
              className
            )}
            onClick={(e) => e.stopPropagation()}
            {...props}
          >
            <button
              type="button"
              onClick={() => setOpen?.(false)}
              className="absolute right-4 top-4 z-10 rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </button>
            {children}
          </div>
        </div>
      </>
    );
  }
);
DialogContent.displayName = "DialogContent";

export interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export const DialogHeader = React.forwardRef<HTMLDivElement, DialogHeaderProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex flex-col space-y-1.5 p-6", className)}
        {...props}
      />
    );
  }
);
DialogHeader.displayName = "DialogHeader";

export interface DialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export const DialogFooter = React.forwardRef<HTMLDivElement, DialogFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 p-6 pt-0", className)}
      {...props}
    />
  )
);
DialogFooter.displayName = "DialogFooter";

export interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

export const DialogTitle = React.forwardRef<HTMLHeadingElement, DialogTitleProps>(
  ({ className, ...props }, ref) => {
    return (
      <h2
        ref={ref}
        className={cn("text-lg font-semibold leading-none tracking-tight", className)}
        {...props}
      />
    );
  }
);
DialogTitle.displayName = "DialogTitle";

export interface DialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export const DialogDescription = React.forwardRef<HTMLParagraphElement, DialogDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
);
DialogDescription.displayName = "DialogDescription";

export interface DialogBodyProps extends React.HTMLAttributes<HTMLDivElement> {}

export const DialogBody = React.forwardRef<HTMLDivElement, DialogBodyProps>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn("p-6", className)} {...props} />;
  }
);
DialogBody.displayName = "DialogBody";

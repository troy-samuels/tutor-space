"use client";

import { useState, type ReactNode } from "react";
import { Eye, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type MobilePreviewToggleProps = {
  children: ReactNode;
  className?: string;
};

export function MobilePreviewToggle({
  children,
  className,
}: MobilePreviewToggleProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating preview button (visible on mobile only) */}
      <Button
        type="button"
        size="icon"
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-lg lg:hidden",
          className
        )}
      >
        <Eye className="h-6 w-6" />
        <span className="sr-only">Preview site</span>
      </Button>

      {/* Slide-up panel overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-hidden rounded-t-3xl bg-background shadow-2xl animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background px-4 py-3">
              <h3 className="text-sm font-semibold text-foreground">
                Site Preview
              </h3>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 rounded-full"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close preview</span>
              </Button>
            </div>

            {/* Preview content */}
            <div className="overflow-y-auto p-4">{children}</div>
          </div>
        </div>
      )}
    </>
  );
}

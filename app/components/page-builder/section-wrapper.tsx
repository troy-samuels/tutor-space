"use client";

import { cn } from "@/lib/utils";
import { Check, ChevronDown } from "lucide-react";
import { type ReactNode, useState } from "react";

type SectionWrapperProps = {
  title: string;
  description?: string;
  isComplete?: boolean;
  children: ReactNode;
  className?: string;
  defaultOpen?: boolean;
};

export function SectionWrapper({
  title,
  description,
  isComplete = false,
  children,
  className,
  defaultOpen = false,
}: SectionWrapperProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section
      className={cn(
        "rounded-2xl border border-border/30 bg-background transition-all",
        isOpen && "ring-1 ring-primary/20 shadow-md border-border/50",
        className
      )}
    >
      {/* Section header - clickable */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between p-5 text-left hover:bg-muted/30 transition-colors rounded-2xl"
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-full transition-colors",
              isComplete
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            {isComplete ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <div className="h-2 w-2 rounded-full bg-current" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              {title}
            </h3>
            {description && (
              <p className="text-xs text-muted-foreground/70">{description}</p>
            )}
          </div>
        </div>
        <ChevronDown
          className={cn(
            "h-5 w-5 text-muted-foreground transition-transform duration-200",
            isOpen ? "rotate-0" : "-rotate-90"
          )}
        />
      </button>

      {/* Section content - collapsible */}
      {isOpen && (
        <div className="px-5 pb-5">
          {children}
        </div>
      )}
    </section>
  );
}

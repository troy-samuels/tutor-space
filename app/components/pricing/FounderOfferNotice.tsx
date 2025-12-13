"use client";

import { cn } from "@/lib/utils";

type FounderOfferNoticeProps = {
  className?: string;
  variant?: "card" | "inline";
};

export function FounderOfferNotice({ className, variant = "card" }: FounderOfferNoticeProps) {
  const containerClasses =
    variant === "card"
      ? "rounded-2xl border border-dashed border-primary/70 bg-primary/10 px-4 py-3 text-sm"
      : "text-xs text-muted-foreground";

  const textColor = variant === "card" ? "text-foreground" : "text-muted-foreground";

  return (
    <div className={cn(containerClasses, className)}>
      <p className={cn("font-semibold", textColor)}>
        $39 a month. Full use of every tool.
      </p>
      <p
        className={cn(
          "mt-1",
          variant === "card" ? "text-sm text-foreground/80" : "text-xs text-muted-foreground"
        )}
      >
        Pro or Studio. Stop when you want.
      </p>
    </div>
  );
}

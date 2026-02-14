"use client";

import { cn } from "@/lib/utils";

interface ParticipantNameTagProps {
  name: string;
  className?: string;
}

export function ParticipantNameTag({ name, className }: ParticipantNameTagProps) {
  return (
    <div
      className={cn(
        "absolute bottom-3 left-3 z-10",
        "px-3 py-1.5 rounded-full",
        "bg-black/20 backdrop-blur-md",
        "text-white text-xs font-medium",
        "shadow-sm",
        className
      )}
    >
      {name}
    </div>
  );
}

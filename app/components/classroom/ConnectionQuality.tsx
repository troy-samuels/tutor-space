"use client";

import { useConnectionQualityIndicator } from "@livekit/components-react";
import { ConnectionQuality as LiveKitConnectionQuality } from "livekit-client";
import { cn } from "@/lib/utils";

interface ConnectionQualityProps {
  className?: string;
}

export function ConnectionQuality({ className }: ConnectionQualityProps) {
  const { quality } = useConnectionQualityIndicator();

  let filledBars = 0;
  let color = "bg-muted-foreground/50";
  let label = "Unknown";

  switch (quality) {
    case LiveKitConnectionQuality.Excellent:
      filledBars = 4;
      color = "bg-emerald-500";
      label = "Excellent";
      break;
    case LiveKitConnectionQuality.Good:
      filledBars = 3;
      color = "bg-amber-400";
      label = "Good";
      break;
    case LiveKitConnectionQuality.Poor:
      filledBars = 1;
      color = "bg-red-500";
      label = "Poor";
      break;
    default:
      filledBars = 0;
      color = "bg-muted-foreground/50";
  }

  const bars = [
    { height: "30%" },
    { height: "55%" },
    { height: "75%" },
    { height: "100%" },
  ];

  return (
    <div
      className={cn(
        "flex items-end gap-0.5 rounded-md bg-black/40 px-1.5 py-1 backdrop-blur-md",
        className
      )}
      aria-label={`Connection quality: ${label}`}
      title={`Connection quality: ${label}`}
    >
      {bars.map((bar, index) => (
        <span
          key={index}
          className={cn(
            "w-1 rounded-sm transition-all duration-200",
            index < filledBars ? color : "bg-white/30"
          )}
          style={{ height: bar.height }}
        />
      ))}
    </div>
  );
}

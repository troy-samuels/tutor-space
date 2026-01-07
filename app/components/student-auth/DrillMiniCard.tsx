"use client";

import Link from "next/link";
import {
  BookA,
  MessageSquare,
  Mic,
  Puzzle,
  Play,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DrillType } from "@/lib/actions/types";

interface DrillMiniCardProps {
  drill: {
    id: string;
    drill_type: DrillType;
    content: {
      type: string;
      prompt?: string;
    } | null;
    is_completed: boolean;
  };
}

const drillTypeConfig: Record<
  DrillType,
  { label: string; icon: typeof BookA; color: string }
> = {
  grammar: {
    label: "Grammar",
    icon: BookA,
    color: "text-blue-600",
  },
  vocabulary: {
    label: "Vocabulary",
    icon: MessageSquare,
    color: "text-purple-600",
  },
  pronunciation: {
    label: "Pronunciation",
    icon: Mic,
    color: "text-amber-600",
  },
  fluency: {
    label: "Fluency",
    icon: Puzzle,
    color: "text-emerald-600",
  },
};

export function DrillMiniCard({ drill }: DrillMiniCardProps) {
  const config = drillTypeConfig[drill.drill_type] || drillTypeConfig.grammar;
  const Icon = config.icon;

  const gameType = drill.content?.type;
  const gameLabel =
    gameType === "scramble"
      ? "Word Order"
      : gameType === "match"
        ? "Matching"
        : gameType === "gap-fill"
          ? "Fill in the Blank"
          : "Practice";

  if (drill.is_completed) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-emerald-50/50 px-3 py-2">
        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        <span className="flex-1 truncate text-sm text-emerald-700">
          {config.label} - {gameLabel}
        </span>
        <span className="text-xs text-emerald-600">Done</span>
      </div>
    );
  }

  return (
    <Link
      href={`/student/drills/${drill.id}`}
      className="group flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 transition-colors hover:border-primary/30 hover:bg-primary/5"
    >
      <Icon className={cn("h-4 w-4", config.color)} />
      <span className="flex-1 truncate text-sm text-foreground">
        {config.label} - {gameLabel}
      </span>
      <span className="flex items-center gap-1 text-xs text-muted-foreground group-hover:text-primary">
        <Play className="h-3 w-3" />
        Start
      </span>
    </Link>
  );
}

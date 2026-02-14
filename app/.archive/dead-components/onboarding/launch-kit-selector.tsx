"use client";

import { useTransition } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { launchTopics, type LaunchTopicId } from "@/lib/constants/launch-topics";
import { setLaunchTopic } from "@/lib/actions/launch-sprint";

type LaunchKitSelectorProps = {
  currentTopic: LaunchTopicId | null;
};

export function LaunchKitSelector({ currentTopic }: LaunchKitSelectorProps) {
  const [isPending, startTransition] = useTransition();

  const handleSelect = (topicId: LaunchTopicId) => {
    if (isPending || topicId === currentTopic) return;
    startTransition(async () => {
      await setLaunchTopic(topicId);
    });
  };

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {launchTopics.map((topic) => {
        const isActive = topic.id === currentTopic;
        return (
          <button
            type="button"
            key={topic.id}
            onClick={() => handleSelect(topic.id)}
            className={`rounded-2xl border px-4 py-4 text-left transition ${
              isActive
                ? "border-primary bg-primary/10 shadow-sm"
                : "border-border bg-background hover:border-primary/50"
            }`}
            disabled={isPending}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{topic.label}</p>
                <p className="text-xs font-medium text-muted-foreground">{topic.badge}</p>
              </div>
              {isActive ? (
                <CheckCircle2 className="h-5 w-5 text-primary" />
              ) : isPending ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : null}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{topic.description}</p>
          </button>
        );
      })}
    </div>
  );
}

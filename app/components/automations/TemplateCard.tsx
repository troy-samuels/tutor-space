"use client";

import { useState, useTransition } from "react";
import { Mail, Zap, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { activatePostLessonRule, getAutomationRule } from "@/lib/actions/automations";
import type { AutomationRule } from "@/lib/actions/automations";

const DEFAULT_MESSAGE = "Great lesson today, {{student_name}}! I'll send your next steps soon.";

interface TemplateCardProps {
  isPro: boolean;
  onActivated: (rule: AutomationRule) => void;
  onUpgradeRequired: () => void;
}

export function TemplateCard({
  isPro,
  onActivated,
  onUpgradeRequired,
}: TemplateCardProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleActivate = () => {
    if (!isPro) {
      onUpgradeRequired();
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await activatePostLessonRule();

      if (result.error === "upgrade_required") {
        onUpgradeRequired();
        return;
      }

      if (result.error) {
        setError(result.error);
        return;
      }

      // Fetch the newly created rule
      const rule = await getAutomationRule();
      if (rule) {
        onActivated(rule);
      }
    });
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
          <Mail className="h-5 w-5 text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900">
            Post-lesson follow-up
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Automatically send a message to students after each lesson ends.
          </p>
        </div>
      </div>

      {/* Message preview */}
      <div className="mt-4 rounded-lg bg-gray-50 p-4">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
          Message preview
        </p>
        <p className="text-sm text-gray-700 leading-relaxed">
          &ldquo;{DEFAULT_MESSAGE}&rdquo;
        </p>
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      )}

      {/* Action button */}
      <div className="mt-5 flex justify-end">
        <button
          onClick={handleActivate}
          disabled={isPending}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium",
            "bg-amber-500 text-white shadow-sm",
            "hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "transition-colors"
          )}
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Activating...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4" />
              Activate
            </>
          )}
        </button>
      </div>
    </div>
  );
}

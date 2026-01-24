"use client";

import { useTransition } from "react";
import { Mail, Moon, Package, Sparkles, Settings, Loader2, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleAutomationRuleById } from "@/lib/actions/automations";
import type { AutomationRule, AutomationTriggerType } from "@/lib/actions/automations";

// Configuration for each trigger type
const TRIGGER_STYLE: Record<
  AutomationTriggerType,
  {
    icon: LucideIcon;
    iconBg: string;
    iconColor: string;
    toggleBg: string;
    ringColor: string;
  }
> = {
  lesson_completed: {
    icon: Mail,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
    toggleBg: "bg-amber-500",
    ringColor: "focus:ring-amber-500",
  },
  student_inactive: {
    icon: Moon,
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-600",
    toggleBg: "bg-indigo-500",
    ringColor: "focus:ring-indigo-500",
  },
  package_low_balance: {
    icon: Package,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    toggleBg: "bg-emerald-500",
    ringColor: "focus:ring-emerald-500",
  },
  trial_completed_no_purchase: {
    icon: Sparkles,
    iconBg: "bg-purple-50",
    iconColor: "text-purple-600",
    toggleBg: "bg-purple-500",
    ringColor: "focus:ring-purple-500",
  },
};

interface ActiveRuleCardProps {
  rule: AutomationRule;
  onToggle: (isActive: boolean) => void;
  onCustomizeClick: () => void;
  disabled?: boolean;
}

export function ActiveRuleCard({
  rule,
  onToggle,
  onCustomizeClick,
  disabled,
}: ActiveRuleCardProps) {
  const [isPending, startTransition] = useTransition();

  const style = TRIGGER_STYLE[rule.trigger_type] || TRIGGER_STYLE.lesson_completed;
  const Icon = style.icon;

  const handleToggle = () => {
    startTransition(async () => {
      const result = await toggleAutomationRuleById(rule.id);
      if (!result.error) {
        onToggle(!rule.is_active);
      }
    });
  };

  const audienceLabel = rule.audience_type === "all_students"
    ? "All students"
    : "Specific student";

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", style.iconBg)}>
            <Icon className={cn("h-5 w-5", style.iconColor)} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-gray-900">
              {rule.name}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Sends to: {audienceLabel}
            </p>
          </div>
        </div>

        {/* Toggle switch */}
        <button
          onClick={handleToggle}
          disabled={isPending || disabled}
          className={cn(
            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-offset-2",
            style.ringColor,
            "disabled:opacity-50 disabled:cursor-not-allowed",
            rule.is_active ? style.toggleBg : "bg-gray-200"
          )}
          role="switch"
          aria-checked={rule.is_active}
          aria-label={rule.is_active ? "Deactivate rule" : "Activate rule"}
        >
          <span
            className={cn(
              "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
              rule.is_active ? "translate-x-6" : "translate-x-1"
            )}
          >
            {isPending && (
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            )}
          </span>
        </button>
      </div>

      {/* Customize button */}
      <div className="mt-5 flex justify-end">
        <button
          onClick={onCustomizeClick}
          disabled={disabled}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium",
            "text-gray-700 hover:bg-gray-50",
            "border border-gray-200",
            "focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "transition-colors"
          )}
        >
          <Settings className="h-4 w-4" />
          Customize
        </button>
      </div>
    </div>
  );
}

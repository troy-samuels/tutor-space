"use client";

import { useState, useTransition } from "react";
import {
	Mail,
	Moon,
	Package,
	Sparkles,
	Zap,
	Loader2,
	type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
	activateAutomationRule,
	getAutomationRule,
} from "@/lib/actions/automations";
import type {
	AutomationRule,
	AutomationTriggerType,
} from "@/lib/actions/automations";

// Configuration for each trigger type
const TRIGGER_CONFIG: Record<
	AutomationTriggerType,
	{
		icon: LucideIcon;
		iconBg: string;
		iconColor: string;
		title: string;
		description: string;
		defaultMessage: string;
		buttonBg: string;
		buttonHoverBg: string;
		ringColor: string;
	}
> = {
	lesson_completed: {
		icon: Mail,
		iconBg: "bg-amber-50",
		iconColor: "text-amber-600",
		title: "Post-lesson follow-up",
		description: "Automatically send a message to students after each lesson ends.",
		defaultMessage:
			"Great lesson today, {{student_name}}! I'll send your next steps soon.",
		buttonBg: "bg-amber-500",
		buttonHoverBg: "hover:bg-amber-600",
		ringColor: "focus:ring-amber-500",
	},
	student_inactive: {
		icon: Moon,
		iconBg: "bg-indigo-50",
		iconColor: "text-indigo-600",
		title: "Sleeping Giant (Re-engagement)",
		description:
			"Reach out to students who haven't booked a lesson in a while.",
		defaultMessage:
			"Hi {{student_name}}! It's been a while since our last lesson. I'd love to continue helping you progress. Book your next session here!",
		buttonBg: "bg-indigo-500",
		buttonHoverBg: "hover:bg-indigo-600",
		ringColor: "focus:ring-indigo-500",
	},
	package_low_balance: {
		icon: Package,
		iconBg: "bg-emerald-50",
		iconColor: "text-emerald-600",
		title: "Package Low-Balance Alert",
		description:
			"Alert students when their lesson package is running low.",
		defaultMessage:
			"Hi {{student_name}}! You're down to your last lesson credit. Renew your package to keep your preferred time slot!",
		buttonBg: "bg-emerald-500",
		buttonHoverBg: "hover:bg-emerald-600",
		ringColor: "focus:ring-emerald-500",
	},
	trial_completed_no_purchase: {
		icon: Sparkles,
		iconBg: "bg-purple-50",
		iconColor: "text-purple-600",
		title: "Trial Conversion Nudge",
		description:
			"Follow up with students 24 hours after their trial lesson if they haven't purchased.",
		defaultMessage:
			"Hi {{student_name}}! I hope you enjoyed our trial lesson. I have a specific plan for how we can hit your goals. Book your first full session here!",
		buttonBg: "bg-purple-500",
		buttonHoverBg: "hover:bg-purple-600",
		ringColor: "focus:ring-purple-500",
	},
};

interface AutomationTemplateCardProps {
	triggerType: AutomationTriggerType;
	isPro: boolean;
	onActivated: (rule: AutomationRule) => void;
	onUpgradeRequired: () => void;
}

export function AutomationTemplateCard({
	triggerType,
	isPro,
	onActivated,
	onUpgradeRequired,
}: AutomationTemplateCardProps) {
	const [isPending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);

	const config = TRIGGER_CONFIG[triggerType];
	const Icon = config.icon;

	const handleActivate = () => {
		if (!isPro) {
			onUpgradeRequired();
			return;
		}

		setError(null);
		startTransition(async () => {
			const result = await activateAutomationRule(triggerType);

			if (result.error === "upgrade_required") {
				onUpgradeRequired();
				return;
			}

			if (result.error) {
				setError(result.error);
				return;
			}

			// Fetch the newly created rule
			const rule = await getAutomationRule(triggerType);
			if (rule) {
				onActivated(rule);
			}
		});
	};

	return (
		<div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
			<div className="flex items-start gap-4">
				<div
					className={cn(
						"flex h-10 w-10 items-center justify-center rounded-xl",
						config.iconBg
					)}
				>
					<Icon className={cn("h-5 w-5", config.iconColor)} />
				</div>
				<div className="flex-1 min-w-0">
					<h3 className="text-base font-semibold text-gray-900">
						{config.title}
					</h3>
					<p className="mt-1 text-sm text-gray-500">{config.description}</p>
				</div>
			</div>

			{/* Message preview */}
			<div className="mt-4 rounded-lg bg-gray-50 p-4">
				<p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
					Message preview
				</p>
				<p className="text-sm text-gray-700 leading-relaxed">
					&ldquo;{config.defaultMessage}&rdquo;
				</p>
			</div>

			{error && <p className="mt-3 text-sm text-red-600">{error}</p>}

			{/* Action button */}
			<div className="mt-5 flex justify-end">
				<button
					onClick={handleActivate}
					disabled={isPending}
					className={cn(
						"inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium",
						config.buttonBg,
						"text-white shadow-sm",
						config.buttonHoverBg,
						"focus:outline-none focus:ring-2",
						config.ringColor,
						"focus:ring-offset-2",
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

// Export config for use in other components
export { TRIGGER_CONFIG };

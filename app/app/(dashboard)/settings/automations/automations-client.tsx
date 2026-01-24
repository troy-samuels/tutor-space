"use client";

import { useState, useTransition } from "react";
import { CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
	AutomationRule,
	AutomationEvent,
	AutomationTriggerType,
} from "@/lib/actions/automations";
import { AutomationTemplateCard } from "@/components/automations/AutomationTemplateCard";
import { ActiveRuleCard } from "@/components/automations/ActiveRuleCard";
import { ActivityList } from "@/components/automations/ActivityList";
import { CustomizeDrawer } from "@/components/automations/CustomizeDrawer";
import { UpgradeModal } from "@/components/automations/UpgradeModal";

// All available automation types in display order
const ALL_TRIGGER_TYPES: AutomationTriggerType[] = [
	"lesson_completed",
	"student_inactive",
	"package_low_balance",
	"trial_completed_no_purchase",
];

interface AutomationsClientProps {
	rules: AutomationRule[];
	activity: AutomationEvent[];
	isPro: boolean;
}

export function AutomationsClient({
	rules: initialRules,
	activity: initialActivity,
	isPro,
}: AutomationsClientProps) {
	const [rules, setRules] = useState<AutomationRule[]>(initialRules);
	const [activity] = useState<AutomationEvent[]>(initialActivity);
	const [drawerOpen, setDrawerOpen] = useState(false);
	const [selectedRule, setSelectedRule] = useState<AutomationRule | null>(null);
	const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
	const [toast, setToast] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	// Get rules by trigger type for easy lookup
	const rulesByType = rules.reduce(
		(acc, rule) => {
			acc[rule.trigger_type] = rule;
			return acc;
		},
		{} as Record<string, AutomationRule>
	);

	// Get active rules for display
	const activeRules = rules.filter((r) => r.is_active);
	const inactiveTypes = ALL_TRIGGER_TYPES.filter((t) => {
		const rule = rulesByType[t];
		return !rule || !rule.is_active;
	});

	const showToast = (message: string) => {
		setToast(message);
		setTimeout(() => setToast(null), 3000);
	};

	const handleActivated = (newRule: AutomationRule) => {
		startTransition(() => {
			setRules((prev) => [...prev, newRule]);
			showToast("Rule is active");
		});
	};

	const handleToggled = (ruleId: string, isActive: boolean) => {
		setRules((prev) =>
			prev.map((r) => (r.id === ruleId ? { ...r, is_active: isActive } : r))
		);
		showToast(isActive ? "Rule activated" : "Rule paused");
	};

	const handleUpdated = (updatedRule: AutomationRule) => {
		setRules((prev) =>
			prev.map((r) => (r.id === updatedRule.id ? updatedRule : r))
		);
		showToast("Rule updated");
		setDrawerOpen(false);
		setSelectedRule(null);
	};

	const handleDeleted = (ruleId: string) => {
		setRules((prev) => prev.filter((r) => r.id !== ruleId));
		showToast("Rule deleted");
		setDrawerOpen(false);
		setSelectedRule(null);
	};

	const handleUpgradeRequired = () => {
		setUpgradeModalOpen(true);
	};

	const handleCustomizeClick = (rule: AutomationRule) => {
		setSelectedRule(rule);
		setDrawerOpen(true);
	};

	return (
		<div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
			{/* Toast notification */}
			{toast && (
				<div className="fixed top-6 right-6 z-50 pointer-events-none">
					<div
						className={cn(
							"min-w-[200px] rounded-xl border px-4 py-3 shadow-lg pointer-events-auto",
							"flex items-center gap-3",
							"bg-emerald-50 border-emerald-200 text-emerald-900",
							"animate-in fade-in slide-in-from-top-2 duration-200"
						)}
						role="status"
						aria-live="polite"
					>
						<CheckCircle
							className="h-5 w-5 text-emerald-600 flex-shrink-0"
							aria-hidden
						/>
						<p className="text-sm font-medium">{toast}</p>
					</div>
				</div>
			)}

			{/* Header */}
			<div className="mb-8">
				<h1 className="text-2xl font-semibold tracking-tight text-gray-900">
					Automations
				</h1>
				<p className="mt-1 text-sm text-gray-500">
					Automate messages to students based on their activity
				</p>
			</div>

			{/* Active Rules Section */}
			{activeRules.length > 0 && (
				<div className="mb-8">
					<h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
						Active Automations
					</h2>
					<div className="space-y-4">
						{activeRules.map((rule) => (
							<ActiveRuleCard
								key={rule.id}
								rule={rule}
								onToggle={(isActive) => handleToggled(rule.id, isActive)}
								onCustomizeClick={() => handleCustomizeClick(rule)}
								disabled={isPending}
							/>
						))}
					</div>
				</div>
			)}

			{/* Available Templates Section */}
			{inactiveTypes.length > 0 && (
				<div>
					<h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
						{activeRules.length > 0
							? "More Automations"
							: "Available Automations"}
					</h2>
					<div className="space-y-4">
						{inactiveTypes.map((triggerType) => (
							<AutomationTemplateCard
								key={triggerType}
								triggerType={triggerType}
								isPro={isPro}
								onActivated={handleActivated}
								onUpgradeRequired={handleUpgradeRequired}
							/>
						))}
					</div>
				</div>
			)}

			{/* Activity List */}
			{activity.length > 0 && (
				<div className="mt-8">
					<ActivityList activity={activity} />
				</div>
			)}

			{/* Customize drawer */}
			<CustomizeDrawer
				open={drawerOpen}
				onClose={() => {
					setDrawerOpen(false);
					setSelectedRule(null);
				}}
				rule={selectedRule}
				onUpdated={handleUpdated}
				onDeleted={() => selectedRule && handleDeleted(selectedRule.id)}
			/>

			{/* Upgrade modal */}
			<UpgradeModal
				open={upgradeModalOpen}
				onClose={() => setUpgradeModalOpen(false)}
			/>
		</div>
	);
}

"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, Bot, CircleCheck, ListTodo, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { HomeworkAssignment, PracticeAssignment } from "@/lib/actions/progress";

type AssignmentsPageClientProps = {
	homework: HomeworkAssignment[];
	practiceAssignments: PracticeAssignment[];
	isPracticeSubscribed: boolean;
};

type AssignmentTab = "all" | "todo" | "completed";

type UnifiedAssignmentItem = {
	id: string;
	kind: "homework" | "practice";
	title: string;
	instructions: string | null;
	statusLabel: string;
	statusTone: string;
	dueDate: string | null;
	createdAt: string;
	isCompleted: boolean;
	practiceAssignmentId: string | null;
	hasPracticeExercises: boolean;
};

const TAB_OPTIONS: Array<{ id: AssignmentTab; label: string; icon: typeof ListTodo }> = [
	{ id: "all", label: "All", icon: BookOpen },
	{ id: "todo", label: "To Do", icon: ListTodo },
	{ id: "completed", label: "Completed", icon: CircleCheck },
];

function getHomeworkStatusStyles(status: HomeworkAssignment["status"]): {
	label: string;
	className: string;
} {
	switch (status) {
		case "assigned":
			return { label: "Assigned", className: "bg-blue-500/20 text-blue-300 border-blue-400/30" };
		case "in_progress":
			return { label: "In progress", className: "bg-amber-500/20 text-amber-300 border-amber-400/30" };
		case "submitted":
			return { label: "Submitted", className: "bg-purple-500/20 text-purple-300 border-purple-400/30" };
		case "completed":
			return { label: "Completed", className: "bg-emerald-500/20 text-emerald-300 border-emerald-400/30" };
		case "cancelled":
			return { label: "Cancelled", className: "bg-zinc-500/20 text-zinc-300 border-zinc-400/30" };
		default:
			return { label: "Draft", className: "bg-zinc-500/20 text-zinc-300 border-zinc-400/30" };
	}
}

function getPracticeStatusStyles(status: PracticeAssignment["status"]): {
	label: string;
	className: string;
} {
	switch (status) {
		case "in_progress":
			return { label: "In progress", className: "bg-amber-500/20 text-amber-300 border-amber-400/30" };
		case "completed":
			return { label: "Completed", className: "bg-emerald-500/20 text-emerald-300 border-emerald-400/30" };
		default:
			return { label: "Assigned", className: "bg-blue-500/20 text-blue-300 border-blue-400/30" };
	}
}

function getSortableDueDate(dateValue: string | null): number {
	if (!dateValue) {
		return Number.POSITIVE_INFINITY;
	}

	const timestamp = new Date(dateValue).getTime();
	return Number.isNaN(timestamp) ? Number.POSITIVE_INFINITY : timestamp;
}

export function AssignmentsPageClient({
	homework,
	practiceAssignments,
	isPracticeSubscribed,
}: AssignmentsPageClientProps) {
	const [activeTab, setActiveTab] = useState<AssignmentTab>("all");

	const mergedAssignments = useMemo(() => {
		const homeworkIds = new Set(homework.map((item) => item.id));
		const practiceById = new Map(practiceAssignments.map((assignment) => [assignment.id, assignment]));
		const practiceByHomeworkId = new Map(
			practiceAssignments
				.filter(
					(assignment): assignment is PracticeAssignment & { homework_assignment_id: string } =>
						typeof assignment.homework_assignment_id === "string" &&
						assignment.homework_assignment_id.length > 0
				)
				.map((assignment) => [assignment.homework_assignment_id, assignment])
		);

		const homeworkItems: UnifiedAssignmentItem[] = homework.map((item) => {
			const linkedPractice =
				practiceByHomeworkId.get(item.id) ||
				(item.practice_assignment_id
					? practiceById.get(item.practice_assignment_id) || null
					: null);
			const linkedPracticeId =
				linkedPractice?.id || item.practice_assignment?.id || item.practice_assignment_id || null;
			const status = getHomeworkStatusStyles(item.status);
			const isCompleted = item.status === "completed" || item.status === "cancelled";

			return {
				id: item.id,
				kind: "homework",
				title: item.title,
				instructions: item.instructions,
				statusLabel: status.label,
				statusTone: status.className,
				dueDate: item.due_date,
				createdAt: item.created_at,
				isCompleted,
				practiceAssignmentId: linkedPracticeId,
				hasPracticeExercises: Boolean(linkedPracticeId),
			};
		});

		const standalonePracticeItems: UnifiedAssignmentItem[] = practiceAssignments
			.filter((assignment) => {
				if (!assignment.homework_assignment_id) {
					return true;
				}

				return !homeworkIds.has(assignment.homework_assignment_id);
			})
			.map((assignment) => {
				const status = getPracticeStatusStyles(assignment.status);

				return {
					id: assignment.id,
					kind: "practice",
					title: assignment.title,
					instructions: assignment.instructions,
					statusLabel: status.label,
					statusTone: status.className,
					dueDate: assignment.due_date,
					createdAt: assignment.created_at,
					isCompleted: assignment.status === "completed",
					practiceAssignmentId: assignment.id,
					hasPracticeExercises: true,
				};
			});

		return [...homeworkItems, ...standalonePracticeItems].sort((a, b) => {
			const dueDateDiff = getSortableDueDate(a.dueDate) - getSortableDueDate(b.dueDate);
			if (dueDateDiff !== 0) return dueDateDiff;
			return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
		});
	}, [homework, practiceAssignments]);

	const filteredAssignments = useMemo(() => {
		if (activeTab === "all") {
			return mergedAssignments;
		}

		if (activeTab === "todo") {
			return mergedAssignments.filter((item) => !item.isCompleted);
		}

		return mergedAssignments.filter((item) => item.isCompleted);
	}, [activeTab, mergedAssignments]);

	return (
		<div className="space-y-6">
			<Card className="border-[#2D2B27] bg-[#1A1917] text-[#F5ECE3]">
				<CardHeader className="space-y-3">
					<CardTitle className="flex items-center gap-2 text-xl">
						<Sparkles className="h-5 w-5 text-[#E8784D]" />
						Assignments
					</CardTitle>
					<CardDescription className="text-[#C5B9AB]">
						Homework and AI practice now run as one flow.
					</CardDescription>
					<div className="flex flex-wrap gap-2">
						{TAB_OPTIONS.map((tab) => {
							const Icon = tab.icon;
							const isActive = activeTab === tab.id;

							return (
								<Button
									key={tab.id}
									type="button"
									variant="ghost"
									size="sm"
									onClick={() => setActiveTab(tab.id)}
									className={
										isActive
											? "bg-[#E8784D] text-[#1A1917] hover:bg-[#E8784D]/90"
											: "border border-[#3A3732] text-[#DDD2C6] hover:bg-[#2A2723]"
									}
								>
									<Icon className="h-4 w-4" />
									{tab.label}
								</Button>
							);
						})}
					</div>
				</CardHeader>
			</Card>

			<AnimatePresence mode="wait">
				<motion.div
					key={activeTab}
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -10 }}
					transition={{ duration: 0.2 }}
					className="space-y-3"
				>
					{filteredAssignments.length === 0 ? (
						<Card className="border-dashed border-[#3A3732] bg-[#1A1917] text-[#DDD2C6]">
							<CardContent className="py-10 text-center text-sm">
								No assignments in this tab yet.
							</CardContent>
						</Card>
					) : (
						filteredAssignments.map((item, index) => (
							<motion.div
								key={`${item.kind}-${item.id}`}
								initial={{ opacity: 0, y: 12 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: index * 0.03, duration: 0.18 }}
							>
								<Card className="border-[#2D2B27] bg-[#1A1917] text-[#F5ECE3]">
									<CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
										<div className="space-y-2">
											<div className="flex flex-wrap items-center gap-2">
												<Badge
													variant="outline"
													className="border-[#3A3732] text-[#C8BCB0]"
												>
													{item.kind === "homework" ? "Homework" : "Practice"}
												</Badge>
												<Badge className={`border ${item.statusTone}`}>{item.statusLabel}</Badge>
												{item.kind === "homework" ? (
													<Badge
														className={
															item.hasPracticeExercises
																? "border border-[#E8784D]/30 bg-[#E8784D]/15 text-[#E8784D]"
																: "border border-[#3A3732] bg-transparent text-[#BDAF9F]"
														}
													>
														<Bot className="mr-1 h-3 w-3" />
														{item.hasPracticeExercises
															? "Practice available"
															: "Practice unavailable"}
													</Badge>
												) : null}
											</div>
											<h2 className="text-lg font-semibold tracking-tight">{item.title}</h2>
											{item.instructions ? (
												<p className="max-w-2xl text-sm text-[#D5C9BC]">{item.instructions}</p>
											) : null}
											<p className="text-xs text-[#B8AA9A]">
												{item.dueDate
													? `Due ${formatDistanceToNow(new Date(item.dueDate), { addSuffix: true })}`
													: "No due date set"}
											</p>
										</div>

										<div className="flex flex-wrap items-center gap-2">
											{item.practiceAssignmentId ? (
												<Button
													asChild
													size="sm"
													className="bg-[#E8784D] text-[#1A1917] hover:bg-[#E8784D]/90"
												>
													<Link
														href={
															item.kind === "homework"
																? `/practice/start/${item.practiceAssignmentId}?source=homework&homeworkId=${item.id}`
																: `/practice/start/${item.practiceAssignmentId}`
														}
													>
														<Sparkles className="h-3.5 w-3.5" />
														Start Practice
													</Link>
												</Button>
											) : null}

											{item.kind === "homework" ? (
												<Button
													asChild
													size="sm"
													variant="outline"
													className="border-[#3A3732] bg-transparent text-[#DDD2C6] hover:bg-[#2A2723]"
												>
													<Link href="/student/homework">Open Homework</Link>
												</Button>
											) : null}

											{!isPracticeSubscribed && item.practiceAssignmentId ? (
												<Button
													asChild
													size="sm"
													variant="outline"
													className="border-[#E8784D]/40 bg-transparent text-[#E8784D] hover:bg-[#E8784D]/10"
												>
													<Link href="/student/practice/subscribe">Unlock Practice</Link>
												</Button>
											) : null}
										</div>
									</CardContent>
								</Card>
							</motion.div>
						))
					)}
				</motion.div>
			</AnimatePresence>
		</div>
	);
}

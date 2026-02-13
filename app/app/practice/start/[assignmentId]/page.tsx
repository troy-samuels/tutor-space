import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { StudentPortalLayout } from "@/components/student-auth/StudentPortalLayout";
import { PracticeSessionClient } from "@/app/student/practice/[assignmentId]/PracticeSessionClient";
import type { PracticeUsage } from "@/lib/actions/progress";
import {
	AI_PRACTICE_BASE_PRICE_CENTS,
	BASE_AUDIO_SECONDS,
	BASE_TEXT_TURNS,
	BLOCK_AUDIO_SECONDS,
	BLOCK_TEXT_TURNS,
} from "@/lib/practice/constants";
import { getStudentSubscriptionSummary } from "@/lib/actions/subscriptions";
import { getTutorHasPracticeAccess } from "@/lib/practice/access";
import { getStudentAvatarUrl } from "@/lib/actions/student-avatar";

export const metadata = {
	title: "Practice Start | TutorLingua",
	description: "Launch practice from your assignments flow.",
};

interface PageProps {
	params: Promise<{ assignmentId: string }>;
	searchParams: Promise<{
		source?: string | string[];
		homeworkId?: string | string[];
	}>;
}

type PracticeScenario = {
	id: string;
	title: string;
	language: string;
	level: string | null;
	topic: string | null;
	system_prompt: string;
	vocabulary_focus: string[] | null;
	grammar_focus: string[] | null;
	max_messages: number | null;
};

type PracticeAssignment = {
	id: string;
	tutor_id: string;
	title: string;
	status: "assigned" | "in_progress" | "completed";
	scenario: PracticeScenario | PracticeScenario[] | null;
};

type PracticeMessage = {
	id: string;
	role: "user" | "assistant" | "system";
	content: string;
	corrections: Array<{
		original: string;
		corrected: string;
		explanation: string;
	}> | null;
	vocabulary_used: string[] | null;
	created_at: string;
};

function getSingleSearchParam(value: string | string[] | undefined): string | null {
	if (typeof value === "string") {
		return value;
	}

	if (Array.isArray(value) && value.length > 0) {
		return value[0] ?? null;
	}

	return null;
}

function getScenarioValue(
	value: PracticeScenario | PracticeScenario[] | null
): PracticeScenario | null {
	if (!value) {
		return null;
	}

	if (Array.isArray(value)) {
		return value[0] ?? null;
	}

	return value;
}

export default async function PracticeStartPage({ params, searchParams }: PageProps) {
	const { assignmentId } = await params;
	const search = await searchParams;
	const source = getSingleSearchParam(search.source);
	const homeworkId = getSingleSearchParam(search.homeworkId);
	const launchedFromHomework = source === "homework" || Boolean(homeworkId);

	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		redirect(`/student/login?redirect=/practice/start/${assignmentId}`);
	}

	const adminClient = createServiceRoleClient();
	if (!adminClient) {
		notFound();
	}

	const { data: student } = await adminClient
		.from("students")
		.select("*")
		.eq("user_id", user.id)
		.limit(1)
		.maybeSingle();

	if (!student) {
		redirect("/student/progress");
	}

	const studentName =
		student.full_name || (user.user_metadata?.full_name as string | undefined) || null;

	const hasPracticeEnabledColumn = Object.prototype.hasOwnProperty.call(
		student,
		"ai_practice_enabled"
	);
	const hasFreeTierColumn = Object.prototype.hasOwnProperty.call(
		student,
		"ai_practice_free_tier_enabled"
	);
	const isPaidActive =
		student.ai_practice_enabled === true &&
		(!student.ai_practice_current_period_end ||
			new Date(student.ai_practice_current_period_end) > new Date());
	const isFreeActive = student.ai_practice_free_tier_enabled === true;
	let isSubscribed = isPaidActive || isFreeActive;

	if (!hasPracticeEnabledColumn && !hasFreeTierColumn) {
		const tutorHasPracticeAccess = student.tutor_id
			? await getTutorHasPracticeAccess(adminClient, student.tutor_id)
			: false;
		if (tutorHasPracticeAccess) {
			isSubscribed = true;
		}
	}

	if (!isSubscribed) {
		redirect(`/student/practice/subscribe?student=${student.id}`);
	}

	const { data: assignmentRaw } = await adminClient
		.from("practice_assignments")
		.select(
			`
      id,
      tutor_id,
      title,
      status,
      scenario:practice_scenarios (
        id,
        title,
        language,
        level,
        topic,
        system_prompt,
        vocabulary_focus,
        grammar_focus,
        max_messages
      )
    `
		)
		.eq("id", assignmentId)
		.eq("student_id", student.id)
		.single();

	if (!assignmentRaw) {
		notFound();
	}

	const assignment = assignmentRaw as PracticeAssignment;

	const { data: session } = await adminClient
		.from("student_practice_sessions")
		.select("id, mode, message_count, started_at, ended_at")
		.eq("assignment_id", assignmentId)
		.is("ended_at", null)
		.order("started_at", { ascending: false })
		.limit(1)
		.maybeSingle();

	let messages: PracticeMessage[] = [];
	if (session) {
		const { data: existingMessages } = await adminClient
			.from("student_practice_messages")
			.select("id, role, content, corrections, vocabulary_used, created_at")
			.eq("session_id", session.id)
			.order("created_at", { ascending: true });

		messages = (existingMessages ?? []) as PracticeMessage[];
	}

	let initialUsage: PracticeUsage | null = null;
	if (student.ai_practice_subscription_id) {
		const { data: usagePeriod } = await adminClient
			.from("practice_usage_periods")
			.select("*")
			.eq("student_id", student.id)
			.eq("subscription_id", student.ai_practice_subscription_id)
			.gte("period_end", new Date().toISOString())
			.lte("period_start", new Date().toISOString())
			.maybeSingle();

		if (usagePeriod) {
			const audioAllowance =
				BASE_AUDIO_SECONDS + usagePeriod.blocks_consumed * BLOCK_AUDIO_SECONDS;
			const textAllowance = BASE_TEXT_TURNS + usagePeriod.blocks_consumed * BLOCK_TEXT_TURNS;

			initialUsage = {
				audioSecondsUsed: usagePeriod.audio_seconds_used,
				audioSecondsAllowance: audioAllowance,
				textTurnsUsed: usagePeriod.text_turns_used,
				textTurnsAllowance: textAllowance,
				blocksConsumed: usagePeriod.blocks_consumed,
				currentTierPriceCents: usagePeriod.current_tier_price_cents,
				periodEnd: usagePeriod.period_end,
				percentAudioUsed: Math.round(
					(usagePeriod.audio_seconds_used / audioAllowance) * 100
				),
				percentTextUsed: Math.round(
					(usagePeriod.text_turns_used / textAllowance) * 100
				),
			};
		} else {
			initialUsage = {
				audioSecondsUsed: 0,
				audioSecondsAllowance: BASE_AUDIO_SECONDS,
				textTurnsUsed: 0,
				textTurnsAllowance: BASE_TEXT_TURNS,
				blocksConsumed: 0,
				currentTierPriceCents: AI_PRACTICE_BASE_PRICE_CENTS,
				periodEnd: student.ai_practice_current_period_end,
				percentAudioUsed: 0,
				percentTextUsed: 0,
			};
		}
	}

	const scenario = getScenarioValue(assignment.scenario);

	let tutorName: string | null = null;
	if (launchedFromHomework && assignment.tutor_id) {
		const { data: tutorProfile } = await adminClient
			.from("profiles")
			.select("full_name")
			.eq("id", assignment.tutor_id)
			.maybeSingle();

		tutorName = tutorProfile?.full_name ?? null;
	}

	const [{ data: subscriptionSummary }, avatarUrl] = await Promise.all([
		getStudentSubscriptionSummary(),
		getStudentAvatarUrl(),
	]);

	return (
		<StudentPortalLayout
			studentName={studentName}
			avatarUrl={avatarUrl}
			hideNav
			subscriptionSummary={subscriptionSummary}
		>
			<div className="flex h-[calc(100vh-64px)] flex-col">
				{launchedFromHomework ? (
					<div className="mx-4 mt-4 rounded-xl border border-[#E8784D]/35 bg-[#1A1917] px-4 py-3 text-sm text-[#F5ECE3]">
						<p className="font-medium text-[#E8784D]">
							From your tutor: {tutorName || "Your tutor"}
						</p>
					</div>
				) : null}

				<div className={`min-h-0 flex-1 ${launchedFromHomework ? "pt-2" : ""}`}>
					<PracticeSessionClient
						sessionId={session?.id || null}
						sessionMode={(session?.mode as "text" | "audio" | null) || null}
						assignmentId={assignment.id}
						assignmentTitle={assignment.title}
						language={scenario?.language || "English"}
						level={scenario?.level || null}
						topic={scenario?.topic || null}
						systemPrompt={scenario?.system_prompt}
						maxMessages={scenario?.max_messages || 20}
						initialUsage={initialUsage}
						initialMessages={messages.map((message) => ({
							id: message.id,
							role: message.role,
							content: message.content,
							corrections: message.corrections || undefined,
							vocabulary_used: message.vocabulary_used || undefined,
							created_at: message.created_at,
						}))}
					/>
				</div>
			</div>
		</StudentPortalLayout>
	);
}

import type { SupabaseClient } from "@supabase/supabase-js";

type PracticeAssignmentStatus = "assigned" | "in_progress" | "completed";

export interface PracticeAssignmentLink {
	id: string;
	status: PracticeAssignmentStatus;
	sessionsCompleted: number;
	homeworkAssignmentId: string | null;
}

export interface HomeworkPracticeLinkInput {
	homeworkId: string;
	tutorId: string;
	studentId: string;
	title: string;
	topic: string | null;
	dueDate: string | null;
	practiceAssignmentId?: string | null;
}

function normalizePracticeStatus(value: unknown): PracticeAssignmentStatus {
	if (value === "completed") return "completed";
	if (value === "in_progress") return "in_progress";
	return "assigned";
}

function normalizeSessionsCompleted(value: unknown): number {
	return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function mapPracticeAssignmentRow(row: {
	id: string;
	status: unknown;
	sessions_completed: unknown;
	homework_assignment_id: string | null;
}): PracticeAssignmentLink {
	return {
		id: row.id,
		status: normalizePracticeStatus(row.status),
		sessionsCompleted: normalizeSessionsCompleted(row.sessions_completed),
		homeworkAssignmentId: row.homework_assignment_id,
	};
}

async function getPracticeAssignmentById(
	client: SupabaseClient,
	assignmentId: string
): Promise<PracticeAssignmentLink | null> {
	const { data, error } = await client
		.from("practice_assignments")
		.select("id, status, sessions_completed, homework_assignment_id")
		.eq("id", assignmentId)
		.maybeSingle();

	if (error) {
		throw error;
	}

	if (!data) {
		return null;
	}

	return mapPracticeAssignmentRow(data);
}

async function getPracticeAssignmentByHomeworkId(
	client: SupabaseClient,
	homeworkId: string
): Promise<PracticeAssignmentLink | null> {
	const { data, error } = await client
		.from("practice_assignments")
		.select("id, status, sessions_completed, homework_assignment_id")
		.eq("homework_assignment_id", homeworkId)
		.order("created_at", { ascending: false })
		.limit(1)
		.maybeSingle();

	if (error) {
		throw error;
	}

	if (!data) {
		return null;
	}

	return mapPracticeAssignmentRow(data);
}

export async function resolveHomeworkPracticeAssignment(
	client: SupabaseClient,
	params: {
		homeworkId: string;
		practiceAssignmentId?: string | null;
	}
): Promise<PracticeAssignmentLink | null> {
	if (params.practiceAssignmentId) {
		const directMatch = await getPracticeAssignmentById(client, params.practiceAssignmentId);
		if (directMatch) {
			return directMatch;
		}
	}

	return getPracticeAssignmentByHomeworkId(client, params.homeworkId);
}

export async function ensureHomeworkPracticeAssignment(
	client: SupabaseClient,
	input: HomeworkPracticeLinkInput
): Promise<PracticeAssignmentLink | null> {
	const existingPractice = await resolveHomeworkPracticeAssignment(client, {
		homeworkId: input.homeworkId,
		practiceAssignmentId: input.practiceAssignmentId ?? null,
	});

	if (existingPractice) {
		if (input.practiceAssignmentId !== existingPractice.id) {
			const { error: linkError } = await client
				.from("homework_assignments")
				.update({ practice_assignment_id: existingPractice.id })
				.eq("id", input.homeworkId);

			if (linkError) {
				throw linkError;
			}
		}

		return existingPractice;
	}

	const topic = input.topic?.trim();
	if (!topic) {
		return null;
	}

	const practiceTitle =
		input.title.trim().length > 0
			? `Practice: ${input.title.trim()}`
			: `Practice: ${topic}`;

	const practiceInstructions = `Reinforce your ${topic} homework with a focused AI practice session.`;

	const { data: createdPractice, error: createError } = await client
		.from("practice_assignments")
		.insert({
			tutor_id: input.tutorId,
			student_id: input.studentId,
			scenario_id: null,
			homework_assignment_id: input.homeworkId,
			title: practiceTitle,
			instructions: practiceInstructions,
			due_date: input.dueDate,
			status: "assigned",
		})
		.select("id, status, sessions_completed, homework_assignment_id")
		.single();

	if (createError) {
		throw createError;
	}

	const practice = mapPracticeAssignmentRow(createdPractice);

	const { error: updateHomeworkError } = await client
		.from("homework_assignments")
		.update({ practice_assignment_id: practice.id })
		.eq("id", input.homeworkId);

	if (updateHomeworkError) {
		throw updateHomeworkError;
	}

	return practice;
}

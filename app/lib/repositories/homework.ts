import type { SupabaseClient } from "@supabase/supabase-js";

// ============================================================================
// Types
// ============================================================================

export type HomeworkStatus =
	| "draft"
	| "assigned"
	| "in_progress"
	| "submitted"
	| "completed"
	| "cancelled";

export interface HomeworkAttachment {
	label: string;
	url: string;
	type?: "pdf" | "image" | "link" | "video" | "file";
}

export interface PracticeAssignmentRef {
	id: string;
	status: "assigned" | "in_progress" | "completed";
	sessions_completed: number;
}

export interface HomeworkDrill {
	id: string;
	drill_type: "pronunciation" | "grammar" | "vocabulary" | "fluency";
	content: {
		type: string;
		prompt?: string;
	} | null;
	is_completed: boolean;
}

export interface HomeworkAssignment {
	id: string;
	tutor_id: string;
	student_id: string;
	booking_id: string | null;
	title: string;
	instructions: string | null;
	status: HomeworkStatus;
	due_date: string | null;
	attachments: HomeworkAttachment[];
	audio_instruction_url: string | null;
	student_notes: string | null;
	tutor_notes: string | null;
	completed_at: string | null;
	submitted_at: string | null;
	created_at: string;
	updated_at: string;
	deleted_at: string | null;
	// Integration fields
	topic: string | null;
	practice_assignment_id: string | null;
	practice_assignment?: PracticeAssignmentRef | null;
	drills?: HomeworkDrill[];
	// Auto-generated homework tracking
	source?: "manual" | "auto_lesson_analysis" | "auto_ai_practice";
	recording_id?: string | null;
	tutor_reviewed?: boolean;
	tutor_reviewed_at?: string | null;
	// Submission summary (populated by joins in some queries)
	latest_submission?: HomeworkSubmissionSummary | null;
}

export interface CreateHomeworkInput {
	readonly studentId: string;
	readonly tutorId: string;
	readonly title: string;
	readonly instructions?: string | null;
	readonly dueDate?: string | null;
	readonly bookingId?: string | null;
	readonly attachments?: HomeworkAttachment[];
	readonly audioInstructionUrl?: string | null;
	readonly status?: HomeworkStatus;
}

export interface UpdateHomeworkStatusInput {
	readonly status: HomeworkStatus;
	readonly studentNotes?: string | null;
}

export type SubmissionReviewStatus = "pending" | "reviewed" | "needs_revision";

export interface SubmissionFile {
	name: string;
	url: string;
	type: string;
	size: number;
}

export interface HomeworkSubmission {
	id: string;
	homework_id: string;
	student_id: string;
	text_response: string | null;
	audio_url: string | null;
	file_attachments: SubmissionFile[];
	submitted_at: string;
	tutor_feedback: string | null;
	reviewed_at: string | null;
	review_status: SubmissionReviewStatus;
	created_at: string;
	updated_at: string;
	deleted_at: string | null;
}

export interface CreateSubmissionInput {
	readonly homeworkId: string;
	readonly studentId: string;
	readonly textResponse?: string | null;
	readonly audioUrl?: string | null;
	readonly fileAttachments?: SubmissionFile[];
}

export interface UpdateSubmissionReviewInput {
	readonly feedback: string;
	readonly status: "reviewed" | "needs_revision";
}


export interface HomeworkSubmissionSummary {
	id: string;
	homework_id: string;
	tutor_feedback: string | null;
	review_status: SubmissionReviewStatus;
	reviewed_at: string | null;
	submitted_at: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Normalize attachments array (filter invalid entries).
 */
export function normalizeAttachments(
	attachments?: HomeworkAttachment[] | null
): HomeworkAttachment[] {
	if (!attachments || !Array.isArray(attachments)) return [];
	return attachments
		.filter((att) => att && typeof att === "object")
		.map((att) => ({
			label: att.label || "Resource",
			url: att.url,
			type: att.type ?? "link",
		}))
		.filter((att) => !!att.url);
}

// ============================================================================
// Homework Assignments
// ============================================================================

/**
 * Create a homework assignment.
 */
export async function createHomeworkAssignment(
	client: SupabaseClient,
	input: CreateHomeworkInput
): Promise<HomeworkAssignment> {
	const payload = {
		student_id: input.studentId,
		tutor_id: input.tutorId,
		booking_id: input.bookingId ?? null,
		title: input.title.trim(),
		instructions: input.instructions ?? null,
		due_date: input.dueDate ?? null,
		status: input.status ?? "assigned",
		attachments: normalizeAttachments(input.attachments),
		audio_instruction_url: input.audioInstructionUrl ?? null,
	};

	const { data, error } = await client
		.from("homework_assignments")
		.insert(payload)
		.select("*")
		.single();

	if (error) {
		throw error;
	}

	return {
		...data,
		attachments: normalizeAttachments(data.attachments),
	} as HomeworkAssignment;
}

/**
 * Update homework assignment status.
 */
export async function updateHomeworkAssignment(
	client: SupabaseClient,
	assignmentId: string,
	tutorId: string,
	input: UpdateHomeworkStatusInput
): Promise<HomeworkAssignment> {
	const updates: Record<string, unknown> = {
		status: input.status,
		student_notes: input.studentNotes ?? null,
		updated_at: new Date().toISOString(),
	};

	if (input.status === "completed") {
		updates.completed_at = new Date().toISOString();
	}

	const { data, error } = await client
		.from("homework_assignments")
		.update(updates)
		.eq("id", assignmentId)
		.eq("tutor_id", tutorId)
		.select("*")
		.single();

	if (error) {
		throw error;
	}

	return {
		...data,
		attachments: normalizeAttachments(data.attachments),
	} as HomeworkAssignment;
}

/**
 * Get a homework assignment by ID.
 */
export async function getHomeworkById(
	client: SupabaseClient,
	assignmentId: string
): Promise<HomeworkAssignment | null> {
	const { data, error } = await client
		.from("homework_assignments")
		.select("*")
		.eq("id", assignmentId)
		.is("deleted_at", null)
		.maybeSingle();

	if (error) {
		throw error;
	}

	if (!data) return null;

	return {
		...data,
		attachments: normalizeAttachments(data.attachments),
	} as HomeworkAssignment;
}

/**
 * Get minimal homework assignment fields for submission validation.
 */
export async function getHomeworkAssignmentForSubmission(
	client: SupabaseClient,
	assignmentId: string
): Promise<Pick<HomeworkAssignment, "id" | "student_id" | "status" | "tutor_id" | "title"> | null> {
	const { data, error } = await client
		.from("homework_assignments")
		.select("id, student_id, status, tutor_id, title")
		.eq("id", assignmentId)
		.is("deleted_at", null)
		.maybeSingle();

	if (error) {
		throw error;
	}

	return (data ?? null) as Pick<
		HomeworkAssignment,
		"id" | "student_id" | "status" | "tutor_id" | "title"
	> | null;
}

/**
 * Update notification_sent_at for a homework assignment.
 */
export async function setHomeworkNotificationSent(
	client: SupabaseClient,
	assignmentId: string
): Promise<void> {
	const { error } = await client
		.from("homework_assignments")
		.update({ notification_sent_at: new Date().toISOString() })
		.eq("id", assignmentId)
		.is("deleted_at", null);

	if (error) {
		throw error;
	}
}

/**
 * Get homework assignments for a student (with optional practice assignment join).
 */
export async function getHomeworkForStudent(
	client: SupabaseClient,
	studentId: string,
	tutorId: string,
	options?: { includeDraft?: boolean; limit?: number }
): Promise<HomeworkAssignment[]> {
	let query = client
		.from("homework_assignments")
		.select(
			`
			*,
			practice_assignment:practice_assignments!homework_assignments_practice_assignment_id_fkey (
				id,
				status,
				sessions_completed
			)
		`
		)
		.eq("student_id", studentId)
		.eq("tutor_id", tutorId)
		.is("deleted_at", null);

	if (!options?.includeDraft) {
		query = query.neq("status", "draft");
	}

	query = query
		.order("due_date", { ascending: true, nullsFirst: false })
		.order("created_at", { ascending: false });

	if (options?.limit) {
		query = query.limit(options.limit);
	}

	const { data, error } = await query;

	if (error) {
		// Fallback without join if practice_assignments table doesn't exist
		const fallbackQuery = client
			.from("homework_assignments")
			.select("*")
			.eq("student_id", studentId)
			.eq("tutor_id", tutorId)
			.is("deleted_at", null)
			.order("due_date", { ascending: true, nullsFirst: false })
			.order("created_at", { ascending: false });

		if (options?.limit) {
			fallbackQuery.limit(options.limit);
		}

		const fallback = await fallbackQuery;
		if (fallback.error) throw fallback.error;

		return (fallback.data ?? []).map((assignment) => ({
			...assignment,
			attachments: normalizeAttachments(assignment.attachments),
			practice_assignment: null,
		})) as HomeworkAssignment[];
	}

	return (data ?? []).map((assignment: Record<string, unknown>) => {
		const practiceRaw = assignment.practice_assignment;
		const practiceAssignment = Array.isArray(practiceRaw)
			? practiceRaw[0] || null
			: practiceRaw || null;

		return {
			...assignment,
			attachments: normalizeAttachments(
				assignment.attachments as HomeworkAttachment[]
			),
			practice_assignment: practiceAssignment,
		};
	}) as HomeworkAssignment[];
}

/**
 * Get homework assignments for a student with drills (tutor view).
 */
export async function getHomeworkForStudentWithDrills(
	client: SupabaseClient,
	studentId: string,
	tutorId: string,
	limit: number = 25
): Promise<HomeworkAssignment[]> {
	const { data, error } = await client
		.from("homework_assignments")
		.select(
			`
			*,
			practice_assignment:practice_assignments!homework_assignments_practice_assignment_id_fkey (
				id,
				status,
				sessions_completed
			),
			drills:lesson_drills!lesson_drills_homework_assignment_id_fkey (
				id,
				drill_type,
				content,
				is_completed
			)
		`
		)
		.eq("student_id", studentId)
		.eq("tutor_id", tutorId)
		.is("deleted_at", null)
		.order("due_date", { ascending: true, nullsFirst: false })
		.order("created_at", { ascending: false })
		.limit(limit);

	if (error) {
		// Fallback without joins
		return getHomeworkForStudent(client, studentId, tutorId, { limit });
	}

	return (data ?? []).map((assignment: Record<string, unknown>) => {
		const practiceRaw = assignment.practice_assignment;
		const practiceAssignment = Array.isArray(practiceRaw)
			? practiceRaw[0] || null
			: practiceRaw || null;

		const drillsRaw = assignment.drills;
		const drills = Array.isArray(drillsRaw) ? drillsRaw : [];

		return {
			...assignment,
			attachments: normalizeAttachments(
				assignment.attachments as HomeworkAttachment[]
			),
			practice_assignment: practiceAssignment,
			drills,
		};
	}) as HomeworkAssignment[];
}

/**
 * Get pending homework for practice linking (homework without practice assignment).
 */
export async function getPendingHomeworkForPractice(
	client: SupabaseClient,
	studentId: string,
	tutorId: string,
	limit: number = 20
): Promise<
	Array<{
		id: string;
		title: string;
		topic: string | null;
		due_date: string | null;
		status: HomeworkStatus;
		practice_assignment_id: string | null;
	}>
> {
	const { data, error } = await client
		.from("homework_assignments")
		.select("id, title, topic, due_date, status, practice_assignment_id")
		.eq("student_id", studentId)
		.eq("tutor_id", tutorId)
		.is("deleted_at", null)
		.in("status", ["assigned", "in_progress"])
		.is("practice_assignment_id", null)
		.order("due_date", { ascending: true, nullsFirst: false })
		.order("created_at", { ascending: false })
		.limit(limit);

	if (error) {
		throw error;
	}

	return (data ?? []) as Array<{
		id: string;
		title: string;
		topic: string | null;
		due_date: string | null;
		status: HomeworkStatus;
		practice_assignment_id: string | null;
	}>;
}

/**
 * Mark homework as completed (student action).
 */
export async function markHomeworkCompleted(
	client: SupabaseClient,
	assignmentId: string,
	studentNotes?: string | null
): Promise<HomeworkAssignment> {
	const { data, error } = await client
		.from("homework_assignments")
		.update({
			status: "completed",
			student_notes: studentNotes ?? null,
			completed_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		})
		.eq("id", assignmentId)
		.select("*")
		.single();

	if (error) {
		throw error;
	}

	return {
		...data,
		attachments: normalizeAttachments(data.attachments),
	} as HomeworkAssignment;
}

/**
 * Mark homework completed after tutor review without altering student notes.
 */
export async function markHomeworkCompletedFromReview(
	client: SupabaseClient,
	assignmentId: string
): Promise<void> {
	const { error } = await client
		.from("homework_assignments")
		.update({
			status: "completed",
			completed_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		})
		.eq("id", assignmentId)
		.is("deleted_at", null);

	if (error) {
		throw error;
	}
}

// ============================================================================
// Homework Submissions
// ============================================================================

/**
 * Create a homework submission.
 */
export async function createHomeworkSubmission(
	client: SupabaseClient,
	input: CreateSubmissionInput
): Promise<HomeworkSubmission> {
	const payload = {
		homework_id: input.homeworkId,
		student_id: input.studentId,
		text_response: input.textResponse ?? null,
		audio_url: input.audioUrl ?? null,
		file_attachments: input.fileAttachments ?? [],
	};

	const { data, error } = await client
		.from("homework_submissions")
		.insert(payload)
		.select("*")
		.single();

	if (error) {
		throw error;
	}

	return data as HomeworkSubmission;
}

/**
 * Get submissions for a homework assignment.
 */
export async function getSubmissionsForHomework(
	client: SupabaseClient,
	homeworkId: string
): Promise<HomeworkSubmission[]> {
	const { data, error } = await client
		.from("homework_submissions")
		.select("*")
		.eq("homework_id", homeworkId)
		.is("deleted_at", null)
		.order("submitted_at", { ascending: false });

	if (error) {
		throw error;
	}

	return (data ?? []) as HomeworkSubmission[];
}

/**
 * Get a submission by ID.
 */
export async function getSubmissionById(
	client: SupabaseClient,
	submissionId: string
): Promise<HomeworkSubmission | null> {
	const { data, error } = await client
		.from("homework_submissions")
		.select("*")
		.eq("id", submissionId)
		.is("deleted_at", null)
		.maybeSingle();

	if (error) {
		throw error;
	}

	return data as HomeworkSubmission | null;
}

/**
 * Get the latest submission for each homework in a list.
 */
export async function getLatestSubmissionsForHomework(
	client: SupabaseClient,
	homeworkIds: string[],
	studentId: string
): Promise<Record<string, HomeworkSubmissionSummary>> {
	if (homeworkIds.length === 0) return {};

	const { data, error } = await client
		.from("homework_submissions")
		.select("id, homework_id, tutor_feedback, review_status, reviewed_at, submitted_at")
		.eq("student_id", studentId)
		.in("homework_id", homeworkIds)
		.is("deleted_at", null)
		.order("submitted_at", { ascending: false });

	if (error) {
		throw error;
	}

	const result: Record<string, HomeworkSubmissionSummary> = {};
	(data ?? []).forEach((submission) => {
		if (!result[submission.homework_id]) {
			result[submission.homework_id] = submission as HomeworkSubmissionSummary;
		}
	});

	return result;
}

/**
 * Update submission review (tutor feedback).
 */
export async function updateSubmissionReview(
	client: SupabaseClient,
	submissionId: string,
	input: UpdateSubmissionReviewInput
): Promise<void> {
	const { error } = await client
		.from("homework_submissions")
		.update({
			tutor_feedback: input.feedback,
			review_status: input.status,
			reviewed_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		})
		.eq("id", submissionId);

	if (error) {
		throw error;
	}
}

/**
 * Get submission with homework assignment details (for ownership verification).
 */
export async function getSubmissionWithHomework(
	client: SupabaseClient,
	submissionId: string
): Promise<{
	submission: HomeworkSubmission;
	homework: { id: string; tutor_id: string; student_id: string };
} | null> {
	const { data, error } = await client
		.from("homework_submissions")
		.select(
			`
			*,
			homework_assignments!inner (
				id,
				tutor_id,
				student_id
			)
		`
		)
		.eq("id", submissionId)
		.is("deleted_at", null)
		.is("homework_assignments.deleted_at", null)
		.maybeSingle();

	if (error || !data) {
		return null;
	}

	const homeworkRaw = data.homework_assignments as unknown as {
		id: string;
		tutor_id: string;
		student_id: string;
	};

	return {
		submission: data as HomeworkSubmission,
		homework: homeworkRaw,
	};
}

import type { SupabaseClient } from "@supabase/supabase-js";

// ============================================================================
// Types
// ============================================================================

export interface LearningGoal {
	id: string;
	student_id: string;
	tutor_id: string;
	title: string;
	description: string | null;
	target_date: string | null;
	status: "active" | "completed" | "paused" | "abandoned";
	progress_percentage: number;
	completed_at: string | null;
	created_at: string;
	updated_at: string;
	deleted_at: string | null;
}

export interface CreateLearningGoalInput {
	readonly studentId: string;
	readonly tutorId: string;
	readonly title: string;
	readonly description?: string | null;
	readonly targetDate?: string | null;
	readonly progressPercentage?: number;
	readonly status?: LearningGoal["status"];
}

export interface UpdateLearningGoalInput {
	readonly progressPercentage: number;
	readonly status?: LearningGoal["status"];
}

export type SkillArea =
	| "speaking"
	| "listening"
	| "reading"
	| "writing"
	| "vocabulary"
	| "grammar"
	| "pronunciation"
	| "overall";

export type ProficiencyLevel =
	| "beginner"
	| "elementary"
	| "intermediate"
	| "upper_intermediate"
	| "advanced"
	| "proficient";

export interface ProficiencyAssessment {
	id: string;
	student_id: string;
	tutor_id: string;
	skill_area: SkillArea;
	level: ProficiencyLevel;
	score: number | null;
	notes: string | null;
	assessed_at: string;
}

export interface CreateProficiencyAssessmentInput {
	readonly studentId: string;
	readonly tutorId: string;
	readonly skillArea: SkillArea;
	readonly level: ProficiencyLevel;
	readonly score?: number | null;
	readonly notes?: string | null;
	readonly assessedAt?: string;
}

export interface LearningStats {
	id: string;
	student_id: string;
	tutor_id: string;
	total_lessons: number;
	lessons_completed?: number;
	lessons_cancelled?: number;
	total_minutes: number;
	lessons_this_month: number;
	minutes_this_month: number;
	current_streak: number;
	longest_streak: number;
	last_lesson_at: string | null;
	messages_sent: number;
	homework_completed: number;
	practice_sessions_completed?: number;
	practice_minutes?: number;
	practice_messages_sent?: number;
}

export interface StudentProfile {
	id: string;
	tutor_id: string;
	user_id: string | null;
	first_name: string | null;
	last_name: string | null;
	email: string | null;
	ai_practice_enabled?: boolean;
	ai_practice_current_period_end?: string | null;
	ai_practice_free_tier_enabled?: boolean;
	ai_practice_subscription_id?: string | null;
}

export interface TutorProfile {
	full_name: string | null;
	email: string | null;
}

export interface LessonNote {
	id: string;
	booking_id: string;
	student_id: string;
	tutor_id: string;
	topics_covered: string[] | null;
	vocabulary_words: string[] | null;
	homework: string | null;
	notes: string | null;
	student_performance: string | null;
	areas_to_focus: string[] | null;
	created_at: string;
}

// ============================================================================
// Learning Goals
// ============================================================================

/**
 * Create a learning goal for a student.
 */
export async function createLearningGoal(
	client: SupabaseClient,
	input: CreateLearningGoalInput
): Promise<LearningGoal> {
	const payload = {
		student_id: input.studentId,
		tutor_id: input.tutorId,
		title: input.title.trim(),
		description: input.description ?? null,
		target_date: input.targetDate ?? null,
		progress_percentage: Math.min(Math.max(input.progressPercentage ?? 0, 0), 100),
		status: input.status ?? "active",
	};

	const { data, error } = await client
		.from("learning_goals")
		.insert(payload)
		.select("*")
		.single();

	if (error) {
		throw error;
	}

	return data as LearningGoal;
}

/**
 * Update learning goal progress and optionally status.
 */
export async function updateLearningGoalProgress(
	client: SupabaseClient,
	goalId: string,
	tutorId: string,
	input: UpdateLearningGoalInput
): Promise<LearningGoal> {
	const updates: Record<string, unknown> = {
		progress_percentage: Math.min(Math.max(input.progressPercentage, 0), 100),
		updated_at: new Date().toISOString(),
	};

	if (input.status) {
		updates.status = input.status;
		if (input.status === "completed") {
			updates.completed_at = new Date().toISOString();
		}
	}

	const { data, error } = await client
		.from("learning_goals")
		.update(updates)
		.eq("id", goalId)
		.eq("tutor_id", tutorId)
		.select("*")
		.single();

	if (error) {
		throw error;
	}

	return data as LearningGoal;
}

/**
 * Get a learning goal by ID.
 */
export async function getLearningGoalById(
	client: SupabaseClient,
	goalId: string,
	tutorId: string
): Promise<LearningGoal | null> {
	const { data, error } = await client
		.from("learning_goals")
		.select("*")
		.eq("id", goalId)
		.eq("tutor_id", tutorId)
		.maybeSingle();

	if (error) {
		throw error;
	}

	return data as LearningGoal | null;
}

/**
 * Get all learning goals for a student.
 */
export async function getGoalsForStudent(
	client: SupabaseClient,
	studentId: string,
	tutorId: string
): Promise<LearningGoal[]> {
	const { data, error } = await client
		.from("learning_goals")
		.select("*")
		.eq("student_id", studentId)
		.eq("tutor_id", tutorId)
		.order("created_at", { ascending: false });

	if (error) {
		throw error;
	}

	return (data ?? []) as LearningGoal[];
}

// ============================================================================
// Proficiency Assessments
// ============================================================================

/**
 * Create a proficiency assessment record.
 */
export async function createProficiencyAssessment(
	client: SupabaseClient,
	input: CreateProficiencyAssessmentInput
): Promise<ProficiencyAssessment> {
	const payload = {
		student_id: input.studentId,
		tutor_id: input.tutorId,
		skill_area: input.skillArea,
		level: input.level,
		score: input.score ?? null,
		notes: input.notes ?? null,
		assessed_at: input.assessedAt ?? new Date().toISOString(),
	};

	const { data, error } = await client
		.from("proficiency_assessments")
		.insert(payload)
		.select("*")
		.single();

	if (error) {
		throw error;
	}

	return data as ProficiencyAssessment;
}

/**
 * Get the most recent assessment for each skill area for a student.
 */
export async function getLatestAssessmentsForStudent(
	client: SupabaseClient,
	studentId: string,
	tutorId: string
): Promise<ProficiencyAssessment[]> {
	const { data, error } = await client
		.from("proficiency_assessments")
		.select("*")
		.eq("student_id", studentId)
		.eq("tutor_id", tutorId)
		.order("assessed_at", { ascending: false })
		.limit(20);

	if (error) {
		throw error;
	}

	// Deduplicate to get only the latest per skill area
	const latestBySkillRecord = (data ?? []).reduce(
		(acc, assessment) => {
			if (
				!acc[assessment.skill_area] ||
				new Date(assessment.assessed_at) > new Date(acc[assessment.skill_area].assessed_at)
			) {
				acc[assessment.skill_area] = assessment as ProficiencyAssessment;
			}
			return acc;
		},
		{} as Record<string, ProficiencyAssessment>
	);

	return Object.values(latestBySkillRecord) as ProficiencyAssessment[];
}

/**
 * Get the previous assessment for a specific skill area (for audit before/after).
 */
export async function getPreviousAssessment(
	client: SupabaseClient,
	studentId: string,
	tutorId: string,
	skillArea: SkillArea
): Promise<ProficiencyAssessment | null> {
	const { data, error } = await client
		.from("proficiency_assessments")
		.select("*")
		.eq("student_id", studentId)
		.eq("tutor_id", tutorId)
		.eq("skill_area", skillArea)
		.order("assessed_at", { ascending: false })
		.limit(1)
		.maybeSingle();

	if (error) {
		throw error;
	}

	return data as ProficiencyAssessment | null;
}

/**
 * Get all assessments for a student (no deduplication).
 */
export async function getAllAssessmentsForStudent(
	client: SupabaseClient,
	studentId: string,
	tutorId: string
): Promise<ProficiencyAssessment[]> {
	const { data, error } = await client
		.from("proficiency_assessments")
		.select("*")
		.eq("student_id", studentId)
		.eq("tutor_id", tutorId)
		.order("assessed_at", { ascending: false });

	if (error) {
		throw error;
	}

	return (data ?? []) as ProficiencyAssessment[];
}

// ============================================================================
// Learning Stats
// ============================================================================

/**
 * Get learning stats for a student-tutor pair.
 */
export async function getLearningStats(
	client: SupabaseClient,
	studentId: string,
	tutorId: string
): Promise<LearningStats | null> {
	const { data, error } = await client
		.from("learning_stats")
		.select("*")
		.eq("student_id", studentId)
		.eq("tutor_id", tutorId)
		.maybeSingle();

	if (error) {
		throw error;
	}

	return data as LearningStats | null;
}

/**
 * Update learning stats for a student-tutor pair (upsert).
 */
export async function updateLearningStats(
	client: SupabaseClient,
	studentId: string,
	tutorId: string,
	updates: Partial<Omit<LearningStats, "id" | "student_id" | "tutor_id">>
): Promise<void> {
	const { error } = await client
		.from("learning_stats")
		.upsert(
			{
				student_id: studentId,
				tutor_id: tutorId,
				...updates,
				updated_at: new Date().toISOString(),
			},
			{ onConflict: "student_id,tutor_id" }
		);

	if (error) {
		throw error;
	}
}

// ============================================================================
// Student and Profile Lookups
// ============================================================================

const STUDENT_PROFILE_SELECT =
	"id, tutor_id, user_id, full_name, email, ai_practice_enabled, ai_practice_current_period_end, ai_practice_free_tier_enabled, ai_practice_subscription_id";

export async function getStudentByUserId(
	client: SupabaseClient,
	userId: string,
	tutorId?: string
): Promise<StudentProfile | null> {
	let query = client
		.from("students")
		.select(STUDENT_PROFILE_SELECT)
		.eq("user_id", userId);

	if (tutorId) {
		query = query.eq("tutor_id", tutorId);
	}

	const { data, error } = await query.limit(1).maybeSingle();
	if (error) {
		throw error;
	}

	return data as StudentProfile | null;
}

export async function getStudentById(
	client: SupabaseClient,
	studentId: string
): Promise<StudentProfile | null> {
	const { data, error } = await client
		.from("students")
		.select(STUDENT_PROFILE_SELECT)
		.eq("id", studentId)
		.maybeSingle();

	if (error) {
		throw error;
	}

	return data as StudentProfile | null;
}

export async function getStudentByIdForTutor(
	client: SupabaseClient,
	studentId: string,
	tutorId: string
): Promise<StudentProfile | null> {
	const { data, error } = await client
		.from("students")
		.select(STUDENT_PROFILE_SELECT)
		.eq("id", studentId)
		.eq("tutor_id", tutorId)
		.maybeSingle();

	if (error) {
		throw error;
	}

	return data as StudentProfile | null;
}

export async function getStudentProgressContext(
	client: SupabaseClient,
	options: { userId: string; studentId?: string | null; tutorId?: string | null }
): Promise<{ id: string; tutor_id: string } | null> {
	let query = client.from("students").select("id, tutor_id").limit(1);

	if (options.studentId) {
		query = query.eq("id", options.studentId);
	} else {
		query = query.eq("user_id", options.userId);
	}

	if (options.tutorId) {
		query = query.eq("tutor_id", options.tutorId);
	}

	const { data, error } = await query.maybeSingle();
	if (error) {
		throw error;
	}

	return data as { id: string; tutor_id: string } | null;
}

export async function getStudentContactById(
	client: SupabaseClient,
	studentId: string
): Promise<{ user_id: string | null; full_name: string | null; email: string | null } | null> {
	const { data, error } = await client
		.from("students")
		.select("user_id, full_name, email")
		.eq("id", studentId)
		.maybeSingle();

	if (error) {
		throw error;
	}

	return data as { user_id: string | null; full_name: string | null; email: string | null } | null;
}

export async function getTutorProfileById(
	client: SupabaseClient,
	tutorId: string
): Promise<TutorProfile | null> {
	const { data, error } = await client
		.from("profiles")
		.select("full_name, email")
		.eq("id", tutorId)
		.maybeSingle();

	if (error) {
		throw error;
	}

	return data as TutorProfile | null;
}

// ============================================================================
// Lesson Notes
// ============================================================================

/**
 * Get recent lesson notes for a student.
 */
export async function getRecentLessonNotes(
	client: SupabaseClient,
	studentId: string,
	tutorId: string,
	limit: number = 10
): Promise<LessonNote[]> {
	const { data, error } = await client
		.from("lesson_notes")
		.select(
			"id, booking_id, student_id, tutor_id, topics_covered, vocabulary_words, homework, notes, student_performance, areas_to_focus, created_at"
		)
		.eq("student_id", studentId)
		.eq("tutor_id", tutorId)
		.order("created_at", { ascending: false })
		.limit(limit);

	if (error) {
		throw error;
	}

	return (data ?? []) as LessonNote[];
}

/**
 * Get all lesson notes for a student (no limit).
 */
export async function getAllLessonNotes(
	client: SupabaseClient,
	studentId: string,
	tutorId: string
): Promise<LessonNote[]> {
	const { data, error } = await client
		.from("lesson_notes")
		.select("*")
		.eq("student_id", studentId)
		.eq("tutor_id", tutorId)
		.order("created_at", { ascending: false });

	if (error) {
		throw error;
	}

	return (data ?? []) as LessonNote[];
}

// ============================================================================
// AI Practice Data
// ============================================================================

export async function listPracticeAssignmentsForStudent(
	client: SupabaseClient,
	studentId: string,
	tutorId?: string,
	limit: number = 20
): Promise<Record<string, any>[]> {
	let query = client
		.from("practice_assignments")
		.select(
			`
				id,
				title,
				instructions,
				status,
				due_date,
				sessions_completed,
				created_at,
				scenario:practice_scenarios (
					id,
					title,
					language,
					level,
					topic
				)
			`
		)
		.eq("student_id", studentId)
		.order("created_at", { ascending: false })
		.limit(limit);

	if (tutorId) {
		query = query.eq("tutor_id", tutorId);
	}

	const { data, error } = await query;

	if (error) {
		throw error;
	}

	return (data ?? []) as Record<string, any>[];
}

export async function listPracticeScenariosForTutor(
	client: SupabaseClient,
	tutorId: string
): Promise<Record<string, any>[]> {
	const { data, error } = await client
		.from("practice_scenarios")
		.select("id, title, language, level, topic")
		.eq("tutor_id", tutorId)
		.eq("is_active", true)
		.order("title", { ascending: true });

	if (error) {
		throw error;
	}

	return (data ?? []) as Record<string, any>[];
}

export async function getPracticeStatsForStudent(
	client: SupabaseClient,
	studentId: string,
	tutorId: string
): Promise<Record<string, any> | null> {
	const { data, error } = await client
		.from("learning_stats")
		.select("practice_sessions_completed, practice_minutes, practice_messages_sent")
		.eq("student_id", studentId)
		.eq("tutor_id", tutorId)
		.maybeSingle();

	if (error) {
		throw error;
	}

	return (data ?? null) as Record<string, any> | null;
}

export async function getPracticeUsagePeriod(
	client: SupabaseClient,
	studentId: string,
	subscriptionId: string,
	now: string
): Promise<Record<string, any> | null> {
	const { data, error } = await client
		.from("practice_usage_periods")
		.select("*")
		.eq("student_id", studentId)
		.eq("subscription_id", subscriptionId)
		.gte("period_end", now)
		.lte("period_start", now)
		.maybeSingle();

	if (error) {
		throw error;
	}

	return (data ?? null) as Record<string, any> | null;
}

export async function getStudentPracticeSummary(
	client: SupabaseClient,
	studentId: string,
	tutorId: string
): Promise<Record<string, any> | null> {
	const { data, error } = await client
		.from("student_practice_summaries")
		.select("*")
		.eq("student_id", studentId)
		.eq("tutor_id", tutorId)
		.maybeSingle();

	if (error) {
		throw error;
	}

	return (data ?? null) as Record<string, any> | null;
}

export async function listStudentPracticeSessions(
	client: SupabaseClient,
	studentId: string,
	tutorId: string
): Promise<Record<string, any>[]> {
	const { data, error } = await client
		.from("student_practice_sessions")
		.select(
			"id, ended_at, duration_seconds, message_count, ai_feedback, grammar_errors_count, started_at"
		)
		.eq("student_id", studentId)
		.eq("tutor_id", tutorId);

	if (error) {
		throw error;
	}

	return (data ?? []) as Record<string, any>[];
}

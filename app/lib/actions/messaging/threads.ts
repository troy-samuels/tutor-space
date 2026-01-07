"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import {
	countUnreadThreadsForTutor,
	createThread,
	getThreadByTutorStudent,
} from "@/lib/repositories/messaging";
import { recordAudit } from "@/lib/repositories/audit";
import {
	getTraceId,
	createRequestLogger,
	withActionLogging,
} from "@/lib/logger";

export async function getUnreadMessageCount(): Promise<number> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return 0;
	}

	const { count } = await countUnreadThreadsForTutor(supabase, user.id);
	return count ?? 0;
}

export async function getOrCreateThreadByStudentId(
	studentId: string
): Promise<{ threadId: string | null; error?: string }> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { threadId: null, error: "Not authenticated" };
	}

	// Set up structured logging
	const traceId = await getTraceId();
	const log = createRequestLogger(traceId, user.id);

	return withActionLogging(
		"getOrCreateThreadByStudentId",
		log,
		{ studentId },
		async () => {
			const { data: existingThread, error: existingError } = await getThreadByTutorStudent(
				supabase,
				user.id,
				studentId
			);

			if (existingThread?.id) {
				return { threadId: existingThread.id };
			}

			if (existingError && existingError.code !== "PGRST116") {
				console.error("[Messaging] Failed to check existing thread", existingError);
				return { threadId: null, error: "Failed to create conversation" };
			}

			const { data: newThread, error: createError } = await createThread(supabase, {
				tutorId: user.id,
				studentId,
			});

			if (createError || !newThread) {
				console.error("[Messaging] Failed to create thread", createError);
				return { threadId: null, error: "Failed to create conversation" };
			}

			// Record audit log for new thread creation
			const adminClient = createServiceRoleClient();
			if (adminClient) {
				await recordAudit(adminClient, {
					actorId: user.id,
					targetId: newThread.id,
					entityType: "messaging",
					actionType: "thread_created",
					metadata: {
						studentId,
						tutorId: user.id,
					},
				});
			}

			return { threadId: newThread.id };
		}
	);
}

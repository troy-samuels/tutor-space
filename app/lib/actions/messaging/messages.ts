"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/security/limiter";
import {
	getThreadByIdWithStudent,
	insertMessage,
	updateThreadPreview,
	getTutorProfileName,
} from "@/lib/repositories/messaging";
import { recordAudit } from "@/lib/repositories/audit";
import {
	getTraceId,
	createRequestLogger,
	withActionLogging,
} from "@/lib/logger";
import type { MessageAttachment, MessagingActionState } from "./types";

const sendMessageSchema = z.object({
	thread_id: z.string().uuid(),
	body: z.string().min(1, "Message cannot be empty"),
});

function rateLimitErrorMessage() {
	return "Too many messages. Please try again later.";
}

export async function sendThreadMessage(
	_prevState: MessagingActionState,
	formData: FormData
): Promise<MessagingActionState> {
	const parsed = sendMessageSchema.safeParse({
		thread_id: formData.get("thread_id"),
		body: formData.get("body"),
	});

	if (!parsed.success) {
		return { error: parsed.error.issues[0]?.message ?? "Invalid message." };
	}

	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { error: "You must be signed in to send messages." };
	}

	// Set up structured logging
	const traceId = await getTraceId();
	const log = createRequestLogger(traceId, user.id);

	return withActionLogging(
		"sendThreadMessage",
		log,
		{ threadId: parsed.data.thread_id, bodyLength: parsed.data.body.length },
		async () => {
			const rateLimitResult = await checkRateLimit(user.id, "messaging");
			if (!rateLimitResult.success) {
				return { error: rateLimitErrorMessage() };
			}

			const { data: thread, error: threadError } = await getThreadByIdWithStudent(
				supabase,
				parsed.data.thread_id
			);

			if (threadError || !thread) {
				return { error: "Conversation not found." };
			}

			const student = Array.isArray(thread.students) ? thread.students[0] : thread.students;

			let senderRole: "tutor" | "student";
			if (thread.tutor_id === user.id) {
				senderRole = "tutor";
			} else if (student?.user_id === user.id) {
				senderRole = "student";
			} else {
				return { error: "You don't have access to this conversation." };
			}

			const now = new Date().toISOString();

			const { data: insertedMessage, error: insertError } = await insertMessage(supabase, {
				threadId: thread.id,
				tutorId: thread.tutor_id,
				studentId: thread.student_id,
				senderRole,
				body: parsed.data.body,
				readByTutor: senderRole === "tutor",
				readByStudent: senderRole === "student",
			});

			if (insertError) {
				console.error("[Messaging] Failed to send message", insertError);
				return { error: "Failed to send message. Try again." };
			}

			const { error: updateError } = await updateThreadPreview(supabase, thread.id, {
				lastMessagePreview: parsed.data.body.slice(0, 160),
				lastMessageAt: now,
				tutorUnread: senderRole === "student",
				studentUnread: senderRole === "tutor",
			});

			if (updateError) {
				console.error("[Messaging] Failed to update thread preview", updateError);
			}

			// Record audit log
			const adminClient = createServiceRoleClient();
			if (adminClient) {
				await recordAudit(adminClient, {
					actorId: user.id,
					targetId: insertedMessage?.id ?? thread.id,
					entityType: "messaging",
					actionType: "message_sent",
					metadata: {
						threadId: thread.id,
						senderRole,
						hasAudio: false,
						bodyLength: parsed.data.body.length,
					},
				});
			}

			// Send in-app notification to recipient
			try {
				const { notifyNewMessage } = await import("@/lib/actions/notifications");

				if (senderRole === "tutor") {
					// Tutor sent message → notify student (if they have an account)
					if (student?.user_id) {
						const { data: tutorProfile } = await getTutorProfileName(supabase, thread.tutor_id);

						await notifyNewMessage({
							recipientId: student.user_id,
							recipientRole: "student",
							senderName: tutorProfile?.full_name || "Your tutor",
							messagePreview: parsed.data.body,
							threadId: thread.id,
						});
					}
				} else {
					// Student sent message → notify tutor
					await notifyNewMessage({
						recipientId: thread.tutor_id,
						recipientRole: "tutor",
						senderName: student?.full_name || "A student",
						messagePreview: parsed.data.body,
						threadId: thread.id,
					});
				}
			} catch (notificationError) {
				console.error("[sendThreadMessage] notification error:", notificationError);
			}

			if (senderRole === "tutor") {
				revalidatePath("/messages");
			} else {
				revalidatePath("/student/messages");
			}

			return { success: "Sent" };
		}
	);
}

export async function sendMessageWithAudio(params: {
	threadId: string;
	body?: string;
	attachments?: MessageAttachment[];
}): Promise<MessagingActionState> {
	const { threadId, body, attachments } = params;

	// Must have either text or attachments
	if (!body?.trim() && (!attachments || attachments.length === 0)) {
		return { error: "Message must have text or an audio recording" };
	}

	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { error: "You must be signed in to send messages." };
	}

	// Set up structured logging
	const traceId = await getTraceId();
	const log = createRequestLogger(traceId, user.id);

	return withActionLogging(
		"sendMessageWithAudio",
		log,
		{ threadId, bodyLength: body?.length ?? 0, attachmentCount: attachments?.length ?? 0 },
		async () => {
			const rateLimitResult = await checkRateLimit(user.id, "messaging");
			if (!rateLimitResult.success) {
				return { error: rateLimitErrorMessage() };
			}

			const { data: thread, error: threadError } = await getThreadByIdWithStudent(
				supabase,
				threadId
			);

			if (threadError || !thread) {
				return { error: "Conversation not found." };
			}

			const student = Array.isArray(thread.students) ? thread.students[0] : thread.students;

			let senderRole: "tutor" | "student";

			if (thread.tutor_id === user.id) {
				senderRole = "tutor";
			} else if (student?.user_id === user.id) {
				senderRole = "student";
			} else {
				return { error: "You don't have access to this conversation." };
			}

			const now = new Date().toISOString();
			const messageBody = body?.trim() || "";

			// Create preview text for audio messages
			const previewText = messageBody || (attachments?.length ? "🎤 Voice message" : "");

			const { data: insertedMessage, error: insertError } = await insertMessage(supabase, {
				threadId: thread.id,
				tutorId: thread.tutor_id,
				studentId: thread.student_id,
				senderRole,
				body: messageBody,
				attachments: attachments || [],
				readByTutor: senderRole === "tutor",
				readByStudent: senderRole === "student",
			});

			if (insertError) {
				console.error("[Messaging] Failed to send message", insertError);
				return { error: "Failed to send message. Try again." };
			}

			const { error: updateError } = await updateThreadPreview(supabase, thread.id, {
				lastMessagePreview: previewText.slice(0, 160),
				lastMessageAt: now,
				tutorUnread: senderRole === "student",
				studentUnread: senderRole === "tutor",
			});

			if (updateError) {
				console.error("[Messaging] Failed to update thread preview", updateError);
			}

			// Record audit log
			const adminClient = createServiceRoleClient();
			if (adminClient) {
				await recordAudit(adminClient, {
					actorId: user.id,
					targetId: insertedMessage?.id ?? thread.id,
					entityType: "messaging",
					actionType: "message_sent",
					metadata: {
						threadId: thread.id,
						senderRole,
						hasAudio: (attachments?.length ?? 0) > 0,
						bodyLength: messageBody.length,
						attachmentCount: attachments?.length ?? 0,
					},
				});
			}

			// Send in-app notification to recipient
			try {
				const { notifyNewMessage } = await import("@/lib/actions/notifications");

				if (senderRole === "tutor") {
					// Tutor sent message → notify student (if they have an account)
					if (student?.user_id) {
						const { data: tutorProfile } = await getTutorProfileName(supabase, thread.tutor_id);

						await notifyNewMessage({
							recipientId: student.user_id,
							recipientRole: "student",
							senderName: tutorProfile?.full_name || "Your tutor",
							messagePreview: previewText,
							threadId: thread.id,
						});
					}
				} else {
					// Student sent message → notify tutor
					await notifyNewMessage({
						recipientId: thread.tutor_id,
						recipientRole: "tutor",
						senderName: student?.full_name || "A student",
						messagePreview: previewText,
						threadId: thread.id,
					});
				}
			} catch (notificationError) {
				console.error("[sendMessageWithAudio] notification error:", notificationError);
			}

			if (senderRole === "tutor") {
				revalidatePath("/messages");
			} else {
				revalidatePath("/student/messages");
			}

			return { success: "Sent" };
		}
	);
}

export async function sendMessage(
	prevState: MessagingActionState,
	formData: FormData
): Promise<MessagingActionState> {
	return sendThreadMessage(prevState, formData);
}

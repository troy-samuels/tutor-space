"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIP } from "@/lib/security/limiter";
import {
	getTraceId,
	createRequestLogger,
	logStep,
	logStepError,
} from "@/lib/logger";
import type { UploadResult } from "./types";

// ============================================================================
// Upload Submission File
// ============================================================================

/**
 * Upload a submission file to Supabase Storage.
 * Returns the public URL for the file.
 *
 * Compliance:
 * - Repository Law: N/A (storage operation)
 * - Observability Law: Has traceId, logStep, logStepError
 * - Safety Law: N/A (upload is idempotent by file path)
 * - Security Law: Rate limited to prevent storage exhaustion
 * - Audit Law: N/A (file upload, not business state change)
 */
export async function uploadSubmissionFile(formData: FormData): Promise<UploadResult> {
	const traceId = await getTraceId();
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { url: null, error: "You must be signed in" };
	}

	const log = createRequestLogger(traceId, user.id);
	logStep(log, "uploadSubmissionFile:start", {});

	// Security Law: Rate limit to prevent storage exhaustion
	const headersList = await headers();
	const ipAddress = getClientIP(headersList);
	const rateLimitResult = await checkRateLimit(ipAddress, "upload");
	if (!rateLimitResult.success) {
		logStep(log, "uploadSubmissionFile:rate_limited", {});
		return { url: null, error: "Too many uploads. Please try again later." };
	}

	const file = formData.get("file") as File;
	if (!file) {
		logStep(log, "uploadSubmissionFile:no_file", {});
		return { url: null, error: "No file provided" };
	}

	// Validate file size (max 50MB)
	if (file.size > 50 * 1024 * 1024) {
		logStep(log, "uploadSubmissionFile:file_too_large", { size: file.size });
		return { url: null, error: "File size must be under 50MB" };
	}

	// Generate unique filename
	const timestamp = Date.now();
	const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
	const filePath = `${user.id}/${timestamp}_${sanitizedName}`;

	logStep(log, "uploadSubmissionFile:uploading", { filePath, size: file.size });

	const { data, error } = await supabase.storage
		.from("homework-submissions")
		.upload(filePath, file, {
			cacheControl: "3600",
			upsert: false,
		});

	if (error) {
		logStepError(log, "uploadSubmissionFile:upload_failed", error, { filePath });
		return { url: null, error: "Failed to upload file" };
	}

	// Get public URL
	const { data: urlData } = supabase.storage
		.from("homework-submissions")
		.getPublicUrl(data.path);

	logStep(log, "uploadSubmissionFile:success", { filePath });
	return { url: urlData.publicUrl, error: null };
}

// ============================================================================
// Upload Homework Instruction Audio
// ============================================================================

/**
 * Upload audio instruction for homework assignment (tutor only).
 * Returns the public URL for the audio file.
 *
 * Compliance:
 * - Repository Law: N/A (storage operation)
 * - Observability Law: Has traceId, logStep, logStepError
 * - Safety Law: N/A (upload is idempotent by file path)
 * - Security Law: Rate limited to prevent storage exhaustion
 * - Audit Law: N/A (file upload, not business state change)
 */
export async function uploadHomeworkInstructionAudio(
	formData: FormData
): Promise<UploadResult> {
	const traceId = await getTraceId();
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { url: null, error: "You must be signed in" };
	}

	const log = createRequestLogger(traceId, user.id);
	logStep(log, "uploadHomeworkInstructionAudio:start", {});

	// Security Law: Rate limit to prevent storage exhaustion
	const headersList = await headers();
	const ipAddress = getClientIP(headersList);
	const rateLimitResult = await checkRateLimit(ipAddress, "upload");
	if (!rateLimitResult.success) {
		logStep(log, "uploadHomeworkInstructionAudio:rate_limited", {});
		return {
			url: null,
			error: "Too many uploads. Please try again later.",
		};
	}

	const file = formData.get("file") as File;
	if (!file) {
		logStep(log, "uploadHomeworkInstructionAudio:no_file", {});
		return { url: null, error: "No audio file provided" };
	}

	// Validate file size (max 20MB - plenty for 2 minutes of audio)
	if (file.size > 20 * 1024 * 1024) {
		logStep(log, "uploadHomeworkInstructionAudio:file_too_large", { size: file.size });
		return { url: null, error: "Audio file must be under 20MB" };
	}

	// Generate unique filename
	const timestamp = Date.now();
	const extension =
		file.type === "audio/webm" ? "webm" : file.type === "audio/mp4" ? "mp4" : "audio";
	const filePath = `${user.id}/instructions/${timestamp}_instruction.${extension}`;

	logStep(log, "uploadHomeworkInstructionAudio:uploading", { filePath, size: file.size });

	const { data, error } = await supabase.storage
		.from("homework-submissions")
		.upload(filePath, file, {
			cacheControl: "3600",
			upsert: false,
		});

	if (error) {
		logStepError(log, "uploadHomeworkInstructionAudio:upload_failed", error, { filePath });
		return { url: null, error: "Failed to upload audio" };
	}

	// Get public URL
	const { data: urlData } = supabase.storage
		.from("homework-submissions")
		.getPublicUrl(data.path);

	logStep(log, "uploadHomeworkInstructionAudio:success", { filePath });
	return { url: urlData.publicUrl, error: null };
}

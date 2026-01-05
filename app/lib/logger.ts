"use strict";

/**
 * Structured logging module using pino.
 *
 * Features:
 * - TraceId correlation (from x-request-id header or UUID fallback)
 * - TutorId context binding
 * - Action wrapper for automatic timing and status logging
 * - Sensitive data sanitization
 * - Error enrichment with stack traces
 */

import pino from "pino";
import { randomUUID } from "crypto";

// ============================================================================
// Types
// ============================================================================

export type Logger = pino.Logger;

export interface ActionLogInput {
	[key: string]: unknown;
}

// ============================================================================
// Base Logger
// ============================================================================

const logger = pino({
	level: process.env.LOG_LEVEL || "info",
	formatters: {
		level: (label) => ({ level: label }),
	},
	timestamp: pino.stdTimeFunctions.isoTime,
});

export default logger;

// ============================================================================
// TraceId Helpers
// ============================================================================

/**
 * Get traceId from x-request-id header or generate a UUID fallback.
 * Safe to call in any context (handles missing headers gracefully).
 * Uses dynamic import for next/headers to support Node.js test environment.
 */
export async function getTraceId(): Promise<string> {
	try {
		// Dynamic import to avoid breaking Node.js test environment
		const { headers } = await import("next/headers");
		const headersList = await headers();
		return headersList.get("x-request-id") || randomUUID();
	} catch {
		// headers() throws if called outside of a request context
		// or if next/headers module is unavailable (test environment)
		return randomUUID();
	}
}

/**
 * Synchronous version for contexts where async is not possible.
 * Always generates a new UUID (cannot access headers synchronously).
 */
export function getTraceIdSync(): string {
	return randomUUID();
}

// ============================================================================
// Child Logger Factory
// ============================================================================

/**
 * Create a child logger with request context (traceId and optional tutorId).
 * Use this at the start of each server action to bind context for all logs.
 */
export function createRequestLogger(traceId: string, tutorId?: string): Logger {
	const bindings: Record<string, string> = { traceId };
	if (tutorId) {
		bindings.tutorId = tutorId;
	}
	return logger.child(bindings);
}

// ============================================================================
// Input Sanitization
// ============================================================================

const SENSITIVE_KEYS = [
	"password",
	"token",
	"secret",
	"card",
	"cvv",
	"ssn",
	"key",
	"authorization",
	"cookie",
	"credential",
];

/**
 * Sanitize input by redacting sensitive fields.
 * Checks if any key contains a sensitive substring (case-insensitive).
 */
export function sanitizeInput(
	input: Record<string, unknown>
): Record<string, unknown> {
	if (!input || typeof input !== "object") {
		return input;
	}

	return Object.fromEntries(
		Object.entries(input).map(([key, value]) => {
			const lowerKey = key.toLowerCase();
			const isSensitive = SENSITIVE_KEYS.some((s) => lowerKey.includes(s));

			if (isSensitive) {
				return [key, "[REDACTED]"];
			}

			// Recursively sanitize nested objects (but not arrays)
			if (value && typeof value === "object" && !Array.isArray(value)) {
				return [key, sanitizeInput(value as Record<string, unknown>)];
			}

			return [key, value];
		})
	);
}

// ============================================================================
// Error Enrichment
// ============================================================================

/**
 * Enrich an error with full stack trace for logging.
 * Handles both Error instances and unknown throwables.
 */
export function enrichError(error: unknown): object {
	if (error instanceof Error) {
		return {
			name: error.name,
			message: error.message,
			stack: error.stack,
			// Include any additional properties (e.g., Supabase error codes)
			...(typeof (error as Record<string, unknown>).code === "string" && {
				code: (error as Record<string, unknown>).code,
			}),
			...(typeof (error as Record<string, unknown>).details === "string" && {
				details: (error as Record<string, unknown>).details,
			}),
		};
	}

	// Handle non-Error throwables
	return { raw: String(error) };
}

// ============================================================================
// Action Wrapper
// ============================================================================

/**
 * Wrap a server action with automatic logging of:
 * - Start time and input (sanitized)
 * - End time, duration, and success/fail status
 * - Full error details on failure
 *
 * Usage:
 * ```ts
 * export async function createBooking(params: CreateBookingInput) {
 *   const traceId = await getTraceId();
 *   const log = createRequestLogger(traceId, params.tutorId);
 *
 *   return withActionLogging("createBooking", log, params, async () => {
 *     // ... action logic
 *   });
 * }
 * ```
 */
export async function withActionLogging<T>(
	actionName: string,
	log: Logger,
	input: ActionLogInput,
	fn: () => Promise<T>
): Promise<T> {
	const startTime = Date.now();
	const sanitizedInput = sanitizeInput(input);

	log.info({ action: actionName, phase: "start", input: sanitizedInput });

	try {
		const result = await fn();
		const durationMs = Date.now() - startTime;
		log.info({
			action: actionName,
			phase: "end",
			status: "success",
			durationMs,
		});
		return result;
	} catch (error) {
		const durationMs = Date.now() - startTime;
		log.error({
			action: actionName,
			phase: "end",
			status: "fail",
			durationMs,
			error: enrichError(error),
			input: sanitizedInput,
		});
		throw error;
	}
}

/**
 * Log a step within an action. Use this for intermediate operations
 * that don't need full try/catch wrapping.
 *
 * Usage:
 * ```ts
 * logStep(log, "validateService", { serviceId, found: !!service });
 * ```
 */
export function logStep(
	log: Logger,
	step: string,
	data?: Record<string, unknown>
): void {
	log.info({ step, ...data });
}

/**
 * Log an error at a specific step without re-throwing.
 * Use when you want to log the error but handle it gracefully.
 */
export function logStepError(
	log: Logger,
	step: string,
	error: unknown,
	context?: Record<string, unknown>
): void {
	log.error({
		step,
		error: enrichError(error),
		...(context && { context: sanitizeInput(context) }),
	});
}

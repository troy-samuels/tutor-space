import { STUDENT_STATUS_MAP } from "./types.ts";

// ============================================================================
// Status Normalization
// ============================================================================

/**
 * Normalize student status from various input formats.
 * Returns undefined if status is not recognized.
 */
export function normalizeStatus(status?: string): string | undefined {
	if (!status) return undefined;
	const normalized = status.trim().toLowerCase();
	return STUDENT_STATUS_MAP[normalized];
}

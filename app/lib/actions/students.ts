// ============================================================================
// Student Actions - Barrel Export (Backward Compatibility)
// ============================================================================
// This file re-exports all student actions from the modular structure.
// For new code, prefer importing from "@/lib/actions/students/index" directly.
//
// Refactored to follow the TutorLingua 10x Laws:
// - Repository Law: All DB operations go through lib/repositories/students.ts
// - Observability Law: All functions use traceId, logStep, logStepError
// - Safety Law: Create operations use withIdempotency()
// - Security Law: Public operations use ServerActionLimiters
// - Audit Law: Status changes use recordAudit()
//
// See: docs/ENGINEERING_STANDARDS.md
// ============================================================================

// Re-export everything from the modular structure
export * from "./students/index.ts";

// Legacy type export for direct usage (deprecated - use StudentRecord from types)
export type { StudentRecord } from "./students/types.ts";

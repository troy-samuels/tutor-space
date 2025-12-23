/**
 * Homework Status Workflow Unit Tests
 *
 * Tests for the homework assignment and submission status workflow,
 * including valid/invalid status transitions and terminal states.
 *
 * @module tests/unit/homework/status-workflow
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

// =============================================================================
// TYPES
// =============================================================================

/**
 * Homework assignment statuses
 */
type HomeworkStatus = "assigned" | "in_progress" | "submitted" | "completed" | "cancelled";

/**
 * Submission review statuses
 */
type ReviewStatus = "pending" | "reviewed" | "needs_revision";

/**
 * Homework assignment record
 */
interface HomeworkAssignment {
  id: string;
  student_id: string;
  tutor_id: string;
  title: string;
  instructions?: string | null;
  due_date?: string | null;
  status: HomeworkStatus;
  completed_at?: string | null;
  student_notes?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Homework submission record
 */
interface HomeworkSubmission {
  id: string;
  homework_id: string;
  student_id: string;
  text_response: string | null;
  audio_url: string | null;
  file_attachments: unknown[];
  submitted_at: string;
  tutor_feedback: string | null;
  reviewed_at: string | null;
  review_status: ReviewStatus;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const HOMEWORK_STATUSES: HomeworkStatus[] = [
  "assigned",
  "in_progress",
  "submitted",
  "completed",
  "cancelled",
];

const REVIEW_STATUSES: ReviewStatus[] = ["pending", "reviewed", "needs_revision"];

/**
 * Valid status transitions for homework assignments
 */
const VALID_STATUS_TRANSITIONS: Record<HomeworkStatus, HomeworkStatus[]> = {
  assigned: ["in_progress", "cancelled"],
  in_progress: ["submitted", "cancelled"],
  submitted: ["completed", "cancelled"], // Student submits, tutor can complete or cancel
  completed: [], // Terminal state - no further transitions allowed
  cancelled: [], // Terminal state - no further transitions allowed
};

/**
 * Terminal states - once in these states, homework cannot transition further
 */
const TERMINAL_STATES: HomeworkStatus[] = ["completed", "cancelled"];

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

/**
 * Check if a status value is valid
 */
function isValidHomeworkStatus(status: string): status is HomeworkStatus {
  return HOMEWORK_STATUSES.includes(status as HomeworkStatus);
}

/**
 * Check if a review status value is valid
 */
function isValidReviewStatus(status: string): status is ReviewStatus {
  return REVIEW_STATUSES.includes(status as ReviewStatus);
}

/**
 * Check if a status transition is valid
 */
function isValidStatusTransition(from: HomeworkStatus, to: HomeworkStatus): boolean {
  const allowedTransitions = VALID_STATUS_TRANSITIONS[from];
  return allowedTransitions.includes(to);
}

/**
 * Check if a status is a terminal state
 */
function isTerminalState(status: HomeworkStatus): boolean {
  return TERMINAL_STATES.includes(status);
}

/**
 * Get allowed transitions from a status
 */
function getAllowedTransitions(status: HomeworkStatus): HomeworkStatus[] {
  return VALID_STATUS_TRANSITIONS[status];
}

/**
 * Validate homework can accept submissions
 */
function canAcceptSubmission(status: HomeworkStatus): boolean {
  // Can only submit if not completed or cancelled
  return status !== "completed" && status !== "cancelled";
}

/**
 * Validate homework can be cancelled
 */
function canBeCancelled(status: HomeworkStatus): boolean {
  // Can be cancelled from any non-terminal state
  return !isTerminalState(status);
}

/**
 * Validate homework can be marked completed
 */
function canBeCompleted(status: HomeworkStatus): boolean {
  // Can be completed from submitted state (after review) or in_progress (direct completion)
  return status === "submitted" || status === "in_progress";
}

/**
 * Validate status update payload
 */
function validateStatusUpdate(
  current: HomeworkStatus,
  target: HomeworkStatus
): { valid: boolean; error?: string } {
  if (!isValidHomeworkStatus(target)) {
    return { valid: false, error: `Invalid status: ${target}` };
  }

  if (current === target) {
    return { valid: true }; // No-op, but valid
  }

  if (isTerminalState(current)) {
    return { valid: false, error: `Cannot transition from terminal state: ${current}` };
  }

  if (!isValidStatusTransition(current, target)) {
    const allowed = getAllowedTransitions(current);
    return {
      valid: false,
      error: `Invalid transition from ${current} to ${target}. Allowed: ${allowed.join(", ") || "none"}`,
    };
  }

  return { valid: true };
}

/**
 * Process review completion - determines if homework should be marked completed
 */
function shouldCompleteOnReview(reviewStatus: ReviewStatus): boolean {
  return reviewStatus === "reviewed";
}

// =============================================================================
// TEST HELPERS
// =============================================================================

function createMockHomework(overrides: Partial<HomeworkAssignment> = {}): HomeworkAssignment {
  return {
    id: "hw_123",
    student_id: "student_123",
    tutor_id: "tutor_123",
    title: "Practice vocabulary",
    instructions: "Complete the exercises",
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: "assigned",
    completed_at: null,
    student_notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

function createMockSubmission(overrides: Partial<HomeworkSubmission> = {}): HomeworkSubmission {
  return {
    id: "sub_123",
    homework_id: "hw_123",
    student_id: "student_123",
    text_response: "Here is my work",
    audio_url: null,
    file_attachments: [],
    submitted_at: new Date().toISOString(),
    tutor_feedback: null,
    reviewed_at: null,
    review_status: "pending",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

// =============================================================================
// TESTS
// =============================================================================

describe("Homework Status Workflow", () => {
  describe("isValidHomeworkStatus", () => {
    it("accepts all valid statuses", () => {
      for (const status of HOMEWORK_STATUSES) {
        assert.ok(isValidHomeworkStatus(status), `${status} should be valid`);
      }
    });

    it("rejects invalid status values", () => {
      assert.ok(!isValidHomeworkStatus("invalid"));
      assert.ok(!isValidHomeworkStatus("pending"));
      assert.ok(!isValidHomeworkStatus("done"));
      assert.ok(!isValidHomeworkStatus(""));
    });
  });

  describe("isValidReviewStatus", () => {
    it("accepts all valid review statuses", () => {
      for (const status of REVIEW_STATUSES) {
        assert.ok(isValidReviewStatus(status), `${status} should be valid`);
      }
    });

    it("rejects invalid review status values", () => {
      assert.ok(!isValidReviewStatus("invalid"));
      assert.ok(!isValidReviewStatus("approved"));
      assert.ok(!isValidReviewStatus("rejected"));
    });
  });

  describe("Status Transitions", () => {
    describe("from assigned", () => {
      it("allows transition to in_progress", () => {
        assert.ok(isValidStatusTransition("assigned", "in_progress"));
      });

      it("allows transition to cancelled", () => {
        assert.ok(isValidStatusTransition("assigned", "cancelled"));
      });

      it("rejects transition to submitted", () => {
        assert.ok(!isValidStatusTransition("assigned", "submitted"));
      });

      it("rejects transition to completed", () => {
        assert.ok(!isValidStatusTransition("assigned", "completed"));
      });
    });

    describe("from in_progress", () => {
      it("allows transition to submitted", () => {
        assert.ok(isValidStatusTransition("in_progress", "submitted"));
      });

      it("allows transition to cancelled", () => {
        assert.ok(isValidStatusTransition("in_progress", "cancelled"));
      });

      it("rejects transition to assigned", () => {
        assert.ok(!isValidStatusTransition("in_progress", "assigned"));
      });

      it("rejects direct transition to completed", () => {
        // Must go through submitted first (via submission)
        assert.ok(!isValidStatusTransition("in_progress", "completed"));
      });
    });

    describe("from submitted", () => {
      it("allows transition to completed", () => {
        assert.ok(isValidStatusTransition("submitted", "completed"));
      });

      it("allows transition to cancelled", () => {
        assert.ok(isValidStatusTransition("submitted", "cancelled"));
      });

      it("rejects transition back to in_progress", () => {
        assert.ok(!isValidStatusTransition("submitted", "in_progress"));
      });

      it("rejects transition back to assigned", () => {
        assert.ok(!isValidStatusTransition("submitted", "assigned"));
      });
    });

    describe("from completed (terminal)", () => {
      it("rejects all transitions", () => {
        for (const status of HOMEWORK_STATUSES) {
          if (status !== "completed") {
            assert.ok(
              !isValidStatusTransition("completed", status),
              `Should not allow transition from completed to ${status}`
            );
          }
        }
      });
    });

    describe("from cancelled (terminal)", () => {
      it("rejects all transitions", () => {
        for (const status of HOMEWORK_STATUSES) {
          if (status !== "cancelled") {
            assert.ok(
              !isValidStatusTransition("cancelled", status),
              `Should not allow transition from cancelled to ${status}`
            );
          }
        }
      });
    });
  });

  describe("Terminal States", () => {
    it("completed is a terminal state", () => {
      assert.ok(isTerminalState("completed"));
    });

    it("cancelled is a terminal state", () => {
      assert.ok(isTerminalState("cancelled"));
    });

    it("assigned is not a terminal state", () => {
      assert.ok(!isTerminalState("assigned"));
    });

    it("in_progress is not a terminal state", () => {
      assert.ok(!isTerminalState("in_progress"));
    });

    it("submitted is not a terminal state", () => {
      assert.ok(!isTerminalState("submitted"));
    });
  });

  describe("getAllowedTransitions", () => {
    it("returns correct transitions for assigned", () => {
      const allowed = getAllowedTransitions("assigned");
      assert.deepEqual(allowed.sort(), ["cancelled", "in_progress"].sort());
    });

    it("returns correct transitions for in_progress", () => {
      const allowed = getAllowedTransitions("in_progress");
      assert.deepEqual(allowed.sort(), ["cancelled", "submitted"].sort());
    });

    it("returns correct transitions for submitted", () => {
      const allowed = getAllowedTransitions("submitted");
      assert.deepEqual(allowed.sort(), ["cancelled", "completed"].sort());
    });

    it("returns empty array for completed", () => {
      const allowed = getAllowedTransitions("completed");
      assert.deepEqual(allowed, []);
    });

    it("returns empty array for cancelled", () => {
      const allowed = getAllowedTransitions("cancelled");
      assert.deepEqual(allowed, []);
    });
  });

  describe("canAcceptSubmission", () => {
    it("accepts submission when assigned", () => {
      assert.ok(canAcceptSubmission("assigned"));
    });

    it("accepts submission when in_progress", () => {
      assert.ok(canAcceptSubmission("in_progress"));
    });

    it("accepts submission when submitted (resubmission)", () => {
      assert.ok(canAcceptSubmission("submitted"));
    });

    it("rejects submission when completed", () => {
      assert.ok(!canAcceptSubmission("completed"));
    });

    it("rejects submission when cancelled", () => {
      assert.ok(!canAcceptSubmission("cancelled"));
    });
  });

  describe("canBeCancelled", () => {
    it("can cancel when assigned", () => {
      assert.ok(canBeCancelled("assigned"));
    });

    it("can cancel when in_progress", () => {
      assert.ok(canBeCancelled("in_progress"));
    });

    it("can cancel when submitted", () => {
      assert.ok(canBeCancelled("submitted"));
    });

    it("cannot cancel when already completed", () => {
      assert.ok(!canBeCancelled("completed"));
    });

    it("cannot cancel when already cancelled", () => {
      assert.ok(!canBeCancelled("cancelled"));
    });
  });

  describe("canBeCompleted", () => {
    it("cannot complete when assigned", () => {
      assert.ok(!canBeCompleted("assigned"));
    });

    it("can complete when in_progress (direct completion)", () => {
      assert.ok(canBeCompleted("in_progress"));
    });

    it("can complete when submitted", () => {
      assert.ok(canBeCompleted("submitted"));
    });

    it("cannot complete when already completed", () => {
      assert.ok(!canBeCompleted("completed"));
    });

    it("cannot complete when cancelled", () => {
      assert.ok(!canBeCompleted("cancelled"));
    });
  });

  describe("validateStatusUpdate", () => {
    it("accepts valid transition assigned → in_progress", () => {
      const result = validateStatusUpdate("assigned", "in_progress");
      assert.ok(result.valid);
      assert.ok(!result.error);
    });

    it("accepts valid transition in_progress → submitted", () => {
      const result = validateStatusUpdate("in_progress", "submitted");
      assert.ok(result.valid);
    });

    it("accepts valid transition submitted → completed", () => {
      const result = validateStatusUpdate("submitted", "completed");
      assert.ok(result.valid);
    });

    it("rejects invalid status value", () => {
      const result = validateStatusUpdate("assigned", "invalid" as HomeworkStatus);
      assert.ok(!result.valid);
      assert.ok(result.error?.includes("Invalid status"));
    });

    it("rejects transition from terminal state", () => {
      const result = validateStatusUpdate("completed", "assigned");
      assert.ok(!result.valid);
      assert.ok(result.error?.includes("terminal state"));
    });

    it("rejects invalid transition path", () => {
      const result = validateStatusUpdate("assigned", "completed");
      assert.ok(!result.valid);
      assert.ok(result.error?.includes("Invalid transition"));
    });

    it("accepts same status (no-op)", () => {
      const result = validateStatusUpdate("assigned", "assigned");
      assert.ok(result.valid);
    });

    it("error message includes allowed transitions", () => {
      const result = validateStatusUpdate("assigned", "completed");
      assert.ok(result.error?.includes("Allowed"));
      assert.ok(result.error?.includes("in_progress"));
    });
  });

  describe("shouldCompleteOnReview", () => {
    it("completes homework when review status is reviewed", () => {
      assert.ok(shouldCompleteOnReview("reviewed"));
    });

    it("does not complete homework when needs_revision", () => {
      assert.ok(!shouldCompleteOnReview("needs_revision"));
    });

    it("does not complete homework when pending", () => {
      assert.ok(!shouldCompleteOnReview("pending"));
    });
  });

  describe("Workflow Scenarios", () => {
    describe("Happy path: assignment → completion", () => {
      it("follows correct status progression", () => {
        let homework = createMockHomework({ status: "assigned" });

        // Student starts working
        let transition = validateStatusUpdate(homework.status, "in_progress");
        assert.ok(transition.valid, "Should allow assigned → in_progress");
        homework.status = "in_progress";

        // Student submits
        transition = validateStatusUpdate(homework.status, "submitted");
        assert.ok(transition.valid, "Should allow in_progress → submitted");
        homework.status = "submitted";

        // Tutor reviews and completes
        transition = validateStatusUpdate(homework.status, "completed");
        assert.ok(transition.valid, "Should allow submitted → completed");
        homework.status = "completed";

        // Verify terminal state
        assert.ok(isTerminalState(homework.status));
      });
    });

    describe("Cancellation from any non-terminal state", () => {
      it("can cancel from assigned", () => {
        const homework = createMockHomework({ status: "assigned" });
        const transition = validateStatusUpdate(homework.status, "cancelled");
        assert.ok(transition.valid);
      });

      it("can cancel from in_progress", () => {
        const homework = createMockHomework({ status: "in_progress" });
        const transition = validateStatusUpdate(homework.status, "cancelled");
        assert.ok(transition.valid);
      });

      it("can cancel from submitted", () => {
        const homework = createMockHomework({ status: "submitted" });
        const transition = validateStatusUpdate(homework.status, "cancelled");
        assert.ok(transition.valid);
      });
    });

    describe("Submission with revision workflow", () => {
      it("stays in submitted when needs_revision", () => {
        const homework = createMockHomework({ status: "submitted" });
        const submission = createMockSubmission({ review_status: "needs_revision" });

        // Tutor reviews and requests revision
        assert.ok(!shouldCompleteOnReview(submission.review_status));

        // Homework stays in submitted state for resubmission
        assert.ok(canAcceptSubmission(homework.status));
      });

      it("completes on final review approval", () => {
        const homework = createMockHomework({ status: "submitted" });
        const submission = createMockSubmission({ review_status: "reviewed" });

        assert.ok(shouldCompleteOnReview(submission.review_status));

        // Validate the completion transition
        const transition = validateStatusUpdate(homework.status, "completed");
        assert.ok(transition.valid);
      });
    });

    describe("Invalid operations on terminal states", () => {
      it("cannot modify completed homework status", () => {
        const homework = createMockHomework({ status: "completed" });

        for (const status of ["assigned", "in_progress", "submitted", "cancelled"] as HomeworkStatus[]) {
          const transition = validateStatusUpdate(homework.status, status);
          assert.ok(!transition.valid, `Should reject ${status}`);
        }
      });

      it("cannot accept submission on completed homework", () => {
        const homework = createMockHomework({ status: "completed" });
        assert.ok(!canAcceptSubmission(homework.status));
      });

      it("cannot reactivate cancelled homework", () => {
        const homework = createMockHomework({ status: "cancelled" });

        for (const status of ["assigned", "in_progress", "submitted", "completed"] as HomeworkStatus[]) {
          const transition = validateStatusUpdate(homework.status, status);
          assert.ok(!transition.valid, `Should reject ${status}`);
        }
      });
    });
  });

  describe("Edge Cases", () => {
    it("handles homework with no due date", () => {
      const homework = createMockHomework({ due_date: null });
      assert.ok(canAcceptSubmission(homework.status));
    });

    it("handles homework with past due date", () => {
      const homework = createMockHomework({
        due_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      });
      // Past due date doesn't affect status validation - that's business logic
      assert.ok(canAcceptSubmission(homework.status));
    });

    it("handles submission with empty content", () => {
      const submission = createMockSubmission({
        text_response: null,
        audio_url: null,
        file_attachments: [],
      });
      // Empty submission is still valid structurally - validation is business logic
      assert.ok(isValidReviewStatus(submission.review_status));
    });
  });
});

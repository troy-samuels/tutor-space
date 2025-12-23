/**
 * Homework Assignment, Submission, and Review Workflow Integration Tests
 *
 * Tests the full homework lifecycle:
 * - Tutor assigns homework → record created
 * - Student submits with text/audio/files → submission created
 * - Tutor reviews → feedback saved
 * - Status progresses: assigned → submitted → completed
 *
 * @module tests/integration/workflows/homework-assignment-submission-review
 */

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

// =============================================================================
// TYPES (mirroring production)
// =============================================================================

type HomeworkStatus = "assigned" | "in_progress" | "submitted" | "completed" | "cancelled";

interface HomeworkAttachment {
  label: string;
  url: string;
  type?: "pdf" | "image" | "link" | "video" | "file";
}

interface HomeworkAssignment {
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
}

interface SubmissionFile {
  name: string;
  url: string;
  type: string;
  size: number;
}

interface HomeworkSubmission {
  id: string;
  homework_id: string;
  student_id: string;
  text_response: string | null;
  audio_url: string | null;
  file_attachments: SubmissionFile[];
  submitted_at: string;
  tutor_feedback: string | null;
  reviewed_at: string | null;
  review_status: "pending" | "reviewed" | "needs_revision";
  created_at: string;
  updated_at: string;
}

interface AssignHomeworkInput {
  studentId: string;
  title: string;
  instructions?: string | null;
  dueDate?: string | null;
  bookingId?: string | null;
  attachments?: HomeworkAttachment[];
  audioInstructionUrl?: string | null;
  status?: HomeworkStatus;
}

interface SubmitHomeworkInput {
  homeworkId: string;
  textResponse?: string;
  audioUrl?: string;
  fileAttachments?: SubmissionFile[];
}

interface ReviewSubmissionInput {
  submissionId: string;
  feedback: string;
  status: "reviewed" | "needs_revision";
}

// =============================================================================
// MOCK DATA GENERATORS
// =============================================================================

let idCounter = 1;

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${idCounter++}`;
}

function extractIdSequence(id: string): number {
  const parts = id.split("_");
  const sequence = Number.parseInt(parts[parts.length - 1] ?? "", 10);
  return Number.isFinite(sequence) ? sequence : 0;
}

function createMockTutor() {
  return {
    id: generateId("tutor"),
    full_name: "Test Tutor",
    email: "tutor@test.com",
    timezone: "America/New_York",
  };
}

function createMockStudent(tutorId: string) {
  return {
    id: generateId("student"),
    tutor_id: tutorId,
    user_id: generateId("user"),
    first_name: "Test",
    last_name: "Student",
    email: "student@test.com",
  };
}

// =============================================================================
// PURE FUNCTIONS FOR TESTING (mirroring production logic)
// =============================================================================

const HOMEWORK_STATUSES: HomeworkStatus[] = [
  "assigned",
  "in_progress",
  "submitted",
  "completed",
  "cancelled",
];

const VALID_STATUS_TRANSITIONS: Record<HomeworkStatus, HomeworkStatus[]> = {
  assigned: ["in_progress", "submitted", "cancelled"],
  in_progress: ["submitted", "cancelled"],
  submitted: ["completed", "cancelled", "in_progress"], // in_progress for needs_revision
  completed: [], // Terminal
  cancelled: [], // Terminal
};

function isValidStatusTransition(from: HomeworkStatus, to: HomeworkStatus): boolean {
  return VALID_STATUS_TRANSITIONS[from].includes(to);
}

function normalizeAttachments(attachments?: HomeworkAttachment[] | null): HomeworkAttachment[] {
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

function validateAssignHomeworkInput(input: AssignHomeworkInput): {
  valid: boolean;
  error?: string;
} {
  if (!input.title?.trim()) {
    return { valid: false, error: "Homework title is required." };
  }

  if (input.status && !HOMEWORK_STATUSES.includes(input.status)) {
    return { valid: false, error: "Invalid homework status." };
  }

  if (input.dueDate) {
    const dueDate = new Date(input.dueDate);
    if (isNaN(dueDate.getTime())) {
      return { valid: false, error: "Invalid due date format." };
    }
  }

  return { valid: true };
}

function canAcceptSubmission(homework: HomeworkAssignment): {
  canSubmit: boolean;
  error?: string;
} {
  if (homework.status === "completed") {
    return { canSubmit: false, error: "This homework cannot accept submissions" };
  }

  if (homework.status === "cancelled") {
    return { canSubmit: false, error: "This homework cannot accept submissions" };
  }

  return { canSubmit: true };
}

function createHomeworkPayload(
  input: AssignHomeworkInput,
  tutorId: string
): Omit<HomeworkAssignment, "id" | "created_at" | "updated_at"> {
  return {
    student_id: input.studentId,
    tutor_id: tutorId,
    booking_id: input.bookingId ?? null,
    title: input.title.trim(),
    instructions: input.instructions ?? null,
    due_date: input.dueDate ?? null,
    status: input.status ?? "assigned",
    attachments: normalizeAttachments(input.attachments),
    audio_instruction_url: input.audioInstructionUrl ?? null,
    student_notes: null,
    tutor_notes: null,
    completed_at: null,
    submitted_at: null,
  };
}

function createSubmissionPayload(
  input: SubmitHomeworkInput,
  studentId: string
): Omit<HomeworkSubmission, "id" | "created_at" | "updated_at"> {
  return {
    homework_id: input.homeworkId,
    student_id: studentId,
    text_response: input.textResponse || null,
    audio_url: input.audioUrl || null,
    file_attachments: input.fileAttachments || [],
    submitted_at: new Date().toISOString(),
    tutor_feedback: null,
    reviewed_at: null,
    review_status: "pending",
  };
}

function applyReview(
  submission: HomeworkSubmission,
  review: ReviewSubmissionInput
): HomeworkSubmission {
  return {
    ...submission,
    tutor_feedback: review.feedback,
    review_status: review.status,
    reviewed_at: new Date().toISOString(),
  };
}

function shouldCompleteHomework(reviewStatus: "reviewed" | "needs_revision"): boolean {
  return reviewStatus === "reviewed";
}

// =============================================================================
// MOCK IN-MEMORY DATABASE
// =============================================================================

class MockHomeworkDatabase {
  private assignments: Map<string, HomeworkAssignment> = new Map();
  private submissions: Map<string, HomeworkSubmission> = new Map();

  reset(): void {
    this.assignments.clear();
    this.submissions.clear();
  }

  // Assignment operations
  createAssignment(
    input: AssignHomeworkInput,
    tutorId: string
  ): { data: HomeworkAssignment | null; error: string | null } {
    const validation = validateAssignHomeworkInput(input);
    if (!validation.valid) {
      return { data: null, error: validation.error! };
    }

    const now = new Date().toISOString();
    const id = generateId("homework");
    const assignment: HomeworkAssignment = {
      id,
      ...createHomeworkPayload(input, tutorId),
      created_at: now,
      updated_at: now,
    };

    this.assignments.set(id, assignment);
    return { data: assignment, error: null };
  }

  getAssignment(id: string): HomeworkAssignment | null {
    return this.assignments.get(id) || null;
  }

  updateAssignmentStatus(
    id: string,
    status: HomeworkStatus,
    studentNotes?: string | null
  ): { data: HomeworkAssignment | null; error: string | null } {
    const assignment = this.assignments.get(id);
    if (!assignment) {
      return { data: null, error: "Assignment not found" };
    }

    if (!isValidStatusTransition(assignment.status, status)) {
      return {
        data: null,
        error: `Cannot transition from ${assignment.status} to ${status}`,
      };
    }

    const updated: HomeworkAssignment = {
      ...assignment,
      status,
      student_notes: studentNotes ?? assignment.student_notes,
      updated_at: new Date().toISOString(),
      completed_at: status === "completed" ? new Date().toISOString() : assignment.completed_at,
      submitted_at: status === "submitted" ? new Date().toISOString() : assignment.submitted_at,
    };

    this.assignments.set(id, updated);
    return { data: updated, error: null };
  }

  // Submission operations
  createSubmission(
    input: SubmitHomeworkInput,
    studentId: string
  ): { data: HomeworkSubmission | null; error: string | null } {
    const homework = this.assignments.get(input.homeworkId);
    if (!homework) {
      return { data: null, error: "Homework assignment not found" };
    }

    const canSubmit = canAcceptSubmission(homework);
    if (!canSubmit.canSubmit) {
      return { data: null, error: canSubmit.error! };
    }

    const now = new Date().toISOString();
    const id = generateId("submission");
    const submission: HomeworkSubmission = {
      id,
      ...createSubmissionPayload(input, studentId),
      created_at: now,
      updated_at: now,
    };

    this.submissions.set(id, submission);

    // Update homework status to submitted
    this.updateAssignmentStatus(input.homeworkId, "submitted");

    return { data: submission, error: null };
  }

  getSubmission(id: string): HomeworkSubmission | null {
    return this.submissions.get(id) || null;
  }

  getSubmissionsForHomework(homeworkId: string): HomeworkSubmission[] {
    return Array.from(this.submissions.values())
      .filter((s) => s.homework_id === homeworkId)
      .sort((a, b) => {
        const submittedDiff = new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime();
        if (submittedDiff !== 0) {
          return submittedDiff;
        }
        const createdDiff = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        if (createdDiff !== 0) {
          return createdDiff;
        }
        return extractIdSequence(b.id) - extractIdSequence(a.id);
      });
  }

  reviewSubmission(
    input: ReviewSubmissionInput
  ): { data: HomeworkSubmission | null; error: string | null } {
    const submission = this.submissions.get(input.submissionId);
    if (!submission) {
      return { data: null, error: "Submission not found" };
    }

    const reviewed = applyReview(submission, input);
    reviewed.updated_at = new Date().toISOString();
    this.submissions.set(input.submissionId, reviewed);

    // If reviewed (not needs_revision), mark homework as completed
    if (shouldCompleteHomework(input.status)) {
      this.updateAssignmentStatus(submission.homework_id, "completed");
    } else {
      // If needs_revision, allow student to resubmit
      this.updateAssignmentStatus(submission.homework_id, "in_progress");
    }

    return { data: reviewed, error: null };
  }
}

// =============================================================================
// TESTS
// =============================================================================

describe("Homework Assignment, Submission, and Review Workflow", () => {
  let db: MockHomeworkDatabase;
  let tutor: ReturnType<typeof createMockTutor>;
  let student: ReturnType<typeof createMockStudent>;

  beforeEach(() => {
    db = new MockHomeworkDatabase();
    tutor = createMockTutor();
    student = createMockStudent(tutor.id);
  });

  describe("Homework Assignment Creation", () => {
    it("creates homework assignment with required fields", () => {
      const result = db.createAssignment(
        {
          studentId: student.id,
          title: "Practice verb conjugations",
        },
        tutor.id
      );

      assert.equal(result.error, null);
      assert.ok(result.data);
      assert.equal(result.data.title, "Practice verb conjugations");
      assert.equal(result.data.student_id, student.id);
      assert.equal(result.data.tutor_id, tutor.id);
      assert.equal(result.data.status, "assigned");
    });

    it("creates homework with all optional fields", () => {
      const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const result = db.createAssignment(
        {
          studentId: student.id,
          title: "Complete chapter 5 exercises",
          instructions: "Focus on the subjunctive mood exercises",
          dueDate,
          attachments: [
            { label: "Textbook PDF", url: "https://example.com/textbook.pdf", type: "pdf" },
            { label: "Practice Video", url: "https://youtube.com/watch?v=abc", type: "video" },
          ],
          audioInstructionUrl: "https://storage.example.com/audio/instructions.mp3",
        },
        tutor.id
      );

      assert.equal(result.error, null);
      assert.ok(result.data);
      assert.equal(result.data.title, "Complete chapter 5 exercises");
      assert.equal(result.data.instructions, "Focus on the subjunctive mood exercises");
      assert.equal(result.data.due_date, dueDate);
      assert.equal(result.data.attachments.length, 2);
      assert.equal(result.data.attachments[0].label, "Textbook PDF");
      assert.equal(result.data.audio_instruction_url, "https://storage.example.com/audio/instructions.mp3");
    });

    it("rejects homework without title", () => {
      const result = db.createAssignment(
        {
          studentId: student.id,
          title: "",
        },
        tutor.id
      );

      assert.ok(result.error);
      assert.equal(result.error, "Homework title is required.");
      assert.equal(result.data, null);
    });

    it("rejects homework with whitespace-only title", () => {
      const result = db.createAssignment(
        {
          studentId: student.id,
          title: "   ",
        },
        tutor.id
      );

      assert.ok(result.error);
      assert.equal(result.data, null);
    });

    it("rejects homework with invalid status", () => {
      const result = db.createAssignment(
        {
          studentId: student.id,
          title: "Test homework",
          status: "invalid" as HomeworkStatus,
        },
        tutor.id
      );

      assert.ok(result.error);
      assert.equal(result.error, "Invalid homework status.");
    });

    it("normalizes attachments correctly", () => {
      const result = db.createAssignment(
        {
          studentId: student.id,
          title: "Test homework",
          attachments: [
            { label: "Resource 1", url: "https://example.com/1.pdf" },
            { label: "", url: "https://example.com/2.pdf" }, // Empty label
            { label: "Empty URL", url: "" }, // Empty URL should be filtered
            { label: "Resource 3", url: "https://example.com/3.pdf", type: "pdf" },
          ],
        },
        tutor.id
      );

      assert.equal(result.error, null);
      assert.ok(result.data);
      assert.equal(result.data.attachments.length, 3); // Empty URL filtered
      assert.equal(result.data.attachments[0].label, "Resource 1");
      assert.equal(result.data.attachments[0].type, "link"); // Default type
      assert.equal(result.data.attachments[1].label, "Resource"); // Default label
      assert.equal(result.data.attachments[2].type, "pdf");
    });
  });

  describe("Homework Submission", () => {
    it("creates text submission for assigned homework", () => {
      const assignment = db.createAssignment(
        {
          studentId: student.id,
          title: "Write a short essay",
        },
        tutor.id
      );

      const submission = db.createSubmission(
        {
          homeworkId: assignment.data!.id,
          textResponse: "This is my essay about the subjunctive mood...",
        },
        student.id
      );

      assert.equal(submission.error, null);
      assert.ok(submission.data);
      assert.equal(submission.data.homework_id, assignment.data!.id);
      assert.equal(submission.data.text_response, "This is my essay about the subjunctive mood...");
      assert.equal(submission.data.review_status, "pending");
    });

    it("creates submission with audio recording", () => {
      const assignment = db.createAssignment(
        {
          studentId: student.id,
          title: "Record pronunciation practice",
        },
        tutor.id
      );

      const submission = db.createSubmission(
        {
          homeworkId: assignment.data!.id,
          audioUrl: "https://storage.example.com/submissions/audio123.webm",
        },
        student.id
      );

      assert.equal(submission.error, null);
      assert.ok(submission.data);
      assert.equal(submission.data.audio_url, "https://storage.example.com/submissions/audio123.webm");
    });

    it("creates submission with file attachments", () => {
      const assignment = db.createAssignment(
        {
          studentId: student.id,
          title: "Complete worksheet",
        },
        tutor.id
      );

      const submission = db.createSubmission(
        {
          homeworkId: assignment.data!.id,
          fileAttachments: [
            { name: "worksheet.pdf", url: "https://storage.example.com/files/worksheet.pdf", type: "application/pdf", size: 102400 },
            { name: "notes.jpg", url: "https://storage.example.com/files/notes.jpg", type: "image/jpeg", size: 51200 },
          ],
        },
        student.id
      );

      assert.equal(submission.error, null);
      assert.ok(submission.data);
      assert.equal(submission.data.file_attachments.length, 2);
      assert.equal(submission.data.file_attachments[0].name, "worksheet.pdf");
    });

    it("creates submission with text, audio, and files", () => {
      const assignment = db.createAssignment(
        {
          studentId: student.id,
          title: "Comprehensive assignment",
        },
        tutor.id
      );

      const submission = db.createSubmission(
        {
          homeworkId: assignment.data!.id,
          textResponse: "Here is my written work",
          audioUrl: "https://storage.example.com/audio.webm",
          fileAttachments: [
            { name: "diagram.png", url: "https://storage.example.com/diagram.png", type: "image/png", size: 25600 },
          ],
        },
        student.id
      );

      assert.equal(submission.error, null);
      assert.ok(submission.data);
      assert.ok(submission.data.text_response);
      assert.ok(submission.data.audio_url);
      assert.equal(submission.data.file_attachments.length, 1);
    });

    it("updates homework status to submitted after submission", () => {
      const assignment = db.createAssignment(
        {
          studentId: student.id,
          title: "Test assignment",
        },
        tutor.id
      );

      assert.equal(assignment.data!.status, "assigned");

      db.createSubmission(
        {
          homeworkId: assignment.data!.id,
          textResponse: "My submission",
        },
        student.id
      );

      const updatedAssignment = db.getAssignment(assignment.data!.id);
      assert.ok(updatedAssignment);
      assert.equal(updatedAssignment.status, "submitted");
      assert.ok(updatedAssignment.submitted_at);
    });

    it("rejects submission for completed homework", () => {
      const assignment = db.createAssignment(
        {
          studentId: student.id,
          title: "Test assignment",
        },
        tutor.id
      );

      // First submission
      db.createSubmission(
        { homeworkId: assignment.data!.id, textResponse: "First submission" },
        student.id
      );

      // Complete the homework
      db.updateAssignmentStatus(assignment.data!.id, "completed");

      // Try to submit again
      const result = db.createSubmission(
        { homeworkId: assignment.data!.id, textResponse: "Second submission" },
        student.id
      );

      assert.ok(result.error);
      assert.equal(result.error, "This homework cannot accept submissions");
    });

    it("rejects submission for cancelled homework", () => {
      const assignment = db.createAssignment(
        {
          studentId: student.id,
          title: "Test assignment",
        },
        tutor.id
      );

      db.updateAssignmentStatus(assignment.data!.id, "cancelled");

      const result = db.createSubmission(
        { homeworkId: assignment.data!.id, textResponse: "My submission" },
        student.id
      );

      assert.ok(result.error);
      assert.equal(result.error, "This homework cannot accept submissions");
    });

    it("rejects submission for non-existent homework", () => {
      const result = db.createSubmission(
        { homeworkId: "nonexistent_id", textResponse: "My submission" },
        student.id
      );

      assert.ok(result.error);
      assert.equal(result.error, "Homework assignment not found");
    });
  });

  describe("Submission Review", () => {
    it("tutor can mark submission as reviewed with feedback", () => {
      const assignment = db.createAssignment(
        { studentId: student.id, title: "Essay assignment" },
        tutor.id
      );

      const submission = db.createSubmission(
        { homeworkId: assignment.data!.id, textResponse: "My essay..." },
        student.id
      );

      const result = db.reviewSubmission({
        submissionId: submission.data!.id,
        feedback: "Great work! Your use of the subjunctive was excellent.",
        status: "reviewed",
      });

      assert.equal(result.error, null);
      assert.ok(result.data);
      assert.equal(result.data.tutor_feedback, "Great work! Your use of the subjunctive was excellent.");
      assert.equal(result.data.review_status, "reviewed");
      assert.ok(result.data.reviewed_at);
    });

    it("homework marked as completed when submission is reviewed", () => {
      const assignment = db.createAssignment(
        { studentId: student.id, title: "Essay assignment" },
        tutor.id
      );

      const submission = db.createSubmission(
        { homeworkId: assignment.data!.id, textResponse: "My essay..." },
        student.id
      );

      db.reviewSubmission({
        submissionId: submission.data!.id,
        feedback: "Well done!",
        status: "reviewed",
      });

      const updatedAssignment = db.getAssignment(assignment.data!.id);
      assert.ok(updatedAssignment);
      assert.equal(updatedAssignment.status, "completed");
      assert.ok(updatedAssignment.completed_at);
    });

    it("tutor can request revision", () => {
      const assignment = db.createAssignment(
        { studentId: student.id, title: "Essay assignment" },
        tutor.id
      );

      const submission = db.createSubmission(
        { homeworkId: assignment.data!.id, textResponse: "My essay..." },
        student.id
      );

      const result = db.reviewSubmission({
        submissionId: submission.data!.id,
        feedback: "Please expand on the second paragraph and fix grammar errors.",
        status: "needs_revision",
      });

      assert.equal(result.error, null);
      assert.ok(result.data);
      assert.equal(result.data.review_status, "needs_revision");
    });

    it("homework returns to in_progress when revision requested", () => {
      const assignment = db.createAssignment(
        { studentId: student.id, title: "Essay assignment" },
        tutor.id
      );

      const submission = db.createSubmission(
        { homeworkId: assignment.data!.id, textResponse: "My essay..." },
        student.id
      );

      db.reviewSubmission({
        submissionId: submission.data!.id,
        feedback: "Needs more work",
        status: "needs_revision",
      });

      const updatedAssignment = db.getAssignment(assignment.data!.id);
      assert.ok(updatedAssignment);
      assert.equal(updatedAssignment.status, "in_progress");
    });

    it("rejects review for non-existent submission", () => {
      const result = db.reviewSubmission({
        submissionId: "nonexistent_id",
        feedback: "Good work",
        status: "reviewed",
      });

      assert.ok(result.error);
      assert.equal(result.error, "Submission not found");
    });
  });

  describe("Full Workflow: assign → submit → review → complete", () => {
    it("complete workflow from assignment to completion", () => {
      // Step 1: Tutor assigns homework
      const assignmentResult = db.createAssignment(
        {
          studentId: student.id,
          title: "Write a 500-word essay on travel",
          instructions: "Describe a memorable trip using past tense verbs",
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          attachments: [{ label: "Rubric", url: "https://example.com/rubric.pdf", type: "pdf" }],
        },
        tutor.id
      );

      assert.ok(assignmentResult.data);
      assert.equal(assignmentResult.data.status, "assigned");

      // Step 2: Student submits their work
      const submissionResult = db.createSubmission(
        {
          homeworkId: assignmentResult.data.id,
          textResponse: "Last summer, I traveled to Barcelona with my family...",
          fileAttachments: [
            { name: "essay.docx", url: "https://storage.example.com/essay.docx", type: "application/docx", size: 15000 },
          ],
        },
        student.id
      );

      assert.ok(submissionResult.data);
      assert.equal(submissionResult.data.review_status, "pending");

      // Verify homework status changed
      const afterSubmit = db.getAssignment(assignmentResult.data.id);
      assert.equal(afterSubmit!.status, "submitted");

      // Step 3: Tutor reviews and provides feedback
      const reviewResult = db.reviewSubmission({
        submissionId: submissionResult.data.id,
        feedback: "Excellent essay! Your verb tenses were perfect and the descriptions were vivid.",
        status: "reviewed",
      });

      assert.ok(reviewResult.data);
      assert.equal(reviewResult.data.review_status, "reviewed");
      assert.ok(reviewResult.data.tutor_feedback);

      // Step 4: Verify homework is completed
      const finalAssignment = db.getAssignment(assignmentResult.data.id);
      assert.equal(finalAssignment!.status, "completed");
      assert.ok(finalAssignment!.completed_at);
    });

    it("workflow with revision request and resubmission", () => {
      // Step 1: Assign homework
      const assignment = db.createAssignment(
        { studentId: student.id, title: "Grammar exercise" },
        tutor.id
      );

      // Step 2: First submission
      const firstSubmission = db.createSubmission(
        { homeworkId: assignment.data!.id, textResponse: "Initial attempt with errors" },
        student.id
      );

      // Step 3: Tutor requests revision
      db.reviewSubmission({
        submissionId: firstSubmission.data!.id,
        feedback: "Please fix the verb tense errors in paragraphs 2 and 3",
        status: "needs_revision",
      });

      // Verify homework is back to in_progress
      let currentAssignment = db.getAssignment(assignment.data!.id);
      assert.equal(currentAssignment!.status, "in_progress");

      // Step 4: Student resubmits
      const secondSubmission = db.createSubmission(
        { homeworkId: assignment.data!.id, textResponse: "Revised attempt with corrections" },
        student.id
      );

      assert.ok(secondSubmission.data);
      currentAssignment = db.getAssignment(assignment.data!.id);
      assert.equal(currentAssignment!.status, "submitted");

      // Step 5: Tutor approves
      db.reviewSubmission({
        submissionId: secondSubmission.data!.id,
        feedback: "Much better! All errors corrected.",
        status: "reviewed",
      });

      // Verify completed
      const finalAssignment = db.getAssignment(assignment.data!.id);
      assert.equal(finalAssignment!.status, "completed");
    });

    it("multiple submissions tracked for same homework", () => {
      const assignment = db.createAssignment(
        { studentId: student.id, title: "Multi-submission assignment" },
        tutor.id
      );

      // First submission
      db.createSubmission(
        { homeworkId: assignment.data!.id, textResponse: "First attempt" },
        student.id
      );

      // Reset to allow resubmission
      db.updateAssignmentStatus(assignment.data!.id, "in_progress");

      // Second submission
      db.createSubmission(
        { homeworkId: assignment.data!.id, textResponse: "Second attempt" },
        student.id
      );

      const submissions = db.getSubmissionsForHomework(assignment.data!.id);
      assert.equal(submissions.length, 2);
      // Most recent first
      assert.equal(submissions[0].text_response, "Second attempt");
      assert.equal(submissions[1].text_response, "First attempt");
    });
  });

  describe("Status Transition Validation", () => {
    it("validates assigned → in_progress transition", () => {
      const assignment = db.createAssignment(
        { studentId: student.id, title: "Test" },
        tutor.id
      );

      const result = db.updateAssignmentStatus(assignment.data!.id, "in_progress");
      assert.equal(result.error, null);
      assert.equal(result.data!.status, "in_progress");
    });

    it("validates assigned → cancelled transition", () => {
      const assignment = db.createAssignment(
        { studentId: student.id, title: "Test" },
        tutor.id
      );

      const result = db.updateAssignmentStatus(assignment.data!.id, "cancelled");
      assert.equal(result.error, null);
      assert.equal(result.data!.status, "cancelled");
    });

    it("rejects invalid transition from completed", () => {
      const assignment = db.createAssignment(
        { studentId: student.id, title: "Test" },
        tutor.id
      );

      db.updateAssignmentStatus(assignment.data!.id, "submitted");
      db.updateAssignmentStatus(assignment.data!.id, "completed");

      // Try to change from completed
      const result = db.updateAssignmentStatus(assignment.data!.id, "assigned");
      assert.ok(result.error);
      assert.match(result.error!, /Cannot transition from completed/);
    });

    it("rejects invalid transition from cancelled", () => {
      const assignment = db.createAssignment(
        { studentId: student.id, title: "Test" },
        tutor.id
      );

      db.updateAssignmentStatus(assignment.data!.id, "cancelled");

      // Try to change from cancelled
      const result = db.updateAssignmentStatus(assignment.data!.id, "assigned");
      assert.ok(result.error);
      assert.match(result.error!, /Cannot transition from cancelled/);
    });
  });

  describe("Edge Cases", () => {
    it("handles empty submission content", () => {
      const assignment = db.createAssignment(
        { studentId: student.id, title: "Test" },
        tutor.id
      );

      // Empty submission (allowed - might just be marking as attempted)
      const result = db.createSubmission(
        { homeworkId: assignment.data!.id },
        student.id
      );

      assert.equal(result.error, null);
      assert.ok(result.data);
      assert.equal(result.data.text_response, null);
      assert.equal(result.data.audio_url, null);
      assert.deepEqual(result.data.file_attachments, []);
    });

    it("handles homework with null due date", () => {
      const result = db.createAssignment(
        {
          studentId: student.id,
          title: "No due date homework",
          dueDate: null,
        },
        tutor.id
      );

      assert.equal(result.error, null);
      assert.ok(result.data);
      assert.equal(result.data.due_date, null);
    });

    it("handles very long text submission", () => {
      const assignment = db.createAssignment(
        { studentId: student.id, title: "Long essay" },
        tutor.id
      );

      const longText = "A".repeat(50000); // 50K characters
      const result = db.createSubmission(
        { homeworkId: assignment.data!.id, textResponse: longText },
        student.id
      );

      assert.equal(result.error, null);
      assert.ok(result.data);
      assert.equal(result.data.text_response!.length, 50000);
    });

    it("handles many file attachments", () => {
      const assignment = db.createAssignment(
        { studentId: student.id, title: "Multi-file submission" },
        tutor.id
      );

      const files: SubmissionFile[] = Array.from({ length: 10 }, (_, i) => ({
        name: `file${i}.pdf`,
        url: `https://storage.example.com/files/file${i}.pdf`,
        type: "application/pdf",
        size: 10000 + i * 1000,
      }));

      const result = db.createSubmission(
        { homeworkId: assignment.data!.id, fileAttachments: files },
        student.id
      );

      assert.equal(result.error, null);
      assert.ok(result.data);
      assert.equal(result.data.file_attachments.length, 10);
    });

    it("preserves student notes on status update", () => {
      const assignment = db.createAssignment(
        { studentId: student.id, title: "Test" },
        tutor.id
      );

      const result = db.updateAssignmentStatus(
        assignment.data!.id,
        "in_progress",
        "I started working on this but have some questions"
      );

      assert.equal(result.error, null);
      assert.ok(result.data);
      assert.equal(result.data.student_notes, "I started working on this but have some questions");
    });
  });

  describe("Utility Function Tests", () => {
    describe("isValidStatusTransition", () => {
      it("allows valid transitions", () => {
        assert.equal(isValidStatusTransition("assigned", "in_progress"), true);
        assert.equal(isValidStatusTransition("assigned", "submitted"), true);
        assert.equal(isValidStatusTransition("assigned", "cancelled"), true);
        assert.equal(isValidStatusTransition("in_progress", "submitted"), true);
        assert.equal(isValidStatusTransition("submitted", "completed"), true);
      });

      it("rejects invalid transitions", () => {
        assert.equal(isValidStatusTransition("assigned", "completed"), false);
        assert.equal(isValidStatusTransition("completed", "assigned"), false);
        assert.equal(isValidStatusTransition("cancelled", "in_progress"), false);
        assert.equal(isValidStatusTransition("in_progress", "assigned"), false);
      });
    });

    describe("normalizeAttachments", () => {
      it("returns empty array for null input", () => {
        const result = normalizeAttachments(null);
        assert.deepEqual(result, []);
      });

      it("returns empty array for undefined input", () => {
        const result = normalizeAttachments(undefined);
        assert.deepEqual(result, []);
      });

      it("filters out items without URLs", () => {
        const result = normalizeAttachments([
          { label: "Valid", url: "https://example.com/file.pdf" },
          { label: "Invalid", url: "" },
        ]);
        assert.equal(result.length, 1);
        assert.equal(result[0].label, "Valid");
      });

      it("sets default label for empty labels", () => {
        const result = normalizeAttachments([
          { label: "", url: "https://example.com/file.pdf" },
        ]);
        assert.equal(result[0].label, "Resource");
      });

      it("sets default type to link", () => {
        const result = normalizeAttachments([
          { label: "Test", url: "https://example.com/file.pdf" },
        ]);
        assert.equal(result[0].type, "link");
      });

      it("preserves explicit type", () => {
        const result = normalizeAttachments([
          { label: "Test", url: "https://example.com/file.pdf", type: "pdf" },
        ]);
        assert.equal(result[0].type, "pdf");
      });
    });

    describe("validateAssignHomeworkInput", () => {
      it("validates required title", () => {
        const result = validateAssignHomeworkInput({
          studentId: "student_123",
          title: "",
        });
        assert.equal(result.valid, false);
        assert.equal(result.error, "Homework title is required.");
      });

      it("validates status", () => {
        const result = validateAssignHomeworkInput({
          studentId: "student_123",
          title: "Test",
          status: "invalid" as HomeworkStatus,
        });
        assert.equal(result.valid, false);
        assert.equal(result.error, "Invalid homework status.");
      });

      it("passes valid input", () => {
        const result = validateAssignHomeworkInput({
          studentId: "student_123",
          title: "Valid homework",
          status: "assigned",
        });
        assert.equal(result.valid, true);
        assert.equal(result.error, undefined);
      });
    });

    describe("canAcceptSubmission", () => {
      it("allows submission for assigned homework", () => {
        const homework = { status: "assigned" } as HomeworkAssignment;
        const result = canAcceptSubmission(homework);
        assert.equal(result.canSubmit, true);
      });

      it("allows submission for in_progress homework", () => {
        const homework = { status: "in_progress" } as HomeworkAssignment;
        const result = canAcceptSubmission(homework);
        assert.equal(result.canSubmit, true);
      });

      it("rejects submission for completed homework", () => {
        const homework = { status: "completed" } as HomeworkAssignment;
        const result = canAcceptSubmission(homework);
        assert.equal(result.canSubmit, false);
        assert.ok(result.error);
      });

      it("rejects submission for cancelled homework", () => {
        const homework = { status: "cancelled" } as HomeworkAssignment;
        const result = canAcceptSubmission(homework);
        assert.equal(result.canSubmit, false);
        assert.ok(result.error);
      });
    });

    describe("shouldCompleteHomework", () => {
      it("returns true for reviewed status", () => {
        assert.equal(shouldCompleteHomework("reviewed"), true);
      });

      it("returns false for needs_revision status", () => {
        assert.equal(shouldCompleteHomework("needs_revision"), false);
      });
    });
  });
});

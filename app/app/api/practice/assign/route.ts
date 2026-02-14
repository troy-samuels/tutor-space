import { randomUUID } from "node:crypto";
import { z } from "zod";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { errorResponse } from "@/lib/api/error-responses";
import { generatePracticeDeepLink } from "@/lib/practice/deep-links";
import { sendEmail } from "@/lib/email/send";

type StudentRow = {
  id: string;
  tutor_id: string;
  user_id: string | null;
  email: string | null;
  full_name: string | null;
};

type TutorProfileRow = {
  id: string;
  username: string | null;
  full_name: string | null;
};

type AssignmentRow = {
  id: string;
  title: string | null;
  instructions: string | null;
  status: "assigned" | "in_progress" | "completed";
  due_date: string | null;
  sessions_completed: number;
  created_at: string;
  scenario: {
    id: string;
    title: string | null;
    language: string | null;
    level: string | null;
    topic: string | null;
  } | null;
};

const ASSIGN_REQUEST_SCHEMA = z
  .object({
    studentId: z.string().uuid(),
    title: z.string().trim().max(140).optional(),
    instructions: z.string().trim().max(2000).nullable().optional(),
    scenarioId: z.string().uuid().nullable().optional(),
    dueDate: z.string().datetime().nullable().optional(),
    homeworkAssignmentId: z.string().uuid().nullable().optional(),
    topic: z.string().trim().max(120).optional(),
    language: z.string().trim().max(60).optional(),
    level: z.string().trim().max(60).optional(),
    grammarFocus: z.array(z.string().trim().min(1).max(80)).max(12).optional(),
    vocabularyFocus: z.array(z.string().trim().min(1).max(80)).max(20).optional(),
    messageToStudent: z.string().trim().max(600).nullable().optional(),
  })
  .strict();

/**
 * Parses JSON request body without throwing.
 *
 * @param request - Incoming request.
 * @returns Parsed JSON payload.
 */
async function safeParseJson(request: Request): Promise<{ success: true; data: unknown } | { success: false }> {
  try {
    const data = await request.json();
    return { success: true, data };
  } catch {
    return { success: false };
  }
}

/**
 * Builds a default title when explicit title is omitted.
 *
 * @param topic - Practice topic.
 * @returns Human-friendly assignment title.
 */
function buildAssignmentTitle(topic: string | undefined): string {
  const normalizedTopic = topic?.trim();
  if (!normalizedTopic) {
    return "Practice Assignment";
  }
  return `Practice: ${normalizedTopic}`;
}

/**
 * Builds a lightweight email HTML body for a new practice assignment.
 *
 * @param params - Email template values.
 * @returns HTML email body.
 */
function buildPracticeAssignmentEmailHtml(params: {
  tutorName: string;
  studentName: string;
  topic: string;
  messageToStudent?: string | null;
  deepLink: string;
}): string {
  const safeMessage = params.messageToStudent
    ? `<p style="margin:0 0 16px 0;color:#444;">${params.messageToStudent}</p>`
    : "";

  return `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#f7f7f6;padding:24px;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:14px;padding:24px;border:1px solid #ececec;">
        <p style="margin:0 0 12px 0;color:#111;font-size:18px;font-weight:700;">
          ${params.tutorName} wants you to practice ${params.topic}.
        </p>
        <p style="margin:0 0 16px 0;color:#444;">
          Hi ${params.studentName}, your new TutorLingua practice session is ready.
        </p>
        ${safeMessage}
        <a href="${params.deepLink}" style="display:inline-block;background:#E8784D;color:#111;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:700;">
          Tap to start practice
        </a>
      </div>
    </div>
  `;
}

/**
 * Builds a plaintext version of the assignment email.
 *
 * @param params - Email template values.
 * @returns Text email body.
 */
function buildPracticeAssignmentEmailText(params: {
  tutorName: string;
  studentName: string;
  topic: string;
  messageToStudent?: string | null;
  deepLink: string;
}): string {
  return [
    `${params.tutorName} wants you to practice ${params.topic}.`,
    "",
    `Hi ${params.studentName}, your new TutorLingua practice session is ready.`,
    params.messageToStudent ? "" : null,
    params.messageToStudent || null,
    "",
    `Tap to start: ${params.deepLink}`,
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n");
}

/**
 * Sends assignment notifications (email + in-app) without failing the assignment mutation.
 *
 * @param params - Notification payload.
 */
async function notifyStudentAssignment(params: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  student: StudentRow;
  tutorProfile: TutorProfileRow;
  assignmentTitle: string;
  topic: string;
  deepLink: string;
  messageToStudent?: string | null;
}): Promise<void> {
  const tutorName = params.tutorProfile.full_name || params.tutorProfile.username || "Your tutor";
  const studentName = params.student.full_name || "there";

  if (params.student.email) {
    await sendEmail({
      to: params.student.email,
      subject: `${tutorName} wants you to practice ${params.topic}`,
      html: buildPracticeAssignmentEmailHtml({
        tutorName,
        studentName,
        topic: params.topic,
        messageToStudent: params.messageToStudent,
        deepLink: params.deepLink,
      }),
      text: buildPracticeAssignmentEmailText({
        tutorName,
        studentName,
        topic: params.topic,
        messageToStudent: params.messageToStudent,
        deepLink: params.deepLink,
      }),
      category: "transactional.practice_assigned",
      metadata: {
        assignmentTitle: params.assignmentTitle,
      },
    });
  }

  if (!params.student.user_id) {
    return;
  }

  await params.supabase.from("notifications").insert({
    user_id: params.student.user_id,
    user_role: "student",
    type: "homework_assigned",
    title: "New practice assigned",
    body: `${tutorName} assigned "${params.assignmentTitle}".`,
    link: params.deepLink,
    icon: "Bot",
    metadata: {
      topic: params.topic,
    },
  });

  const { data: pushSubscriptions, error: pushSubscriptionError } = await params.supabase
    .from("push_subscriptions")
    .select("id")
    .eq("user_id", params.student.user_id)
    .limit(1);

  if (pushSubscriptionError || !pushSubscriptions || pushSubscriptions.length === 0) {
    return;
  }

  await params.supabase
    .from("push_notification_queue")
    .insert({
      user_id: params.student.user_id,
      title: "New practice assigned",
      body: `${tutorName} assigned ${params.topic}.`,
      data: {
        url: params.deepLink,
      },
    })
    .throwOnError();
}

/**
 * Assigns one-tap practice to a student and returns the shareable deep link.
 *
 * Compatible with existing assignment payloads while supporting topic/grammar/vocabulary
 * fields from the Sprint 2 one-tap modal.
 */
export async function POST(request: Request) {
  const requestId = randomUUID();
  const respondError = (message: string, status: number, code: string, details?: Record<string, unknown>) =>
    errorResponse(message, {
      status,
      code,
      details,
      extra: { requestId },
    });

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return respondError("Unauthorized", 401, "unauthorized");
    }

    const parsedJson = await safeParseJson(request);
    if (!parsedJson.success) {
      return respondError("Invalid JSON body", 400, "invalid_request");
    }

    const parsedBody = ASSIGN_REQUEST_SCHEMA.safeParse(parsedJson.data);
    if (!parsedBody.success) {
      return respondError("Invalid request payload", 400, "invalid_request", {
        validation: parsedBody.error.flatten(),
      });
    }

    const payload = parsedBody.data;
    const normalizedTitle = payload.title?.trim();
    const topic = payload.topic?.trim() || "Conversation Practice";
    const assignmentTitle = normalizedTitle && normalizedTitle.length > 0 ? normalizedTitle : buildAssignmentTitle(topic);

    const { data: studentData, error: studentError } = await supabase
      .from("students")
      .select("id, tutor_id, user_id, email, full_name")
      .eq("id", payload.studentId)
      .eq("tutor_id", user.id)
      .single();

    if (studentError || !studentData) {
      return respondError("Student not found", 404, "not_found");
    }

    const student = studentData as StudentRow;

    const { data: tutorProfileData } = await supabase
      .from("profiles")
      .select("id, username, full_name")
      .eq("id", user.id)
      .limit(1)
      .maybeSingle();

    const tutorProfile = (tutorProfileData || {
      id: user.id,
      username: null,
      full_name: null,
    }) as TutorProfileRow;

    if (payload.scenarioId) {
      const { data: scenario, error: scenarioError } = await supabase
        .from("practice_scenarios")
        .select("id")
        .eq("id", payload.scenarioId)
        .eq("tutor_id", user.id)
        .single();

      if (scenarioError || !scenario) {
        return respondError("Scenario not found", 404, "not_found");
      }
    }

    if (payload.homeworkAssignmentId) {
      const { data: homework, error: homeworkError } = await supabase
        .from("homework_assignments")
        .select("id, practice_assignment_id")
        .eq("id", payload.homeworkAssignmentId)
        .eq("tutor_id", user.id)
        .eq("student_id", payload.studentId)
        .single();

      if (homeworkError || !homework) {
        return respondError("Homework assignment not found", 404, "not_found");
      }

      if (homework.practice_assignment_id) {
        return respondError("This homework already has a practice assignment linked", 409, "conflict");
      }
    }

    let scenarioId = payload.scenarioId ?? null;
    if (!scenarioId) {
      const { data: scenarioData, error: scenarioInsertError } = await supabase
        .from("practice_scenarios")
        .insert({
          tutor_id: user.id,
          title: topic,
          description: payload.messageToStudent || payload.instructions || null,
          language: payload.language || "Spanish",
          level: payload.level || "Intermediate",
          topic,
          vocabulary_focus: payload.vocabularyFocus ?? [],
          grammar_focus: payload.grammarFocus ?? [],
          max_messages: 20,
          is_active: true,
          system_prompt: "You are a supportive language tutor helping a student practise this scenario.",
        })
        .select("id")
        .single();

      if (scenarioInsertError || !scenarioData) {
        return respondError("Failed to create scenario", 500, "internal_error");
      }

      scenarioId = scenarioData.id;
    }

    const { data: assignmentData, error: assignmentError } = await supabase
      .from("practice_assignments")
      .insert({
        tutor_id: user.id,
        student_id: payload.studentId,
        scenario_id: scenarioId,
        homework_assignment_id: payload.homeworkAssignmentId || null,
        title: assignmentTitle,
        instructions: payload.instructions || payload.messageToStudent || null,
        due_date: payload.dueDate || null,
        status: "assigned",
      })
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
      .single();

    if (assignmentError || !assignmentData) {
      return respondError("Failed to create assignment", 500, "internal_error");
    }

    if (payload.homeworkAssignmentId) {
      const { error: linkHomeworkError } = await supabase
        .from("homework_assignments")
        .update({ practice_assignment_id: assignmentData.id })
        .eq("id", payload.homeworkAssignmentId);

      if (linkHomeworkError) {
        console.error("[Assign Practice] Failed to link homework assignment:", linkHomeworkError);
      }
    }

    const tutorUsername = tutorProfile.username?.trim() || user.id;
    const deepLink = generatePracticeDeepLink({
      assignmentId: assignmentData.id,
      tutorUsername,
      studentName: student.full_name || undefined,
    });

    try {
      await notifyStudentAssignment({
        supabase,
        student,
        tutorProfile,
        assignmentTitle,
        topic,
        deepLink,
        messageToStudent: payload.messageToStudent,
      });
    } catch (notificationError) {
      console.error("[Assign Practice] Notification dispatch failed:", notificationError);
    }

    return NextResponse.json({
      success: true,
      assignment: assignmentData as unknown as AssignmentRow,
      deepLink,
      requestId,
    });
  } catch (error) {
    console.error("[Assign Practice] Unexpected failure:", error);
    return errorResponse("Failed to assign practice", {
      status: 500,
      code: "internal_error",
      extra: { requestId },
    });
  }
}

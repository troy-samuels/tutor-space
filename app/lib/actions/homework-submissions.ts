"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export type SubmissionFile = {
  name: string;
  url: string;
  type: string;
  size: number;
};

export type HomeworkSubmission = {
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
};

/**
 * Submit homework as a student
 * Creates a submission record and updates homework status
 */
export async function submitHomework(params: {
  homeworkId: string;
  textResponse?: string;
  audioUrl?: string;
  fileAttachments?: SubmissionFile[];
}): Promise<{ data: HomeworkSubmission | null; error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "You must be signed in to submit homework" };
  }

  // Find the student record for this user
  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!student) {
    return { data: null, error: "Student record not found" };
  }

  // Verify the homework assignment exists and belongs to this student
  const adminClient = createServiceRoleClient();
  if (!adminClient) {
    return { data: null, error: "Service unavailable" };
  }

  const { data: homework } = await adminClient
    .from("homework_assignments")
    .select("id, student_id, status")
    .eq("id", params.homeworkId)
    .single();

  if (!homework) {
    return { data: null, error: "Homework assignment not found" };
  }

  if (homework.student_id !== student.id) {
    return { data: null, error: "This homework is not assigned to you" };
  }

  if (homework.status === "completed" || homework.status === "cancelled") {
    return { data: null, error: "This homework cannot accept submissions" };
  }

  // Create submission
  const { data, error } = await adminClient
    .from("homework_submissions")
    .insert({
      homework_id: params.homeworkId,
      student_id: student.id,
      text_response: params.textResponse || null,
      audio_url: params.audioUrl || null,
      file_attachments: params.fileAttachments || [],
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to create submission:", error);
    return { data: null, error: "Failed to submit homework" };
  }

  // Send notification to tutor
  try {
    // Fetch the homework details to get the tutor_id and title
    const { data: homeworkData } = await adminClient
      .from("homework_assignments")
      .select("tutor_id, title")
      .eq("id", params.homeworkId)
      .single();

    // Fetch student name
    const { data: studentData } = await adminClient
      .from("students")
      .select("first_name, last_name")
      .eq("id", student.id)
      .single();

    if (homeworkData?.tutor_id && studentData) {
      const studentName = [studentData.first_name, studentData.last_name].filter(Boolean).join(" ") || "Student";
      const { notifyHomeworkSubmissionReceived } = await import("@/lib/actions/notifications");
      await notifyHomeworkSubmissionReceived({
        tutorId: homeworkData.tutor_id,
        studentName,
        homeworkId: params.homeworkId,
        homeworkTitle: homeworkData.title,
        studentId: student.id,
      });
    }
  } catch (notificationError) {
    // Don't fail the submission if notification fails
    console.error("Failed to send submission notification:", notificationError);
  }

  return { data: data as HomeworkSubmission, error: null };
}

/**
 * Get submissions for a homework assignment
 * Available to both tutors (for their students) and students (for their own)
 */
export async function getHomeworkSubmissions(
  homeworkId: string
): Promise<{ data: HomeworkSubmission[]; error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: [], error: "You must be signed in" };
  }

  const { data, error } = await supabase
    .from("homework_submissions")
    .select("*")
    .eq("homework_id", homeworkId)
    .order("submitted_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch submissions:", error);
    return { data: [], error: "Failed to fetch submissions" };
  }

  return { data: (data as HomeworkSubmission[]) || [], error: null };
}

/**
 * Review a homework submission (tutor only)
 * Updates feedback and review status
 */
export async function reviewSubmission(params: {
  submissionId: string;
  feedback: string;
  status: "reviewed" | "needs_revision";
}): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in" };
  }

  // Verify tutor owns the homework assignment
  const { data: submission } = await supabase
    .from("homework_submissions")
    .select(`
      id,
      homework_id,
      homework_assignments!inner (
        tutor_id
      )
    `)
    .eq("id", params.submissionId)
    .single();

  if (!submission) {
    return { error: "Submission not found" };
  }

  const homeworkAssignment = submission.homework_assignments as unknown as { tutor_id: string };
  if (homeworkAssignment.tutor_id !== user.id) {
    return { error: "You can only review submissions for your students" };
  }

  // Update submission
  const { error } = await supabase
    .from("homework_submissions")
    .update({
      tutor_feedback: params.feedback,
      review_status: params.status,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", params.submissionId);

  if (error) {
    console.error("Failed to review submission:", error);
    return { error: "Failed to save review" };
  }

  // If reviewed (not needs_revision), mark homework as completed
  if (params.status === "reviewed") {
    const adminClient = createServiceRoleClient();
    if (adminClient) {
      await adminClient
        .from("homework_assignments")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", submission.homework_id);
    }
  }

  return { error: null };
}

/**
 * Upload a submission file to Supabase Storage
 * Returns the public URL for the file
 */
export async function uploadSubmissionFile(
  formData: FormData
): Promise<{ url: string | null; error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { url: null, error: "You must be signed in" };
  }

  const file = formData.get("file") as File;
  if (!file) {
    return { url: null, error: "No file provided" };
  }

  // Validate file size (max 50MB)
  if (file.size > 50 * 1024 * 1024) {
    return { url: null, error: "File size must be under 50MB" };
  }

  // Generate unique filename
  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const filePath = `${user.id}/${timestamp}_${sanitizedName}`;

  const { data, error } = await supabase.storage
    .from("homework-submissions")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("Failed to upload file:", error);
    return { url: null, error: "Failed to upload file" };
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from("homework-submissions")
    .getPublicUrl(data.path);

  return { url: urlData.publicUrl, error: null };
}

/**
 * Upload audio instruction for homework assignment (tutor only)
 * Returns the public URL for the audio file
 */
export async function uploadHomeworkInstructionAudio(
  formData: FormData
): Promise<{ url: string | null; error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { url: null, error: "You must be signed in" };
  }

  const file = formData.get("file") as File;
  if (!file) {
    return { url: null, error: "No audio file provided" };
  }

  // Validate file size (max 20MB - plenty for 2 minutes of audio)
  if (file.size > 20 * 1024 * 1024) {
    return { url: null, error: "Audio file must be under 20MB" };
  }

  // Generate unique filename
  const timestamp = Date.now();
  const extension = file.type === "audio/webm" ? "webm" : file.type === "audio/mp4" ? "mp4" : "audio";
  const filePath = `${user.id}/instructions/${timestamp}_instruction.${extension}`;

  const { data, error } = await supabase.storage
    .from("homework-submissions")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("[Homework] Failed to upload audio instruction:", error);
    return { url: null, error: "Failed to upload audio" };
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from("homework-submissions")
    .getPublicUrl(data.path);

  return { url: urlData.publicUrl, error: null };
}

/**
 * Get a submission by ID with full details
 */
export async function getSubmission(
  submissionId: string
): Promise<{ data: HomeworkSubmission | null; error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "You must be signed in" };
  }

  const { data, error } = await supabase
    .from("homework_submissions")
    .select("*")
    .eq("id", submissionId)
    .single();

  if (error) {
    console.error("Failed to fetch submission:", error);
    return { data: null, error: "Submission not found" };
  }

  return { data: data as HomeworkSubmission, error: null };
}

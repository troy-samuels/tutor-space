"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ConversationThread = {
  id: string;
  student_id: string;
  tutor_id: string;
  last_message_preview: string | null;
  last_message_at: string | null;
  tutor_unread: boolean;
  student_unread: boolean;
  students: {
    full_name: string | null;
    email: string | null;
    status: string | null;
  } | null;
  profiles: {
    full_name: string | null;
  } | null;
};

export type MessageAttachment = {
  type: "audio";
  url: string;
  duration_seconds: number;
  mime_type: string;
};

export type ConversationMessage = {
  id: string;
  thread_id: string;
  sender_role: "tutor" | "student" | "system";
  body: string;
  attachments?: MessageAttachment[];
  created_at: string;
};

const sendMessageSchema = z.object({
  thread_id: z.string().uuid(),
  body: z.string().min(1, "Message cannot be empty"),
});

export type MessagingActionState = {
  error?: string;
  success?: string;
};

export async function getUnreadMessageCount(): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return 0;
  }

  const { count } = await supabase
    .from("conversation_threads")
    .select("*", { count: "exact", head: true })
    .eq("tutor_id", user.id)
    .eq("tutor_unread", true);

  return count ?? 0;
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

  const { data: thread, error: threadError } = await supabase
    .from("conversation_threads")
    .select(
      `
      id,
      tutor_id,
      student_id,
      students (
        id,
        full_name,
        user_id
      )
    `
    )
    .eq("id", parsed.data.thread_id)
    .single();

  if (threadError || !thread) {
    return { error: "Conversation not found." };
  }

  let senderRole: "tutor" | "student";

  const student = Array.isArray(thread.students) ? thread.students[0] : thread.students;

  if (thread.tutor_id === user.id) {
    senderRole = "tutor";
  } else if (student?.user_id === user.id) {
    senderRole = "student";
  } else {
    return { error: "You don’t have access to this conversation." };
  }

  const now = new Date().toISOString();

  const { error: insertError } = await supabase.from("conversation_messages").insert({
    thread_id: thread.id,
    tutor_id: thread.tutor_id,
    student_id: thread.student_id,
    sender_role: senderRole,
    body: parsed.data.body,
    read_by_tutor: senderRole === "tutor",
    read_by_student: senderRole === "student",
  });

  if (insertError) {
    console.error("[Messaging] Failed to send message", insertError);
    return { error: "Failed to send message. Try again." };
  }

  await supabase
    .from("conversation_threads")
    .update({
      last_message_preview: parsed.data.body.slice(0, 160),
      last_message_at: now,
      tutor_unread: senderRole === "student",
      student_unread: senderRole === "tutor",
    })
    .eq("id", thread.id);

  // Send in-app notification to recipient
  try {
    const { notifyNewMessage } = await import("@/lib/actions/notifications");

    if (senderRole === "tutor") {
      // Tutor sent message → notify student (if they have an account)
      if (student?.user_id) {
        // Get tutor name
        const { data: tutorProfile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", thread.tutor_id)
          .single();

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

  // Check for existing thread
  const { data: existingThread } = await supabase
    .from("conversation_threads")
    .select("id")
    .eq("tutor_id", user.id)
    .eq("student_id", studentId)
    .single();

  if (existingThread) {
    return { threadId: existingThread.id };
  }

  // Create new thread
  const { data: newThread, error: createError } = await supabase
    .from("conversation_threads")
    .insert({
      tutor_id: user.id,
      student_id: studentId,
    })
    .select("id")
    .single();

  if (createError) {
    console.error("[Messaging] Failed to create thread", createError);
    return { threadId: null, error: "Failed to create conversation" };
  }

  return { threadId: newThread.id };
}

/**
 * Upload audio for a message to Supabase Storage
 * Returns the public URL for the audio file
 */
export async function uploadMessageAudio(
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
  const filePath = `${user.id}/${timestamp}_voice_message.${extension}`;

  const { data, error } = await supabase.storage
    .from("message-attachments")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("[Messaging] Failed to upload audio:", error);
    return { url: null, error: "Failed to upload audio" };
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from("message-attachments")
    .getPublicUrl(data.path);

  return { url: urlData.publicUrl, error: null };
}

/**
 * Send a message with optional audio attachment
 * Supports text-only, audio-only, or both
 */
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

  const { data: thread, error: threadError } = await supabase
    .from("conversation_threads")
    .select(
      `
      id,
      tutor_id,
      student_id,
      students (
        id,
        full_name,
        user_id
      )
    `
    )
    .eq("id", threadId)
    .single();

  if (threadError || !thread) {
    return { error: "Conversation not found." };
  }

  let senderRole: "tutor" | "student";

  const student = Array.isArray(thread.students) ? thread.students[0] : thread.students;

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

  const { error: insertError } = await supabase.from("conversation_messages").insert({
    thread_id: thread.id,
    tutor_id: thread.tutor_id,
    student_id: thread.student_id,
    sender_role: senderRole,
    body: messageBody,
    attachments: attachments || [],
    read_by_tutor: senderRole === "tutor",
    read_by_student: senderRole === "student",
  });

  if (insertError) {
    console.error("[Messaging] Failed to send message", insertError);
    return { error: "Failed to send message. Try again." };
  }

  await supabase
    .from("conversation_threads")
    .update({
      last_message_preview: previewText.slice(0, 160),
      last_message_at: now,
      tutor_unread: senderRole === "student",
      student_unread: senderRole === "tutor",
    })
    .eq("id", thread.id);

  // Send in-app notification to recipient
  try {
    const { notifyNewMessage } = await import("@/lib/actions/notifications");

    if (senderRole === "tutor") {
      // Tutor sent message → notify student (if they have an account)
      if (student?.user_id) {
        // Get tutor name
        const { data: tutorProfile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", thread.tutor_id)
          .single();

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

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
  unread_for_tutor: boolean;
  unread_for_student: boolean;
  students: {
    full_name: string | null;
    email: string | null;
    status: string | null;
  } | null;
  profiles: {
    full_name: string | null;
  } | null;
};

export type ConversationMessage = {
  id: string;
  thread_id: string;
  sender_role: "tutor" | "student" | "system";
  body: string;
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
    .eq("unread_for_tutor", true);

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
      unread_for_tutor: senderRole === "student",
      unread_for_student: senderRole === "tutor",
    })
    .eq("id", thread.id);

  if (senderRole === "tutor") {
    revalidatePath("/messages");
  } else {
    revalidatePath("/student-auth/messages");
  }

  return { success: "Sent" };
}

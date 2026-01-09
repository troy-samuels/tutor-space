import type { SupabaseClient } from "@supabase/supabase-js";

// ============================================================================
// Types
// ============================================================================

type ThreadBase = {
  id: string;
  tutor_id: string;
  student_id: string;
  last_message_preview: string | null;
  last_message_at: string | null;
};

export interface MessageAttachment {
  type: "audio";
  url: string;
  duration_seconds: number;
  mime_type: string;
}

export interface ThreadWithLastMessage extends ThreadBase {
  tutor_unread: boolean;
  student_unread: boolean;
  students: {
    full_name: string | null;
    email: string | null;
    status: string | null;
  } | null;
}

export interface ThreadWithTutor extends ThreadBase {
  student_unread: boolean;
  profiles: {
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
}

// ============================================================================
// Thread Queries
// ============================================================================

export async function countUnreadThreadsForTutor(client: SupabaseClient, tutorId: string) {
  return client
    .from("conversation_threads")
    .select("id", { count: "exact", head: true })
    .eq("tutor_id", tutorId)
    .eq("tutor_unread", true)
    .is("deleted_at", null);
}

export async function countUnreadThreadsForStudentIds(
  client: SupabaseClient,
  studentIds: string[]
) {
  return client
    .from("conversation_threads")
    .select("id", { count: "exact", head: true })
    .in("student_id", studentIds)
    .eq("student_unread", true)
    .is("deleted_at", null);
}

export async function listThreadsForTutor(client: SupabaseClient, tutorId: string) {
  return client
    .from("conversation_threads")
    .select(
      `
      id,
      tutor_id,
      student_id,
      last_message_preview,
      last_message_at,
      tutor_unread,
      students (
        full_name,
        email,
        status
      )
    `
    )
    .eq("tutor_id", tutorId)
    .is("deleted_at", null)
    .order("last_message_at", { ascending: false });
}

export async function listThreadsForStudentIds(client: SupabaseClient, studentIds: string[]) {
  return client
    .from("conversation_threads")
    .select(
      `
      id,
      tutor_id,
      student_id,
      last_message_preview,
      last_message_at,
      student_unread,
      profiles:tutor_id (
        full_name,
        username,
        avatar_url
      )
    `
    )
    .in("student_id", studentIds)
    .is("deleted_at", null)
    .order("last_message_at", { ascending: false });
}

/**
 * Performance-optimized single query for thread listing with last message.
 * Uses denormalized last_message_preview + last_message_at for efficiency.
 * Single query with join - no N+1 queries.
 */
export async function getThreadsWithLastMessage(
  client: SupabaseClient,
  tutorId: string,
  options?: { limit?: number }
): Promise<{ data: ThreadWithLastMessage[] | null; error: Error | null }> {
  let query = client
    .from("conversation_threads")
    .select(
      `
      id,
      tutor_id,
      student_id,
      last_message_preview,
      last_message_at,
      tutor_unread,
      student_unread,
      students (
        full_name,
        email,
        status
      )
    `
    )
    .eq("tutor_id", tutorId)
    .is("deleted_at", null)
    .order("last_message_at", { ascending: false, nullsFirst: false });

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  return { data: data as ThreadWithLastMessage[] | null, error };
}

export async function getThreadByIdWithStudent(client: SupabaseClient, threadId: string) {
  return client
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
    .is("deleted_at", null)
    .single();
}

export async function getThreadByTutorStudent(
  client: SupabaseClient,
  tutorId: string,
  studentId: string
) {
  return client
    .from("conversation_threads")
    .select("id")
    .eq("tutor_id", tutorId)
    .eq("student_id", studentId)
    .is("deleted_at", null)
    .single();
}

export async function createThread(
  client: SupabaseClient,
  input: {
    tutorId: string;
    studentId: string;
    lastMessagePreview?: string | null;
    lastMessageAt?: string | null;
    tutorUnread?: boolean;
    studentUnread?: boolean;
  }
) {
  return client
    .from("conversation_threads")
    .insert({
      tutor_id: input.tutorId,
      student_id: input.studentId,
      last_message_preview: input.lastMessagePreview ?? null,
      last_message_at: input.lastMessageAt ?? null,
      tutor_unread: input.tutorUnread ?? false,
      student_unread: input.studentUnread ?? false,
      deleted_at: null,
    })
    .select("id")
    .single();
}

export async function upsertThread(
  client: SupabaseClient,
  input: {
    tutorId: string;
    studentId: string;
    lastMessagePreview?: string | null;
    lastMessageAt?: string | null;
    tutorUnread?: boolean;
    studentUnread?: boolean;
  },
  options?: { ignoreDuplicates?: boolean }
) {
  const payload: Record<string, unknown> = {
    tutor_id: input.tutorId,
    student_id: input.studentId,
    deleted_at: null,
  };

  if (input.lastMessagePreview !== undefined) {
    payload.last_message_preview = input.lastMessagePreview;
  }

  if (input.lastMessageAt !== undefined) {
    payload.last_message_at = input.lastMessageAt;
  }

  if (input.tutorUnread !== undefined) {
    payload.tutor_unread = input.tutorUnread;
  }

  if (input.studentUnread !== undefined) {
    payload.student_unread = input.studentUnread;
  }

  return client.from("conversation_threads").upsert(payload, {
    onConflict: "tutor_id,student_id",
    ignoreDuplicates: options?.ignoreDuplicates,
  });
}

export async function updateThreadPreview(
  client: SupabaseClient,
  threadId: string,
  input: {
    lastMessagePreview?: string | null;
    lastMessageAt?: string | null;
    tutorUnread?: boolean;
    studentUnread?: boolean;
  }
) {
  return client
    .from("conversation_threads")
    .update({
      last_message_preview: input.lastMessagePreview ?? null,
      last_message_at: input.lastMessageAt ?? null,
      tutor_unread: input.tutorUnread,
      student_unread: input.studentUnread,
    })
    .eq("id", threadId)
    .is("deleted_at", null);
}

export async function markThreadReadByTutor(client: SupabaseClient, threadId: string) {
  return client
    .from("conversation_threads")
    .update({ tutor_unread: false })
    .eq("id", threadId)
    .is("deleted_at", null);
}

export async function markThreadReadByStudent(client: SupabaseClient, threadId: string) {
  return client
    .from("conversation_threads")
    .update({ student_unread: false })
    .eq("id", threadId)
    .is("deleted_at", null);
}

// ============================================================================
// Message Queries
// ============================================================================

export async function listMessagesForThread(client: SupabaseClient, threadId: string) {
  return client
    .from("conversation_messages")
    .select("id, thread_id, sender_role, body, attachments, created_at")
    .eq("thread_id", threadId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });
}

export async function insertMessage(
  client: SupabaseClient,
  input: {
    threadId: string;
    tutorId: string;
    studentId: string;
    senderRole: "tutor" | "student" | "system";
    body: string;
    attachments?: unknown[];
    readByTutor: boolean;
    readByStudent: boolean;
  }
) {
  return client.from("conversation_messages").insert({
    thread_id: input.threadId,
    tutor_id: input.tutorId,
    student_id: input.studentId,
    sender_role: input.senderRole,
    body: input.body,
    attachments: input.attachments ?? [],
    read_by_tutor: input.readByTutor,
    read_by_student: input.readByStudent,
    deleted_at: null,
  }).select("id").single();
}

export async function markMessagesReadByTutor(client: SupabaseClient, threadId: string) {
  return client
    .from("conversation_messages")
    .update({ read_by_tutor: true })
    .eq("thread_id", threadId)
    .eq("read_by_tutor", false)
    .is("deleted_at", null);
}

export async function markMessagesReadByStudent(client: SupabaseClient, threadId: string) {
  return client
    .from("conversation_messages")
    .update({ read_by_student: true })
    .eq("thread_id", threadId)
    .eq("read_by_student", false)
    .is("deleted_at", null);
}

export async function countMessagesBySenderId(client: SupabaseClient, senderId: string) {
  return client
    .from("conversation_messages")
    .select("*", { count: "exact", head: true })
    .eq("sender_id", senderId)
    .is("deleted_at", null);
}

// ============================================================================
// Supporting Queries
// ============================================================================

export async function listStudentIdsForUser(client: SupabaseClient, userId: string) {
  return client
    .from("students")
    .select("id")
    .eq("user_id", userId)
    .is("deleted_at", null);
}

export async function listStudentsForUser(client: SupabaseClient, userId: string) {
  return client
    .from("students")
    .select("id, full_name, tutor_id, connection_status")
    .eq("user_id", userId)
    .is("deleted_at", null);
}

export async function getTutorProfileAvatar(client: SupabaseClient, tutorId: string) {
  return client.from("profiles").select("avatar_url").eq("id", tutorId).single();
}

export async function getTutorProfileName(client: SupabaseClient, tutorId: string) {
  return client.from("profiles").select("full_name").eq("id", tutorId).single();
}

export async function listUnreadThreadsForTutorDigest(client: SupabaseClient) {
  return client
    .from("conversation_threads")
    .select(
      `
      id,
      tutor_id,
      student_id,
      last_message_preview,
      last_message_at,
      tutor_unread,
      students(full_name, email),
      profiles!conversation_threads_tutor_id_fkey(full_name, email)
    `
    )
    .eq("tutor_unread", true)
    .is("deleted_at", null);
}

export async function listUnreadThreadsForStudentDigest(client: SupabaseClient) {
  return client
    .from("conversation_threads")
    .select(
      `
      id,
      tutor_id,
      student_id,
      last_message_preview,
      last_message_at,
      student_unread,
      students(id, full_name, email),
      tutor:profiles!conversation_threads_tutor_id_fkey(full_name, email)
    `
    )
    .eq("student_unread", true)
    .is("deleted_at", null);
}

// ============================================================================
// Student Messaging Context (for student portal)
// ============================================================================

export type ConnectionStatus = "pending" | "approved" | "rejected";

export interface StudentMessagingConnection {
  id: string;
  tutor_id: string;
  status: ConnectionStatus;
  profiles: {
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
}

export interface StudentRecord {
  id: string;
  tutor_id: string;
  full_name: string | null;
  connection_status: string | null;
}

export interface StudentMessagingContext {
  connections: StudentMessagingConnection[];
  studentRecords: StudentRecord[];
}

/**
 * Fetches unified messaging context for a student user.
 * Queries both student_tutor_connections (source of truth for connection status)
 * and students table (CRM records with thread links).
 *
 * This handles the edge case where a student has an approved connection
 * but no students record with their user_id linked.
 */
export async function getStudentMessagingContext(
  client: SupabaseClient,
  userId: string
): Promise<{ data: StudentMessagingContext | null; error: Error | null }> {
  try {
    // Query 1: Get connections from student_tutor_connections (source of truth)
    const { data: connections, error: connectionsError } = await client
      .from("student_tutor_connections")
      .select(`
        id,
        tutor_id,
        status,
        profiles:tutor_id (
          full_name,
          username,
          avatar_url
        )
      `)
      .eq("student_user_id", userId);

    // Handle missing table gracefully (pre-migration state)
    if (connectionsError && connectionsError.code === "42P01") {
      // Table doesn't exist, return empty connections
      const { data: studentRecords } = await client
        .from("students")
        .select("id, tutor_id, full_name, connection_status:calendar_access_status")
        .eq("user_id", userId)
        .is("deleted_at", null);

      return {
        data: {
          connections: [],
          studentRecords: (studentRecords as StudentRecord[]) ?? [],
        },
        error: null,
      };
    }

    if (connectionsError) {
      return { data: null, error: connectionsError };
    }

    // Query 2: Get existing students records
    // Note: calendar_access_status is aliased as connection_status for consistency with page logic
    const { data: studentRecords, error: studentsError } = await client
      .from("students")
      .select("id, tutor_id, full_name, connection_status:calendar_access_status")
      .eq("user_id", userId)
      .is("deleted_at", null);

    if (studentsError) {
      return { data: null, error: studentsError };
    }

    // Transform connections to match the expected type (Supabase FK join returns object, not array)
    const transformedConnections: StudentMessagingConnection[] = (connections ?? []).map((c) => ({
      id: c.id,
      tutor_id: c.tutor_id,
      status: c.status as ConnectionStatus,
      profiles: Array.isArray(c.profiles) ? c.profiles[0] ?? null : c.profiles ?? null,
    }));

    return {
      data: {
        connections: transformedConnections,
        studentRecords: (studentRecords as StudentRecord[]) ?? [],
      },
      error: null,
    };
  } catch (err) {
    return { data: null, error: err as Error };
  }
}

export type { ThreadBase };

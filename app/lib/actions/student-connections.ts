"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import {
  createThread,
  getThreadByTutorStudent,
  insertMessage,
  updateThreadPreview,
  upsertThread,
} from "@/lib/repositories/messaging";
import {
  sendAccessRequestNotification,
  sendAccessApprovedEmail,
} from "@/lib/emails/access-emails";
import { isTableMissing } from "@/lib/utils/supabase-errors";
import type {
  ConnectionStatus,
  TutorSearchResult,
  StudentConnection,
  PendingConnectionRequest,
  TutorWithDetails,
} from "@/lib/actions/types";

const CONNECTIONS_TABLE = "student_tutor_connections";
const isMissingConnectionsTable = (error?: { message?: string; code?: string; hint?: string | null; details?: string | null } | null) =>
  isTableMissing(error, CONNECTIONS_TABLE);


/**
 * Search for tutors by username or name
 */
export async function searchTutors(query: string): Promise<{
  tutors?: TutorSearchResult[];
  error?: string;
}> {
  if (!query || query.length < 2) {
    return { tutors: [] };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Please log in to search for tutors" };
  }

  const adminClient = createServiceRoleClient();
  if (!adminClient) {
    return { error: "Service unavailable" };
  }

  const searchTerm = `%${query.toLowerCase()}%`;

  const { data: tutors, error } = await adminClient
    .from("profiles")
    .select("id, username, full_name, avatar_url, tagline")
    .or(`username.ilike.${searchTerm},full_name.ilike.${searchTerm}`)
    .eq("role", "tutor")
    .not("username", "is", null)
    .limit(20);

  if (error) {
    console.error("Search error:", error);
    return { error: "Failed to search tutors" };
  }

  return { tutors: tutors || [] };
}

/**
 * Request a connection with a tutor (send initial message)
 */
export async function requestConnection(params: {
  tutorId: string;
  message: string;
}): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Please log in to connect with tutors" };
  }

  // Check if connection already exists
  const { data: existing, error: existingError } = await supabase
    .from("student_tutor_connections")
    .select("id, status")
    .eq("student_user_id", user.id)
    .eq("tutor_id", params.tutorId)
    .single();

  if (existingError && isMissingConnectionsTable(existingError)) {
    console.warn("[Connections] Table missing, skipping duplicate check");
  } else if (existingError && existingError.code !== "PGRST116") {
    console.error("Failed to check existing connection:", existingError);
  }

  if (existing) {
    if (existing.status === "pending") {
      return { error: "You already have a pending connection request with this tutor" };
    }
    if (existing.status === "approved") {
      return { error: "You are already connected with this tutor" };
    }
    if (existing.status === "rejected") {
      return { error: "This tutor has declined your connection request" };
    }
  }

  // Validate message length
  if (!params.message || params.message.trim().length < 10) {
    return { error: "Please write a message (at least 10 characters)" };
  }

  if (params.message.length > 500) {
    return { error: "Message is too long (max 500 characters)" };
  }

  // Create connection request
  const { error: insertError } = await supabase
    .from("student_tutor_connections")
    .insert({
      student_user_id: user.id,
      tutor_id: params.tutorId,
      status: "pending",
      initial_message: params.message.trim(),
      requested_at: new Date().toISOString(),
    });

  if (insertError) {
    if (isMissingConnectionsTable(insertError)) {
      console.warn("[Connections] Table missing, treating request as success");
      return { success: true };
    }
    console.error("Failed to create connection:", insertError);
    return { error: "Failed to send connection request" };
  }

  // Use admin client to create messaging records (bypasses RLS)
  const adminClient = createServiceRoleClient();
  if (adminClient) {
    try {
      // Get student info from auth
      const { data: authUser } = await adminClient.auth.admin.getUserById(user.id);
      const studentName = authUser?.user?.user_metadata?.full_name || authUser?.user?.email || "Student";
      const studentEmail = authUser?.user?.email || "";
      const studentTimezone = authUser?.user?.user_metadata?.timezone || "UTC";

      // Get tutor profile
      const { data: tutorProfile } = await adminClient
        .from("profiles")
        .select("full_name, email, username")
        .eq("id", params.tutorId)
        .single();

      // Create students record with pending connection status
      // Check if student record already exists (e.g., from a previous booking)
      const { data: existingStudent } = await adminClient
        .from("students")
        .select("id")
        .eq("user_id", user.id)
        .eq("tutor_id", params.tutorId)
        .single();

      let studentRecordId: string;

      if (existingStudent) {
        // Update existing student record
        studentRecordId = existingStudent.id;
        await adminClient
          .from("students")
          .update({
            connection_status: "pending",
          })
          .eq("id", studentRecordId);
      } else {
        // Create new student record
        const { data: newStudent, error: studentError } = await adminClient
          .from("students")
          .insert({
            tutor_id: params.tutorId,
            user_id: user.id,
            full_name: studentName,
            email: studentEmail,
            timezone: studentTimezone,
            calendar_access_status: "pending",
            connection_status: "pending",
            source: "connection_request",
          })
          .select("id")
          .single();

        if (studentError) {
          console.error("Failed to create student record:", studentError);
        } else {
          studentRecordId = newStudent.id;
        }
      }

      // Create conversation thread if student record was created/updated
      if (studentRecordId!) {
        const preview = params.message.trim().substring(0, 160);
        const now = new Date().toISOString();

        const { data: existingThread, error: existingThreadError } = await getThreadByTutorStudent(
          adminClient,
          params.tutorId,
          studentRecordId
        );

        let threadId: string | null = existingThread?.id ?? null;

        if (!threadId) {
          if (existingThreadError && existingThreadError.code !== "PGRST116") {
            console.error("Failed to check conversation thread:", existingThreadError);
          }

          const { data: newThread, error: threadError } = await createThread(adminClient, {
            tutorId: params.tutorId,
            studentId: studentRecordId,
            lastMessagePreview: preview,
            lastMessageAt: now,
            tutorUnread: true,
            studentUnread: false,
          });

          if (threadError || !newThread) {
            console.error("Failed to create conversation thread:", threadError);
          } else {
            threadId = newThread.id;
          }
        }

        if (threadId) {
          const { error: messageError } = await insertMessage(adminClient, {
            threadId,
            tutorId: params.tutorId,
            studentId: studentRecordId,
            senderRole: "student",
            body: params.message.trim(),
            readByStudent: true,
            readByTutor: false,
          });

          if (messageError) {
            console.error("Failed to create initial message:", messageError);
          }

          if (existingThread?.id) {
            await updateThreadPreview(adminClient, threadId, {
              lastMessagePreview: preview,
              lastMessageAt: now,
              tutorUnread: true,
              studentUnread: false,
            });
          }
        }
      }

      // Send email notification to tutor
      if (tutorProfile?.email) {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tutorlingua.co";
        const reviewUrl = `${baseUrl}/students`;

        sendAccessRequestNotification({
          tutorName: tutorProfile.full_name || "Tutor",
          tutorEmail: tutorProfile.email,
          studentName,
          studentEmail,
          studentMessage: params.message.trim(),
          reviewUrl,
        }).catch((err) => {
          console.error("Failed to send connection request notification:", err);
        });
      }
    } catch (err) {
      console.error("Error creating messaging records:", err);
    }
  }

  revalidatePath("/student/search");
  revalidatePath("/student/messages");
  revalidatePath("/students");
  revalidatePath("/messages");

  return { success: true };
}

/**
 * Get all connections for the current student
 */
export async function getMyConnections(): Promise<{
  connections?: StudentConnection[];
  error?: string;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Please log in to view your connections" };
  }

  const adminClient = createServiceRoleClient();
  if (!adminClient) {
    return { error: "Service unavailable" };
  }

  // Get connections with tutor info
  const { data: connections, error } = await adminClient
    .from("student_tutor_connections")
    .select(`
      id,
      tutor_id,
      status,
      initial_message,
      requested_at,
      resolved_at
    `)
    .eq("student_user_id", user.id)
    .order("requested_at", { ascending: false });

  if (error) {
    if (isMissingConnectionsTable(error)) {
      console.warn("[Connections] Table missing, returning no connections");
      return { connections: [] };
    }
    console.error("Failed to get connections:", error);
    return { error: "Failed to load connections" };
  }

  // Get tutor details for each connection
  const tutorIds = connections?.map((c) => c.tutor_id) || [];

  if (tutorIds.length === 0) {
    return { connections: [] };
  }

  const { data: tutors } = await adminClient
    .from("profiles")
    .select("id, username, full_name, avatar_url, tagline")
    .in("id", tutorIds);

  const tutorMap = new Map(tutors?.map((t) => [t.id, t]) || []);

  const result: StudentConnection[] = (connections || []).map((c) => ({
    id: c.id,
    tutor_id: c.tutor_id,
    status: c.status as ConnectionStatus,
    initial_message: c.initial_message,
    requested_at: c.requested_at,
    resolved_at: c.resolved_at,
    tutor: tutorMap.get(c.tutor_id) || {
      id: c.tutor_id,
      username: "",
      full_name: null,
      avatar_url: null,
      tagline: null,
    },
  }));

  return { connections: result };
}

/**
 * Get only approved tutors (for calendar dropdown)
 */
export async function getApprovedTutors(): Promise<{
  tutors?: TutorSearchResult[];
  error?: string;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Please log in" };
  }

  const adminClient = createServiceRoleClient();
  if (!adminClient) {
    return { error: "Service unavailable" };
  }

  // Get approved connections
  const { data: connections, error: connectionsError } = await adminClient
    .from("student_tutor_connections")
    .select("tutor_id")
    .eq("student_user_id", user.id)
    .eq("status", "approved");

  if (connectionsError) {
    if (isMissingConnectionsTable(connectionsError)) {
      console.warn("[Connections] Table missing, returning no approved tutors");
      return { tutors: [] };
    }
    return { error: "Failed to load tutors" };
  }

  if (!connections) {
    return { tutors: [] };
  }

  const tutorIds = connections?.map((c) => c.tutor_id) || [];

  if (tutorIds.length === 0) {
    return { tutors: [] };
  }

  const { data: tutors, error } = await adminClient
    .from("profiles")
    .select("id, username, full_name, avatar_url, tagline")
    .in("id", tutorIds);

  if (error) {
    return { error: "Failed to load tutors" };
  }

  return { tutors: tutors || [] };
}

/**
 * Check connection status with a specific tutor
 */
export async function getConnectionStatus(tutorId: string): Promise<{
  status: ConnectionStatus | "none";
  connectionId?: string;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "none" };
  }

  const { data: connection, error: connectionError } = await supabase
    .from("student_tutor_connections")
    .select("id, status")
    .eq("student_user_id", user.id)
    .eq("tutor_id", tutorId)
    .single();

  if (connectionError) {
    if (isMissingConnectionsTable(connectionError)) {
      console.warn("[Connections] Table missing, treating as no connection");
      return { status: "none" };
    }
    if (connectionError.code !== "PGRST116") {
      console.error("Failed to fetch connection status:", connectionError);
    }
  }

  if (!connection) {
    return { status: "none" };
  }

  return {
    status: connection.status as ConnectionStatus,
    connectionId: connection.id,
  };
}

// ============================================
// TUTOR-SIDE ACTIONS
// ============================================

/**
 * Get pending connection requests for a tutor
 */
export async function getPendingConnectionRequests(): Promise<{
  requests?: PendingConnectionRequest[];
  error?: string;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Please log in" };
  }

  const adminClient = createServiceRoleClient();
  if (!adminClient) {
    return { error: "Service unavailable" };
  }

  // Get pending requests for this tutor
  const { data: requests, error } = await adminClient
    .from("student_tutor_connections")
    .select("id, student_user_id, initial_message, requested_at")
    .eq("tutor_id", user.id)
    .eq("status", "pending")
    .order("requested_at", { ascending: false });

  if (error) {
    if (isMissingConnectionsTable(error)) {
      console.warn("[Connections] Table missing, returning no pending requests");
      return { requests: [] };
    }
    console.error("Failed to get requests:", error);
    return { error: "Failed to load connection requests" };
  }

  // Get student info from auth.users
  const studentUserIds = requests?.map((r) => r.student_user_id) || [];

  if (studentUserIds.length === 0) {
    return { requests: [] };
  }

  // Get user metadata from auth.users via admin client
  const { data: authUsers } = await adminClient.auth.admin.listUsers();

  const userMap = new Map(
    authUsers?.users
      ?.filter((u) => studentUserIds.includes(u.id))
      .map((u) => [
        u.id,
        {
          email: u.email || "",
          name: u.user_metadata?.full_name || null,
        },
      ]) || []
  );

  const result: PendingConnectionRequest[] = (requests || []).map((r) => ({
    id: r.id,
    student_user_id: r.student_user_id,
    initial_message: r.initial_message,
    requested_at: r.requested_at,
    student_email: userMap.get(r.student_user_id)?.email || "",
    student_name: userMap.get(r.student_user_id)?.name || null,
  }));

  return { requests: result };
}

/**
 * Approve a connection request
 */
export async function approveConnectionRequest(
  connectionId: string
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();
  const adminClient = createServiceRoleClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Please log in" };
  }

  const { error } = await supabase
    .from("student_tutor_connections")
    .update({
      status: "approved",
      resolved_at: new Date().toISOString(),
    })
    .eq("id", connectionId)
    .eq("tutor_id", user.id);

  if (error) {
    if (isMissingConnectionsTable(error)) {
      console.warn("[Connections] Table missing, treating approval as no-op");
      return { success: true };
    }
    console.error("Failed to approve:", error);
    return { error: "Failed to approve connection" };
  }

  // Ensure messaging is ready once connected
  if (adminClient) {
    try {
      // Get student user id for this connection
      const { data: connection } = await adminClient
        .from("student_tutor_connections")
        .select("student_user_id, tutor_id")
        .eq("id", connectionId)
        .single();

      const studentUserId = connection?.student_user_id;
      if (studentUserId) {
        // Find or create the student record for this tutor/user
        let { data: studentRecord } = await adminClient
          .from("students")
          .select("id, calendar_access_status")
          .eq("tutor_id", user.id)
          .eq("user_id", studentUserId)
          .maybeSingle();

        if (!studentRecord) {
          const { data: authUser } = await adminClient.auth.admin.getUserById(studentUserId);
          const fullName =
            authUser?.user?.user_metadata?.full_name ||
            authUser?.user?.email ||
            "Student";
          const email = authUser?.user?.email || "";

          const { data: newStudent, error: studentError } = await adminClient
            .from("students")
            .insert({
              tutor_id: user.id,
              user_id: studentUserId,
              full_name: fullName,
              email,
              timezone: authUser?.user?.user_metadata?.timezone || "UTC",
              calendar_access_status: "approved",
              connection_status: "approved",
              access_approved_at: new Date().toISOString(),
              source: "connection_approval",
            })
            .select("id, calendar_access_status")
            .single();

          if (studentError) {
            console.error("Failed to create student for messaging:", studentError);
          } else {
            studentRecord = newStudent;
          }
        } else {
          // Update existing student record to approved status
          await adminClient
            .from("students")
            .update({
              calendar_access_status: "approved",
              connection_status: "approved",
              access_approved_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", studentRecord.id)
            .eq("tutor_id", user.id);
        }

        if (studentRecord?.id) {
          const { error: threadError } = await upsertThread(
            adminClient,
            {
              tutorId: user.id,
              studentId: studentRecord.id,
            },
            { ignoreDuplicates: true }
          );

          if (threadError && threadError.code !== "23505") {
            console.error("Failed to create conversation thread:", threadError);
          }
        }

        // Send email notification to student
        try {
          const { data: tutorProfile } = await adminClient
            .from("profiles")
            .select("full_name, email, username")
            .eq("id", user.id)
            .single();

          const { data: authUser } = await adminClient.auth.admin.getUserById(studentUserId);
          const studentName = authUser?.user?.user_metadata?.full_name || authUser?.user?.email || "Student";
          const studentEmail = authUser?.user?.email;

          if (studentEmail && tutorProfile) {
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tutorlingua.co";
            const bookingUrl = tutorProfile.username
              ? `${baseUrl}/book?tutor=${tutorProfile.username}`
              : `${baseUrl}/student/calendar`;

            sendAccessApprovedEmail({
              studentName,
              studentEmail,
              tutorName: tutorProfile.full_name || "Your tutor",
              tutorEmail: tutorProfile.email || "",
              bookingUrl,
            }).catch((err) => {
              console.error("Failed to send connection approval notification:", err);
            });
          }
        } catch (emailErr) {
          console.error("Error sending connection approval email:", emailErr);
        }
      }
    } catch (e) {
      console.error("Failed to prepare messaging on approval:", e);
    }
  }

  revalidatePath("/students");
  revalidatePath("/student/messages");
  revalidatePath("/messages");

  return { success: true };
}

/**
 * Reject a connection request
 */
export async function rejectConnectionRequest(
  connectionId: string,
  notes?: string
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Please log in" };
  }

  const { error } = await supabase
    .from("student_tutor_connections")
    .update({
      status: "rejected",
      resolved_at: new Date().toISOString(),
      tutor_notes: notes || null,
    })
    .eq("id", connectionId)
    .eq("tutor_id", user.id);

  if (error) {
    if (isMissingConnectionsTable(error)) {
      console.warn("[Connections] Table missing, treating rejection as no-op");
      return { success: true };
    }
    console.error("Failed to reject:", error);
    return { error: "Failed to reject connection" };
  }

  revalidatePath("/students");

  return { success: true };
}

// ============================================
// STUDENT BOOKING ACTIONS
// ============================================

/**
 * Get tutor details for booking (services, availability, etc.)
 * Only works for approved connections
 */
export async function getTutorForBooking(tutorId: string): Promise<{
  tutor?: TutorWithDetails;
  error?: string;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Please log in" };
  }

  // Verify approved connection
  const { data: connection, error: connectionError } = await supabase
    .from("student_tutor_connections")
    .select("id, status")
    .eq("student_user_id", user.id)
    .eq("tutor_id", tutorId)
    .single();

  if (connectionError) {
    if (isMissingConnectionsTable(connectionError)) {
      console.warn("[Connections] Table missing, treating booking connection as approved");
    } else if (connectionError.code !== "PGRST116") {
      console.error("Failed to verify connection for booking:", connectionError);
    }
  }

  if (!isMissingConnectionsTable(connectionError) && (!connection || connection.status !== "approved")) {
    return { error: "You need an approved connection to book with this tutor" };
  }

  const adminClient = createServiceRoleClient();
  if (!adminClient) {
    return { error: "Service unavailable" };
  }

  // Get tutor profile
  const { data: tutor, error: tutorError } = await adminClient
    .from("profiles")
    .select("id, username, full_name, avatar_url, tagline, timezone")
    .eq("id", tutorId)
    .single();

  if (tutorError || !tutor) {
    return { error: "Tutor not found" };
  }

  // Get active services
  const { data: services } = await adminClient
    .from("services")
    .select("id, name, description, duration_minutes, price_amount, price_currency, is_active")
    .eq("tutor_id", tutorId)
    .eq("is_active", true)
    .order("name");

  // Get availability
  const { data: availability } = await adminClient
    .from("availability")
    .select("day_of_week, start_time, end_time, is_available")
    .eq("tutor_id", tutorId)
    .eq("is_available", true)
    .order("day_of_week")
    .order("start_time");

  return {
    tutor: {
      ...tutor,
      timezone: tutor.timezone || "UTC",
      services: services || [],
      availability: availability || [],
    },
  };
}

/**
 * Get existing bookings for a tutor (for conflict checking)
 */
export async function getTutorBookings(tutorId: string): Promise<{
  bookings?: { scheduled_at: string; duration_minutes: number; status: string }[];
  error?: string;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Please log in" };
  }

  const adminClient = createServiceRoleClient();
  if (!adminClient) {
    return { error: "Service unavailable" };
  }

  // Get bookings for the next 30 days
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 30);

  const { data: bookings } = await adminClient
    .from("bookings")
    .select("scheduled_at, duration_minutes, status")
    .eq("tutor_id", tutorId)
    .gte("scheduled_at", startDate.toISOString())
    .lte("scheduled_at", endDate.toISOString())
    .not("status", "in", '("cancelled","cancelled_by_tutor","cancelled_by_student")');

  return { bookings: bookings || [] };
}

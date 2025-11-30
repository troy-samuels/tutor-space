"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import {
  sendAccessRequestNotification,
  sendAccessApprovedEmail,
} from "@/lib/emails/access-emails";

export type ConnectionStatus = "pending" | "approved" | "rejected";

export type TutorSearchResult = {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  tagline: string | null;
};

export type StudentConnection = {
  id: string;
  tutor_id: string;
  status: ConnectionStatus;
  initial_message: string | null;
  requested_at: string;
  resolved_at: string | null;
  tutor: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
    tagline: string | null;
  };
};

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
  const { data: existing } = await supabase
    .from("student_tutor_connections")
    .select("id, status")
    .eq("student_user_id", user.id)
    .eq("tutor_id", params.tutorId)
    .single();

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
    console.error("Failed to create connection:", insertError);
    return { error: "Failed to send connection request" };
  }

  // Send email notification to tutor
  const adminClient = createServiceRoleClient();
  if (adminClient) {
    try {
      // Get tutor profile
      const { data: tutorProfile } = await adminClient
        .from("profiles")
        .select("full_name, email, username")
        .eq("id", params.tutorId)
        .single();

      // Get student info from auth
      const { data: authUser } = await adminClient.auth.admin.getUserById(user.id);
      const studentName = authUser?.user?.user_metadata?.full_name || authUser?.user?.email || "Student";
      const studentEmail = authUser?.user?.email || "";

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
      console.error("Error sending connection request notification:", err);
    }
  }

  revalidatePath("/student-auth/search");
  revalidatePath("/students");

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
  const { data: connections } = await adminClient
    .from("student_tutor_connections")
    .select("tutor_id")
    .eq("student_user_id", user.id)
    .eq("status", "approved");

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

  const { data: connection } = await supabase
    .from("student_tutor_connections")
    .select("id, status")
    .eq("student_user_id", user.id)
    .eq("tutor_id", tutorId)
    .single();

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

export type PendingConnectionRequest = {
  id: string;
  student_user_id: string;
  initial_message: string | null;
  requested_at: string;
  student_email: string;
  student_name: string | null;
};

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
        } else if (studentRecord.calendar_access_status !== "approved") {
          await adminClient
            .from("students")
            .update({
              calendar_access_status: "approved",
              access_approved_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", studentRecord.id)
            .eq("tutor_id", user.id);
        }

        if (studentRecord?.id) {
          const { error: threadError } = await adminClient
            .from("conversation_threads")
            .insert({
              tutor_id: user.id,
              student_id: studentRecord.id,
            })
            .select("id")
            .single();

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
              : `${baseUrl}/student-auth/calendar`;

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
    console.error("Failed to reject:", error);
    return { error: "Failed to reject connection" };
  }

  revalidatePath("/students");

  return { success: true };
}

// ============================================
// STUDENT BOOKING ACTIONS
// ============================================

export type TutorWithDetails = {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  tagline: string | null;
  timezone: string;
  services: {
    id: string;
    name: string;
    description: string | null;
    duration_minutes: number;
    price_amount: number;
    price_currency: string;
    is_active: boolean;
  }[];
  availability: {
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_available: boolean;
  }[];
};

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
  const { data: connection } = await supabase
    .from("student_tutor_connections")
    .select("id, status")
    .eq("student_user_id", user.id)
    .eq("tutor_id", tutorId)
    .single();

  if (!connection || connection.status !== "approved") {
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
    .not("status", "in", '("cancelled_by_tutor","cancelled_by_student")');

  return { bookings: bookings || [] };
}

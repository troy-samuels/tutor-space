"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export type NotificationType =
  | "booking_new"
  | "booking_confirmed"
  | "booking_cancelled"
  | "booking_reminder"
  | "payment_received"
  | "payment_failed"
  | "message_new"
  | "message_reply"
  | "student_new"
  | "student_access_request"
  | "package_purchased"
  | "package_expiring"
  | "review_received"
  | "review_approved"
  | "system_announcement"
  | "account_update"
  | "homework_assigned"
  | "homework_due_reminder"
  | "homework_submission_received"
  | "drill_assigned"
  | "drill_due_reminder";

export interface Notification {
  id: string;
  user_id: string;
  user_role: "tutor" | "student";
  type: NotificationType;
  title: string;
  body: string | null;
  icon: string | null;
  link: string | null;
  metadata: Record<string, unknown>;
  read: boolean;
  read_at: string | null;
  created_at: string;
}

/**
 * Get notifications for the current user
 */
export async function getNotifications(options?: {
  limit?: number;
  unreadOnly?: boolean;
}): Promise<{ notifications: Notification[]; unreadCount: number }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { notifications: [], unreadCount: 0 };
  }

  const limit = options?.limit || 50;

  let query = supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (options?.unreadOnly) {
    query = query.eq("read", false);
  }

  const { data: notifications, error } = await query;

  if (error) {
    console.error("Error fetching notifications:", error);
    return { notifications: [], unreadCount: 0 };
  }

  // Get unread count
  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("read", false);

  return {
    notifications: (notifications || []) as Notification[],
    unreadCount: count || 0,
  };
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount(): Promise<number> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return 0;
  }

  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("read", false);

  return count || 0;
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(
  notificationId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("notifications")
    .update({
      read: true,
      read_at: new Date().toISOString(),
    })
    .eq("id", notificationId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error marking notification as read:", error);
    return { success: false, error: "Failed to mark as read" };
  }

  return { success: true };
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("notifications")
    .update({
      read: true,
      read_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .eq("read", false);

  if (error) {
    console.error("Error marking all notifications as read:", error);
    return { success: false, error: "Failed to mark all as read" };
  }

  return { success: true };
}

/**
 * Delete a notification
 */
export async function deleteNotification(
  notificationId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) {
    return { success: false, error: "Database connection failed" };
  }

  const { error } = await serviceClient
    .from("notifications")
    .delete()
    .eq("id", notificationId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error deleting notification:", error);
    return { success: false, error: "Failed to delete notification" };
  }

  return { success: true };
}

/**
 * Create a notification (server-side utility)
 */
export async function createNotification({
  userId,
  userRole,
  type,
  title,
  body,
  link,
  icon,
  metadata,
}: {
  userId: string;
  userRole: "tutor" | "student";
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
  icon?: string;
  metadata?: Record<string, unknown>;
}): Promise<{ success: boolean; notificationId?: string; error?: string }> {
  const serviceClient = createServiceRoleClient();
  if (!serviceClient) {
    return { success: false, error: "Database connection failed" };
  }

  const { data, error } = await serviceClient
    .from("notifications")
    .insert({
      user_id: userId,
      user_role: userRole,
      type,
      title,
      body: body || null,
      link: link || null,
      icon: icon || null,
      metadata: metadata || {},
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error creating notification:", error);
    return { success: false, error: "Failed to create notification" };
  }

  return { success: true, notificationId: data?.id };
}

// Notification type to icon mapping - moved to @/lib/constants/notification-icons.ts if needed

/**
 * Notify a student that homework has been assigned
 */
export async function notifyHomeworkAssigned({
  studentUserId,
  tutorName,
  homeworkId,
  homeworkTitle,
  dueDate,
}: {
  studentUserId: string;
  tutorName: string;
  homeworkId: string;
  homeworkTitle: string;
  dueDate: string | null;
}): Promise<{ success: boolean; error?: string }> {
  const dueDateText = dueDate
    ? ` due ${new Date(dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
    : "";

  return createNotification({
    userId: studentUserId,
    userRole: "student",
    type: "homework_assigned",
    title: "New homework assigned",
    body: `${tutorName} assigned: "${homeworkTitle}"${dueDateText}`,
    link: "/student/progress",
    icon: "book-open",
    metadata: {
      homework_id: homeworkId,
      homework_title: homeworkTitle,
      due_date: dueDate,
      tutor_name: tutorName,
    },
  });
}

/**
 * Notify a student about upcoming homework due date (24h reminder)
 */
export async function notifyHomeworkDueReminder({
  studentUserId,
  homeworkId,
  homeworkTitle,
  dueDate,
}: {
  studentUserId: string;
  homeworkId: string;
  homeworkTitle: string;
  dueDate: string;
}): Promise<{ success: boolean; error?: string }> {
  return createNotification({
    userId: studentUserId,
    userRole: "student",
    type: "homework_due_reminder",
    title: "Homework due tomorrow",
    body: `"${homeworkTitle}" is due tomorrow`,
    link: "/student/progress",
    icon: "clock",
    metadata: {
      homework_id: homeworkId,
      homework_title: homeworkTitle,
      due_date: dueDate,
    },
  });
}

/**
 * Notify a tutor that a student has submitted homework
 */
export async function notifyHomeworkSubmissionReceived({
  tutorId,
  studentName,
  homeworkId,
  homeworkTitle,
  studentId,
}: {
  tutorId: string;
  studentName: string;
  homeworkId: string;
  homeworkTitle: string;
  studentId: string;
}): Promise<{ success: boolean; error?: string }> {
  return createNotification({
    userId: tutorId,
    userRole: "tutor",
    type: "homework_submission_received",
    title: "Homework submission received",
    body: `${studentName} submitted "${homeworkTitle}"`,
    link: `/students/${studentId}`,
    icon: "check-circle",
    metadata: {
      homework_id: homeworkId,
      homework_title: homeworkTitle,
      student_name: studentName,
      student_id: studentId,
    },
  });
}

/**
 * Notify tutor when a new booking is created
 */
export async function notifyNewBooking({
  tutorId,
  studentName,
  serviceName,
  scheduledAt,
  bookingId,
}: {
  tutorId: string;
  studentName: string;
  serviceName: string;
  scheduledAt: string;
  bookingId: string;
}): Promise<{ success: boolean; error?: string }> {
  const dateText = new Date(scheduledAt).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  return createNotification({
    userId: tutorId,
    userRole: "tutor",
    type: "booking_new",
    title: "New booking request",
    body: `${studentName} booked ${serviceName} for ${dateText}`,
    link: `/bookings`,
    icon: "calendar-plus",
    metadata: {
      booking_id: bookingId,
      student_name: studentName,
      service_name: serviceName,
    },
  });
}

/**
 * Notify student when booking is confirmed
 */
export async function notifyBookingConfirmed({
  studentUserId,
  tutorName,
  serviceName,
  scheduledAt,
  bookingId,
}: {
  studentUserId: string;
  tutorName: string;
  serviceName: string;
  scheduledAt: string;
  bookingId: string;
}): Promise<{ success: boolean; error?: string }> {
  const dateText = new Date(scheduledAt).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  return createNotification({
    userId: studentUserId,
    userRole: "student",
    type: "booking_confirmed",
    title: "Booking confirmed",
    body: `Your lesson with ${tutorName} on ${dateText} is confirmed`,
    link: "/student/bookings",
    icon: "calendar-check",
    metadata: {
      booking_id: bookingId,
      tutor_name: tutorName,
      service_name: serviceName,
    },
  });
}

/**
 * Notify when booking is cancelled
 */
export async function notifyBookingCancelled({
  userId,
  userRole,
  otherPartyName,
  serviceName,
  scheduledAt,
  bookingId,
}: {
  userId: string;
  userRole: "tutor" | "student";
  otherPartyName: string;
  serviceName: string;
  scheduledAt: string;
  bookingId: string;
}): Promise<{ success: boolean; error?: string }> {
  const dateText = new Date(scheduledAt).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  return createNotification({
    userId,
    userRole,
    type: "booking_cancelled",
    title: "Booking cancelled",
    body: `${serviceName} on ${dateText} has been cancelled`,
    link: userRole === "tutor" ? "/bookings" : "/student/bookings",
    icon: "calendar-x",
    metadata: { booking_id: bookingId, other_party: otherPartyName },
  });
}

/**
 * Notify recipient of new message
 */
export async function notifyNewMessage({
  recipientId,
  recipientRole,
  senderName,
  messagePreview,
  threadId,
}: {
  recipientId: string;
  recipientRole: "tutor" | "student";
  senderName: string;
  messagePreview: string;
  threadId: string;
}): Promise<{ success: boolean; error?: string }> {
  return createNotification({
    userId: recipientId,
    userRole: recipientRole,
    type: "message_new",
    title: `New message from ${senderName}`,
    body:
      messagePreview.length > 100
        ? messagePreview.slice(0, 100) + "..."
        : messagePreview,
    link: recipientRole === "tutor" ? "/messages" : "/student/messages",
    icon: "message-square",
    metadata: { thread_id: threadId, sender_name: senderName },
  });
}

/**
 * Notify student when practice drills are assigned from lesson analysis
 */
export async function notifyDrillsAssigned({
  studentUserId,
  tutorName,
  drillCount,
  lessonDate,
}: {
  studentUserId: string;
  tutorName: string;
  drillCount: number;
  lessonDate?: string;
}): Promise<{ success: boolean; error?: string }> {
  const formattedDate = lessonDate
    ? new Date(lessonDate).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })
    : null;

  return createNotification({
    userId: studentUserId,
    userRole: "student",
    type: "drill_assigned",
    title: "New practice drills available",
    body: `${tutorName} created ${drillCount} practice drill${drillCount > 1 ? "s" : ""}${formattedDate ? ` from your ${formattedDate} lesson` : ""}`,
    link: "/student/drills",
    icon: "sparkles",
    metadata: { drill_count: drillCount, tutor_name: tutorName, lesson_date: lessonDate },
  });
}

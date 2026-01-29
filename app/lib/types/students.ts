import type { ProfileFormValues } from "@/lib/validators/profile";

// Invite Links
export type InviteLink = {
  id: string;
  tutorId: string;
  token: string;
  name: string;
  expiresAt: string;
  isActive: boolean;
  serviceIds: string[];
  usageCount: number;
  createdAt: string;
  updatedAt: string;
};

export type InviteLinkWithServices = InviteLink & {
  services?: Array<{ id: string; name: string }>;
};

export type ValidatedInviteLink = {
  id: string;
  tutorId: string;
  name: string;
  serviceIds: string[];
  isValid: boolean;
  tutorUsername: string;
  tutorFullName: string | null;
  tutorAvatarUrl: string | null;
};

// Email Campaigns
export type BroadcastActionState = {
  error?: string;
  success?: string;
};

// Student Access
export type AccessStatus = "pending" | "approved" | "denied" | "suspended" | "no_record";

export type StudentAccessInfo = {
  status: AccessStatus;
  student_id?: string;
  tutor_name?: string;
  requested_at?: string;
  has_active_package?: boolean;
};

// Student Settings
export interface StudentPreferences {
  id: string;
  user_id: string;
  timezone: string;
  preferred_language: string;
  notification_sound: boolean;
  theme: "light" | "dark" | "system";
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudentEmailPreferences {
  email_booking_reminders: boolean;
  email_lesson_updates: boolean;
  email_marketing: boolean;
}

// Email Preferences
export type AutomationActionState = {
  error?: string;
  success?: string;
};

export type UnsubscribeActionState = {
  error?: string;
  success?: string;
  studentName?: string;
  tutorName?: string;
};

// Marketing Links
export type LinkRecord = {
  id: string;
  tutor_id: string;
  title: string;
  url: string;
  description: string | null;
  icon_url: string | null;
  button_style: string | null;
  is_visible: boolean;
  sort_order: number;
  click_count: number | null;
  created_at: string;
  updated_at: string;
};

// Student Connections
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

export type PendingConnectionRequest = {
  id: string;
  student_user_id: string;
  initial_message: string | null;
  requested_at: string;
  student_email: string;
  student_name: string | null;
};

export type TutorWithDetails = {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  tagline: string | null;
  timezone: string;
  buffer_time_minutes?: number | null;
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

// Student Onboarding
export type OnboardingTemplateItem = {
  id: string;
  label: string;
  description?: string;
  order: number;
};

export type OnboardingTemplate = {
  id: string;
  tutor_id: string;
  name: string;
  is_default: boolean;
  items: OnboardingTemplateItem[];
  created_at: string;
  updated_at: string;
};

export type OnboardingProgress = {
  id: string;
  student_id: string;
  tutor_id: string;
  template_id: string | null;
  completed_items: string[];
  status: "not_started" | "in_progress" | "completed";
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  template?: OnboardingTemplate;
};

export type OnboardingOverview = {
  not_started: number;
  in_progress: number;
  completed: number;
  total: number;
};

// Student Timeline
export type TimelineEventType =
  | "student_created"
  | "onboarding_started"
  | "onboarding_completed"
  | "onboarding_item_completed"
  | "booking_created"
  | "booking_completed"
  | "booking_cancelled"
  | "booking_rescheduled"
  | "message_sent"
  | "message_received"
  | "homework_assigned"
  | "homework_completed"
  | "homework_submitted"
  | "practice_session_completed"
  | "drill_completed"
  | "goal_created"
  | "goal_completed"
  | "assessment_recorded"
  | "payment_received"
  | "package_purchased"
  | "subscription_started"
  | "status_changed"
  | "risk_status_changed"
  | "note_added"
  | "label_added"
  | "label_removed"
  | "first_lesson"
  | "lesson_milestone";

export type TimelineEvent = {
  id: string;
  student_id: string;
  tutor_id: string;
  event_type: TimelineEventType;
  event_title: string;
  event_description: string | null;
  event_metadata: Record<string, unknown>;
  related_booking_id: string | null;
  related_homework_id: string | null;
  related_message_id: string | null;
  visible_to_student: boolean;
  is_milestone: boolean;
  event_at: string;
  created_at: string;
};

export type TimelineOptions = {
  limit?: number;
  offset?: number;
  eventTypes?: TimelineEventType[];
  startDate?: string;
  endDate?: string;
  milestonesOnly?: boolean;
};

export type JourneyStats = {
  total_events: number;
  milestones_count: number;
  first_event_at: string | null;
  latest_event_at: string | null;
  lessons_completed: number;
  homework_completed: number;
  days_since_start: number | null;
};

// Profile
export type WizardSaveResult = {
  success: boolean;
  error?: string;
  avatarUrl?: string;
};

export type ProfileActionState = {
  error?: string;
  success?: string;
  fields?: Partial<ProfileFormValues>;
};

// Notifications
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

// Reviews
export type SubmitReviewState = {
  status: "idle" | "success" | "error";
  message?: string;
  review?: { author: string; quote: string; rating?: number | null };
};

export type ExistingReview = {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  displayName: string;
  createdAt: string;
  updatedAt: string | null;
};

export type TutorForReview = {
  tutorId: string;
  tutorSiteId: string;
  tutorUsername: string;
  tutorName: string;
  tutorAvatarUrl: string | null;
  completedLessonsCount: number;
  lastCompletedAt: string;
  hasExistingReview: boolean;
  existingReview?: ExistingReview;
};

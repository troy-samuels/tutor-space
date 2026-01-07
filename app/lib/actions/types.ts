import type { CalendarProvider } from "@/lib/calendar/config";
import type { PackageType } from "@/lib/types/calendar";
import type { ProfileFormValues } from "@/lib/validators/profile";

// Calendar
export type CalendarConnectionStatus = {
  provider: CalendarProvider;
  connected: boolean;
  accountEmail?: string | null;
  accountName?: string | null;
  lastSyncedAt?: string | null;
  syncStatus?: string;
  error?: string | null;
};

export type SchedulingPreferences = {
  maxLessonsPerDay: number | null;
  maxLessonsPerWeek: number | null;
  advanceBookingDaysMin: number;
  advanceBookingDaysMax: number;
  bufferTimeMinutes: number;
};

export type RecurringBlockedTime = {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  label: string | null;
  isActive: boolean;
  effectiveFrom: string | null;
  effectiveUntil: string | null;
  createdAt: string;
};

export type RecurringBlockedTimeInput = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  label?: string;
  isActive?: boolean;
  effectiveFrom?: string;
  effectiveUntil?: string;
};

export type TimeOffPeriod = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  allDay: boolean;
  startTime: string | null;
  endTime: string | null;
  showOnCalendar: boolean;
  blockBookings: boolean;
  createdAt: string;
};

export type TimeOffPeriodInput = {
  name: string;
  startDate: string;
  endDate: string;
  allDay?: boolean;
  startTime?: string;
  endTime?: string;
  showOnCalendar?: boolean;
  blockBookings?: boolean;
};

export type ExpandedRecurringBlock = {
  id: string;
  occurrenceDate: string;
  startTime: string;
  endTime: string;
  label: string | null;
};

export type DailyLesson = {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  meeting_url: string | null;
  meeting_provider: string | null;
  payment_status: string | null;
  packageType: PackageType;
  student: {
    id: string;
    full_name: string;
    email: string;
  } | null;
  service: {
    name: string;
  } | null;
};

export type DayBookingInfo = {
  count: number;
  packageTypes: PackageType[];
};

// Analytics
export type DemandSlot = {
  dayOfWeek: number;
  hourOfDay: number;
  bookingCount: number;
  demandLevel: "none" | "low" | "medium" | "high" | "very_high";
};

export type PeakTimeRecommendation = {
  dayOfWeek: number;
  hourOfDay: number;
  demandLevel: string;
  recommendation: string;
};

// AI Assistant
export interface AIConversation {
  id: string;
  user_id: string;
  user_role: "tutor" | "student";
  title: string | null;
  context_type: "general" | "lesson_prep" | "student_feedback" | "content_creation" | "scheduling" | null;
  is_active: boolean;
  message_count: number;
  created_at: string;
  updated_at: string;
}

export interface AIMessage {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  metadata: Record<string, unknown>;
  tokens_used: number | null;
  created_at: string;
}

export interface AIUsage {
  id: string;
  user_id: string;
  month: string;
  total_tokens: number;
  total_requests: number;
  total_conversations: number;
  created_at: string;
  updated_at: string;
}

// Copilot
export interface LessonBriefing {
  id: string;
  tutorId: string;
  studentId: string;
  bookingId: string;
  studentSummary: string | null;
  focusAreas: Array<{
    type: string;
    topic: string;
    reason: string;
    evidence: string;
    count?: number;
  }>;
  errorPatterns: Array<{
    type: string;
    count: number;
    examples: string[];
    severity: string;
    isL1Interference?: boolean;
  }>;
  suggestedActivities: Array<{
    title: string;
    description: string;
    durationMin: number;
    category: string;
    targetArea?: string;
  }>;
  srItemsDue: number;
  srItemsPreview: Array<{
    word: string;
    type: string;
    lastReviewed: string | null;
    repetitionCount: number;
  }>;
  goalProgress: {
    goalText: string;
    progressPct: number;
    targetDate: string | null;
    status: string;
  } | null;
  engagementTrend: "improving" | "stable" | "declining" | "new_student";
  engagementSignals: Array<{
    type: string;
    value: string | number;
    concern: boolean;
    description: string;
  }>;
  lessonsAnalyzed: number;
  lastLessonSummary: string | null;
  lastLessonDate: string | null;
  proficiencyLevel: string | null;
  nativeLanguage: string | null;
  targetLanguage: string | null;
  generatedAt: string;
  viewedAt: string | null;
  dismissedAt: string | null;
  student?: {
    id: string;
    fullName: string;
    email: string;
  };
  booking?: {
    id: string;
    scheduledAt: string;
    service?: {
      name: string;
      durationMinutes: number;
    };
  };
}

export interface PendingBriefingsResult {
  briefings: LessonBriefing[];
  count: number;
}

export interface CopilotSettings {
  enabled?: boolean;
  briefingsEnabled: boolean;
  briefingTiming?: string;
  briefingDelivery?: string;
  drillsEnabled?: boolean;
  summarizationEnabled?: boolean;
  defaultFocusAreas?: string[];
  minLessonsForBriefing?: number;
  autoGenerateHomework?: boolean;
  autoGenerateDrills?: boolean;
  engagementAlertsEnabled?: boolean;
  engagementAlertThresholdDays?: number;
}

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

// Booking Reschedule
export interface RescheduleHistoryItem {
  id: string;
  booking_id: string;
  previous_scheduled_at: string;
  new_scheduled_at: string;
  requested_by: "tutor" | "student";
  reason: string | null;
  created_at: string;
}

// Recurring Reservations
export type RecurringReservation = {
  id: string;
  tutorId: string;
  studentId: string;
  studentName: string | null;
  serviceId: string;
  serviceName: string | null;
  dayOfWeek: number;
  startTime: string;
  durationMinutes: number;
  timezone: string;
  effectiveFrom: string;
  effectiveUntil: string | null;
  isActive: boolean;
  autoCreateBookings: boolean;
  autoBookDaysAhead: number | null;
  createdAt: string;
};

export type RecurringReservationInput = {
  studentId: string;
  serviceId: string;
  dayOfWeek: number;
  startTime: string;
  durationMinutes?: number;
  timezone: string;
  effectiveFrom?: string;
  effectiveUntil?: string;
  autoCreateBookings?: boolean;
  autoBookDaysAhead?: number;
};

export type ReservedSlot = {
  reservationId: string;
  studentId: string;
  studentName: string | null;
  serviceId: string;
  serviceName: string | null;
  occurrenceDate: string;
  startTime: string;
  durationMinutes: number;
  timezone: string;
  isException: boolean;
  exceptionType: string | null;
};

export type ReservationException = {
  id: string;
  reservationId: string;
  occurrenceDate: string;
  exceptionType: "cancelled" | "rescheduled" | "skipped";
  rescheduledTo: string | null;
  reason: string | null;
  createdAt: string;
};

// Student Billing
export interface PaymentRecord {
  id: string;
  booking_id: string | null;
  digital_product_purchase_id: string | null;
  amount_cents: number;
  currency: string;
  payment_status: string;
  payment_method: string | null;
  stripe_payment_intent_id: string | null;
  created_at: string;
  booking?: {
    id: string;
    scheduled_at: string;
    duration_minutes: number;
    services: { name: string } | null;
  } | null;
  digital_product?: {
    id: string;
    title: string;
  } | null;
  tutor?: {
    full_name: string | null;
    email: string;
  } | null;
}

export interface PackagePurchaseRecord {
  id: string;
  total_price_cents: number;
  currency: string;
  remaining_minutes: number;
  status: string;
  expires_at: string | null;
  created_at: string;
  session_package_templates: {
    name: string;
    session_count: number;
    total_minutes: number;
  } | null;
  tutor?: {
    full_name: string | null;
    email: string;
  } | null;
}

export interface BillingSummary {
  totalSpent: number;
  currency: string;
  lessonsPurchased: number;
  productsPurchased: number;
  packagesPurchased: number;
}

// Digital Products
export type ProductFormState = {
  error?: string;
  success?: string;
};

// Availability
export type AvailabilityRecord = {
  id: string;
  tutor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
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

// Drills
export type DrillType = "pronunciation" | "grammar" | "vocabulary" | "fluency";
export type DrillStatus = "pending" | "assigned" | "in_progress" | "completed";

export interface ScrambleData {
  words: string[];
  solution?: string[];
}

export interface MatchData {
  pairs: Array<{ id: string; left: string; right: string }>;
}

export interface GapFillData {
  sentence: string;
  answer: string;
  options: string[];
}

export interface DrillContent {
  type: "scramble" | "match" | "gap-fill";
  prompt?: string;
  data: ScrambleData | MatchData | GapFillData;
}

export interface LessonDrill {
  id: string;
  recording_id: string | null;
  student_id: string;
  tutor_id: string;
  booking_id: string | null;
  homework_assignment_id: string | null;
  content: DrillContent;
  drill_type: DrillType;
  status: DrillStatus;
  focus_area: string | null;
  due_date: string | null;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
}

export interface DrillWithContext extends LessonDrill {
  tutor_name?: string;
  lesson_date?: string;
  homework_title?: string;
}

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

// Packages
export type ActivePackage = {
  id: string;
  name: string;
  remaining_minutes: number;
  expires_at: string | null;
  purchase_id: string;
  total_minutes: number;
  redeemed_minutes: number;
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

// Student Lessons
export interface LessonHistoryStats {
  total_lessons: number;
  total_minutes: number;
  next_lesson: {
    id: string;
    scheduled_at: string;
    service_name: string;
    meeting_url: string | null;
    duration_minutes: number;
  } | null;
  last_lesson: {
    id: string;
    scheduled_at: string;
    service_name: string;
    duration_minutes: number;
  } | null;
}

export interface Booking {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  meeting_url: string | null;
  service_name: string;
  lesson_notes?: string | null;
}

export interface StudentLessonHistoryData {
  stats: LessonHistoryStats;
  upcoming: Booking[];
  past: Booking[];
}

// Student Engagement
export type RiskStatus = "healthy" | "at_risk" | "critical" | "churned";

export type EngagementScore = {
  id: string;
  student_id: string;
  tutor_id: string;
  score: number;
  lesson_frequency_score: number;
  response_rate_score: number;
  homework_completion_score: number;
  practice_engagement_score: number;
  risk_status: RiskStatus;
  risk_status_override: RiskStatus | null;
  override_reason: string | null;
  override_at: string | null;
  override_by: string | null;
  days_since_last_lesson: number | null;
  days_since_last_message: number | null;
  last_computed_at: string;
  created_at: string;
  updated_at: string;
};

export type AtRiskStudent = {
  id: string;
  full_name: string;
  email: string;
  engagement_score: number;
  risk_status: RiskStatus;
  days_since_last_lesson: number | null;
  days_since_last_message: number | null;
  last_activity_at: string | null;
};

export type EngagementDashboard = {
  total_students: number;
  healthy_count: number;
  at_risk_count: number;
  critical_count: number;
  churned_count: number;
  average_score: number;
};

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

// Student Bookings
export type StudentPackage = {
  id: string;
  name: string;
  remaining_minutes: number;
  expires_at: string | null;
  purchase_id: string;
  total_minutes: number;
};

export type SubscriptionBalance = {
  lessonsAvailable: number;
  lessonsUsed: number;
  lessonsAllocated: number;
  lessonsRolledOver: number;
};

export type TutorBookingDetails = {
  tutor: TutorWithDetails;
  packages: StudentPackage[];
  subscription: {
    id: string;
    status: string;
    lessonsAvailable: number;
    lessonsPerMonth: number;
    currentPeriodEnd: string | null;
  } | null;
  existingBookings: { scheduled_at: string; duration_minutes: number; status: string }[];
};

export type GroupedSlots = {
  date: string;
  displayDate: string;
  slots: {
    start: string;
    end: string;
    displayTime: string;
  }[];
}[];

export type StudentPackageCredit = {
  purchaseId: string;
  tutorId: string;
  tutorName: string;
  tutorAvatar: string | null;
  packageName: string;
  remainingMinutes: number;
  totalMinutes: number;
  expiresAt: string | null;
};

export type StudentSubscriptionCredit = {
  subscriptionId: string;
  tutorId: string;
  tutorName: string;
  tutorAvatar: string | null;
  serviceName: string;
  lessonsAvailable: number;
  lessonsPerMonth: number;
  status: string;
  renewsAt: string | null;
};

export type TutorOffering = {
  tutorId: string;
  tutorName: string;
  tutorAvatar: string | null;
  hasPackages: boolean;
  hasSubscriptions: boolean;
};

import type { TutorWithDetails } from "./students";

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
  busyWindows?: { start: string; end: string }[];
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

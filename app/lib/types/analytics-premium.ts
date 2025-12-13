/**
 * Premium Analytics Types
 * Types for the Command Center analytics dashboard
 */

/**
 * Stripe Balance data from live API
 */
export type StripeBalanceData = {
  availableCents: number;
  pendingCents: number;
  currency: string;
  requiresAction: boolean;
  actionItems: string[];
};

/**
 * Revenue source breakdown for plan distribution visualization
 */
export type RevenueSourceBreakdown = {
  subscriptionCount: number;
  packageCount: number;
  adHocCount: number;
  totalActiveStudents: number;
  subscriptionPercentage: number;
  packagePercentage: number;
  adHocPercentage: number;
  estimatedMRR: number;
};

/**
 * Recent activity item for activity feed
 */
export type RecentActivityItem = {
  id: string;
  type: "booking" | "payment" | "student" | "subscription" | "package";
  title: string;
  subtitle: string;
  timestamp: string;
  amount?: number;
  currency?: string;
};

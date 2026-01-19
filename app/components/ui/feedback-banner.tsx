"use client";

import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export type FeedbackType = "success" | "error" | "warning" | "info";

interface FeedbackBannerProps {
  type: FeedbackType;
  message: string;
  title?: string;
  onDismiss?: () => void;
  className?: string;
  dismissible?: boolean;
}

const FEEDBACK_CONFIG: Record<
  FeedbackType,
  {
    icon: typeof CheckCircle;
    bgClass: string;
    textClass: string;
    iconClass: string;
    role: "alert" | "status";
  }
> = {
  success: {
    icon: CheckCircle,
    bgClass: "bg-emerald-50 border-emerald-200",
    textClass: "text-emerald-800",
    iconClass: "text-emerald-500",
    role: "status",
  },
  error: {
    icon: AlertCircle,
    bgClass: "bg-destructive/10 border-destructive/20",
    textClass: "text-destructive",
    iconClass: "text-destructive",
    role: "alert",
  },
  warning: {
    icon: AlertTriangle,
    bgClass: "bg-amber-50 border-amber-200",
    textClass: "text-amber-800",
    iconClass: "text-amber-500",
    role: "alert",
  },
  info: {
    icon: Info,
    bgClass: "bg-blue-50 border-blue-200",
    textClass: "text-blue-800",
    iconClass: "text-blue-500",
    role: "status",
  },
};

/**
 * FeedbackBanner Component
 *
 * A dismissible banner for displaying feedback messages.
 * Uses appropriate ARIA roles for accessibility:
 * - role="alert" for error/warning (immediately announced)
 * - role="status" for success/info (announced at next pause)
 *
 * @example
 * ```tsx
 * <FeedbackBanner
 *   type="success"
 *   message="Your changes have been saved."
 *   onDismiss={() => setFeedback(null)}
 * />
 * ```
 */
export function FeedbackBanner({
  type,
  message,
  title,
  onDismiss,
  className,
  dismissible = true,
}: FeedbackBannerProps) {
  const config = FEEDBACK_CONFIG[type];
  const Icon = config.icon;

  return (
    <div
      role={config.role}
      aria-live={config.role === "alert" ? "assertive" : "polite"}
      className={cn(
        "flex items-start gap-3 rounded-lg border p-4",
        config.bgClass,
        className
      )}
    >
      <Icon
        className={cn("h-5 w-5 flex-shrink-0 mt-0.5", config.iconClass)}
        aria-hidden="true"
      />

      <div className="flex-1 min-w-0">
        {title && (
          <p className={cn("font-semibold text-sm mb-1", config.textClass)}>
            {title}
          </p>
        )}
        <p className={cn("text-sm", config.textClass)}>{message}</p>
      </div>

      {dismissible && onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className={cn(
            "flex-shrink-0 rounded-md p-1 hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-offset-2",
            config.textClass
          )}
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

/**
 * InlineFeedback Component
 *
 * A compact inline feedback indicator for form fields or small areas.
 *
 * @example
 * ```tsx
 * <InlineFeedback type="error" message="Invalid email address" />
 * ```
 */
export function InlineFeedback({
  type,
  message,
  className,
}: {
  type: FeedbackType;
  message: string;
  className?: string;
}) {
  const config = FEEDBACK_CONFIG[type];
  const Icon = config.icon;

  return (
    <p
      role={config.role === "alert" ? "alert" : undefined}
      className={cn("flex items-center gap-1.5 text-sm", config.textClass, className)}
    >
      <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </p>
  );
}

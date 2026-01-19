"use client";

import { AlertCircle, CheckCircle, Info, AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type AlertStatus = "success" | "error" | "warning" | "info" | "loading";

interface StatusAlertProps {
  status: AlertStatus;
  title: string;
  message?: string;
  className?: string;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "ghost";
  }>;
  fullWidth?: boolean;
}

const STATUS_CONFIG: Record<
  AlertStatus,
  {
    icon: typeof CheckCircle;
    bgClass: string;
    borderClass: string;
    titleClass: string;
    messageClass: string;
    iconClass: string;
    animate?: boolean;
  }
> = {
  success: {
    icon: CheckCircle,
    bgClass: "bg-emerald-50",
    borderClass: "border-emerald-200",
    titleClass: "text-emerald-900",
    messageClass: "text-emerald-700",
    iconClass: "text-emerald-500",
  },
  error: {
    icon: AlertCircle,
    bgClass: "bg-red-50",
    borderClass: "border-red-200",
    titleClass: "text-red-900",
    messageClass: "text-red-700",
    iconClass: "text-red-500",
  },
  warning: {
    icon: AlertTriangle,
    bgClass: "bg-amber-50",
    borderClass: "border-amber-200",
    titleClass: "text-amber-900",
    messageClass: "text-amber-700",
    iconClass: "text-amber-500",
  },
  info: {
    icon: Info,
    bgClass: "bg-blue-50",
    borderClass: "border-blue-200",
    titleClass: "text-blue-900",
    messageClass: "text-blue-700",
    iconClass: "text-blue-500",
  },
  loading: {
    icon: Loader2,
    bgClass: "bg-slate-50",
    borderClass: "border-slate-200",
    titleClass: "text-slate-900",
    messageClass: "text-slate-700",
    iconClass: "text-slate-500",
    animate: true,
  },
};

/**
 * StatusAlert Component
 *
 * A full-width alert component with icon, title, message, and optional actions.
 * Suitable for page-level status indicators or important notifications.
 *
 * @example
 * ```tsx
 * <StatusAlert
 *   status="success"
 *   title="Payment successful"
 *   message="Your booking has been confirmed."
 *   actions={[
 *     { label: "View booking", onClick: () => router.push("/bookings") },
 *   ]}
 * />
 * ```
 */
export function StatusAlert({
  status,
  title,
  message,
  className,
  actions,
  fullWidth = true,
}: StatusAlertProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <div
      role={status === "error" || status === "warning" ? "alert" : "status"}
      aria-live={status === "error" ? "assertive" : "polite"}
      className={cn(
        "rounded-lg border p-4",
        config.bgClass,
        config.borderClass,
        fullWidth ? "w-full" : "w-auto inline-flex",
        className
      )}
    >
      <div className="flex items-start gap-4">
        <Icon
          className={cn(
            "h-6 w-6 flex-shrink-0",
            config.iconClass,
            config.animate && "animate-spin"
          )}
          aria-hidden="true"
        />

        <div className="flex-1 min-w-0">
          <h3 className={cn("font-semibold", config.titleClass)}>{title}</h3>

          {message && (
            <p className={cn("mt-1 text-sm", config.messageClass)}>{message}</p>
          )}

          {actions && actions.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {actions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant || "outline"}
                  size="sm"
                  onClick={action.onClick}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * CompactStatusAlert Component
 *
 * A more compact version of StatusAlert for inline use.
 *
 * @example
 * ```tsx
 * <CompactStatusAlert status="info" message="Syncing data..." />
 * ```
 */
export function CompactStatusAlert({
  status,
  message,
  className,
}: {
  status: AlertStatus;
  message: string;
  className?: string;
}) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <div
      role={status === "error" || status === "warning" ? "alert" : "status"}
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium",
        config.bgClass,
        config.titleClass,
        className
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4",
          config.iconClass,
          config.animate && "animate-spin"
        )}
        aria-hidden="true"
      />
      <span>{message}</span>
    </div>
  );
}

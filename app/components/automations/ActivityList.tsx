"use client";

import { Mail, CheckCircle, XCircle, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import type { AutomationEvent } from "@/lib/actions/automations";

interface ActivityListProps {
  activity: AutomationEvent[];
}

export function ActivityList({ activity }: ActivityListProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-base font-semibold text-gray-900 mb-4">
        Recent activity
      </h3>

      {activity.length === 0 ? (
        <div className="flex items-center gap-3 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100">
            <Mail className="h-4 w-4 text-gray-400" />
          </div>
          <div>
            <p className="text-sm text-gray-600">
              Your first message will appear here after your next lesson.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {activity.map((event) => (
            <ActivityItem key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}

function ActivityItem({ event }: { event: AutomationEvent }) {
  const studentName = event.students?.full_name || "Unknown student";
  const timeAgo = formatDistanceToNow(new Date(event.created_at), { addSuffix: true });

  const statusConfig = {
    sent: {
      icon: CheckCircle,
      color: "text-emerald-500",
      bgColor: "bg-emerald-50",
      label: "Sent to",
    },
    skipped: {
      icon: XCircle,
      color: "text-gray-400",
      bgColor: "bg-gray-100",
      label: "Skipped",
    },
    failed: {
      icon: XCircle,
      color: "text-red-500",
      bgColor: "bg-red-50",
      label: "Failed for",
    },
    pending: {
      icon: Clock,
      color: "text-amber-500",
      bgColor: "bg-amber-50",
      label: "Pending for",
    },
    processing: {
      icon: Clock,
      color: "text-blue-500",
      bgColor: "bg-blue-50",
      label: "Sending to",
    },
  };

  const config = statusConfig[event.status] || statusConfig.pending;
  const Icon = config.icon;

  // Build the reason suffix for skipped events
  let reasonSuffix = "";
  if (event.status === "skipped" && event.skipped_reason) {
    const reasons: Record<string, string> = {
      cooldown_active: "(cooldown)",
      student_mismatch: "(wrong student)",
      rule_inactive: "(rule inactive)",
    };
    reasonSuffix = ` ${reasons[event.skipped_reason] || `(${event.skipped_reason})`}`;
  }

  return (
    <div className="flex items-center gap-3 py-2">
      <div className={cn(
        "flex h-8 w-8 items-center justify-center rounded-full",
        config.bgColor
      )}>
        <Icon className={cn("h-4 w-4", config.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900 truncate">
          <span className="text-gray-500">{config.label}</span>{" "}
          <span className="font-medium">{studentName}</span>
          {reasonSuffix && (
            <span className="text-gray-400">{reasonSuffix}</span>
          )}
        </p>
      </div>
      <span className="text-xs text-gray-400 flex-shrink-0">
        {timeAgo}
      </span>
    </div>
  );
}

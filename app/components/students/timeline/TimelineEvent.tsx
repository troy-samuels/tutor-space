"use client";

import { formatDistanceToNow, format } from "date-fns";
import {
  UserPlus,
  PlayCircle,
  CheckCircle2,
  Check,
  CalendarPlus,
  CalendarCheck,
  CalendarX,
  CalendarClock,
  Send,
  MessageSquare,
  FileText,
  FileCheck,
  Upload,
  Mic,
  Target,
  Goal,
  Trophy,
  ClipboardCheck,
  DollarSign,
  Package,
  Repeat,
  RefreshCw,
  AlertTriangle,
  StickyNote,
  Tag,
  Sparkles,
  Award,
  Circle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TimelineEvent as TimelineEventType } from "@/lib/actions/types";

type TimelineEventProps = {
  event: TimelineEventType;
  isLast?: boolean;
};

const iconMap: Record<string, typeof Circle> = {
  student_created: UserPlus,
  onboarding_started: PlayCircle,
  onboarding_completed: CheckCircle2,
  onboarding_item_completed: Check,
  booking_created: CalendarPlus,
  booking_completed: CalendarCheck,
  booking_cancelled: CalendarX,
  booking_rescheduled: CalendarClock,
  message_sent: Send,
  message_received: MessageSquare,
  homework_assigned: FileText,
  homework_completed: FileCheck,
  homework_submitted: Upload,
  practice_session_completed: Mic,
  drill_completed: Target,
  goal_created: Goal,
  goal_completed: Trophy,
  assessment_recorded: ClipboardCheck,
  payment_received: DollarSign,
  package_purchased: Package,
  subscription_started: Repeat,
  status_changed: RefreshCw,
  risk_status_changed: AlertTriangle,
  note_added: StickyNote,
  label_added: Tag,
  label_removed: Tag,
  first_lesson: Sparkles,
  lesson_milestone: Award,
};

const colorMap: Record<string, string> = {
  student_created: "bg-blue-100 text-blue-600",
  onboarding_started: "bg-purple-100 text-purple-600",
  onboarding_completed: "bg-green-100 text-green-600",
  onboarding_item_completed: "bg-green-50 text-green-500",
  booking_created: "bg-blue-100 text-blue-600",
  booking_completed: "bg-green-100 text-green-600",
  booking_cancelled: "bg-red-100 text-red-600",
  booking_rescheduled: "bg-yellow-100 text-yellow-600",
  message_sent: "bg-blue-50 text-blue-500",
  message_received: "bg-blue-50 text-blue-500",
  homework_assigned: "bg-orange-100 text-orange-600",
  homework_completed: "bg-green-100 text-green-600",
  homework_submitted: "bg-blue-100 text-blue-600",
  practice_session_completed: "bg-purple-100 text-purple-600",
  drill_completed: "bg-purple-50 text-purple-500",
  goal_created: "bg-blue-100 text-blue-600",
  goal_completed: "bg-green-100 text-green-600",
  assessment_recorded: "bg-blue-100 text-blue-600",
  payment_received: "bg-green-100 text-green-600",
  package_purchased: "bg-green-100 text-green-600",
  subscription_started: "bg-blue-100 text-blue-600",
  status_changed: "bg-gray-100 text-gray-600",
  risk_status_changed: "bg-orange-100 text-orange-600",
  note_added: "bg-yellow-100 text-yellow-600",
  label_added: "bg-blue-50 text-blue-500",
  label_removed: "bg-gray-100 text-gray-500",
  first_lesson: "bg-yellow-100 text-yellow-600",
  lesson_milestone: "bg-yellow-100 text-yellow-600",
};

export function TimelineEvent({ event, isLast = false }: TimelineEventProps) {
  const Icon = iconMap[event.event_type] ?? Circle;
  const colorClass = colorMap[event.event_type] ?? "bg-gray-100 text-gray-600";

  const eventDate = new Date(event.event_at);
  const relativeTime = formatDistanceToNow(eventDate, { addSuffix: true });
  const fullDate = format(eventDate, "MMM d, yyyy 'at' h:mm a");

  return (
    <div className="flex gap-3">
      {/* Timeline line and icon */}
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
            colorClass,
            event.is_milestone && "ring-2 ring-offset-2 ring-yellow-400"
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        {!isLast && (
          <div className="w-px flex-1 bg-border mt-2" />
        )}
      </div>

      {/* Event content */}
      <div className={cn("flex-1 pb-6", isLast && "pb-0")}>
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <p className={cn(
              "text-sm font-medium leading-none",
              event.is_milestone && "text-yellow-700"
            )}>
              {event.event_title}
              {event.is_milestone && (
                <Sparkles className="inline-block h-3.5 w-3.5 ml-1 text-yellow-500" />
              )}
            </p>
            {event.event_description && (
              <p className="text-sm text-muted-foreground">
                {event.event_description}
              </p>
            )}
          </div>
          <time
            className="text-xs text-muted-foreground whitespace-nowrap"
            title={fullDate}
          >
            {relativeTime}
          </time>
        </div>

        {/* Metadata badges */}
        {event.event_metadata && Object.keys(event.event_metadata).length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {"scheduled_at" in event.event_metadata && event.event_metadata.scheduled_at != null && (
              <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs">
                {format(new Date(String(event.event_metadata.scheduled_at)), "MMM d 'at' h:mm a")}
              </span>
            )}
            {"duration_minutes" in event.event_metadata && event.event_metadata.duration_minutes != null && (
              <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs">
                {String(event.event_metadata.duration_minutes)} min
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

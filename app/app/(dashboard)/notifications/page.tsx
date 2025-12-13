"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell,
  CalendarPlus,
  CalendarCheck,
  CalendarX,
  DollarSign,
  AlertCircle,
  MessageSquare,
  Reply,
  UserPlus,
  UserCheck,
  Package,
  Clock,
  Star,
  CheckCircle,
  Megaphone,
  UserCog,
  Trash2,
  Check,
  Loader2,
  BookOpen,
  ClipboardCheck,
  Sparkles,
} from "lucide-react";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  type Notification,
  type NotificationType,
} from "@/lib/actions/notifications";
import { formatDistanceToNow, format } from "date-fns";

const iconMap: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
  booking_new: CalendarPlus,
  booking_confirmed: CalendarCheck,
  booking_cancelled: CalendarX,
  booking_reminder: Bell,
  payment_received: DollarSign,
  payment_failed: AlertCircle,
  message_new: MessageSquare,
  message_reply: Reply,
  student_new: UserPlus,
  student_access_request: UserCheck,
  package_purchased: Package,
  package_expiring: Clock,
  review_received: Star,
  review_approved: CheckCircle,
  system_announcement: Megaphone,
  account_update: UserCog,
  homework_assigned: BookOpen,
  homework_due_reminder: Clock,
  homework_submission_received: ClipboardCheck,
  drill_assigned: Sparkles,
  drill_due_reminder: Sparkles,
};

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [markingAllRead, setMarkingAllRead] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    setLoading(true);
    const result = await getNotifications({ limit: 100 });
    setNotifications(result.notifications);
    setUnreadCount(result.unreadCount);
    setLoading(false);
  }

  async function handleMarkAsRead(notification: Notification) {
    if (!notification.read) {
      await markNotificationAsRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    if (notification.link) {
      router.push(notification.link);
    }
  }

  async function handleMarkAllAsRead() {
    setMarkingAllRead(true);
    await markAllNotificationsAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    setMarkingAllRead(false);
  }

  async function handleDelete(notificationId: string) {
    const notification = notifications.find((n) => n.id === notificationId);
    await deleteNotification(notificationId);
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    if (notification && !notification.read) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  }

  const getIcon = (type: NotificationType) => {
    const IconComponent = iconMap[type] || Bell;
    return <IconComponent className="h-5 w-5" />;
  };

  const filteredNotifications =
    filter === "unread"
      ? notifications.filter((n) => !n.read)
      : notifications;

  // Group notifications by date
  const groupedNotifications = filteredNotifications.reduce(
    (groups, notification) => {
      const date = format(new Date(notification.created_at), "yyyy-MM-dd");
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(notification);
      return groups;
    },
    {} as Record<string, Notification[]>
  );

  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (format(date, "yyyy-MM-dd") === format(today, "yyyy-MM-dd")) {
      return "Today";
    }
    if (format(date, "yyyy-MM-dd") === format(yesterday, "yyyy-MM-dd")) {
      return "Yesterday";
    }
    return format(date, "EEEE, MMMM d");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
              : "You're all caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            onClick={handleMarkAllAsRead}
            disabled={markingAllRead}
          >
            {markingAllRead ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            Mark all as read
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <Tabs value={filter} onValueChange={(v) => setFilter(v as "all" | "unread")}>
            <TabsList>
              <TabsTrigger value="all">
                All ({notifications.length})
              </TabsTrigger>
              <TabsTrigger value="unread">
                Unread ({unreadCount})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-4 p-4 border rounded-lg">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-lg font-medium text-muted-foreground">
                {filter === "unread" ? "No unread notifications" : "No notifications yet"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {filter === "unread"
                  ? "You've read all your notifications"
                  : "We'll notify you when something important happens"}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedNotifications).map(([date, items]) => (
                <div key={date}>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    {formatDateHeader(date)}
                  </h3>
                  <div className="space-y-2">
                    {items.map((notification) => (
                      <div
                        key={notification.id}
                        className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${
                          !notification.read
                            ? "bg-primary/5 border-primary/20"
                            : "hover:bg-muted/50"
                        }`}
                      >
                        <div
                          className={`rounded-full p-2.5 ${
                            !notification.read
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {getIcon(notification.type)}
                        </div>

                        <button
                          className="flex-1 text-left"
                          onClick={() => handleMarkAsRead(notification)}
                        >
                          <p
                            className={`text-sm ${
                              !notification.read ? "font-medium" : ""
                            }`}
                          >
                            {notification.title}
                          </p>
                          {notification.body && (
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {notification.body}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1.5">
                            {formatDistanceToNow(new Date(notification.created_at), {
                              addSuffix: true,
                            })}
                          </p>
                        </button>

                        <div className="flex items-center gap-2">
                          {!notification.read && (
                            <div className="h-2 w-2 rounded-full bg-primary" />
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDelete(notification.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

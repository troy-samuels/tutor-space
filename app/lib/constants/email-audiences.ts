export const emailAudiences = [
  {
    id: "all",
    label: "All students",
    description: "Send to every student associated with your tutor profile.",
    helper: "Best for announcements or schedule changes.",
  },
  {
    id: "active",
    label: "Active students",
    description: "Students marked as actively taking lessons.",
    helper: "Great for homework follow-ups or upsells.",
  },
  {
    id: "inactive",
    label: "Inactive students",
    description: "Students marked inactive to re-engage warm leads.",
    helper: "Use reactivation offers or new program alerts.",
  },
  {
    id: "paused",
    label: "Paused students",
    description: "Students you’ve paused temporarily.",
    helper: "Remind them you’re ready whenever they are.",
  },
  {
    id: "inactive_30",
    label: "Inactive 30+ days",
    description: "Students without a lesson in the last 30 days.",
    helper: "Perfect for re-engagement offers.",
  },
  {
    id: "never_booked",
    label: "Never booked",
    description: "Leads who haven’t booked a lesson yet.",
    helper: "Nurture trial lesson conversions.",
  },
] as const;

export type EmailAudienceId = (typeof emailAudiences)[number]["id"];

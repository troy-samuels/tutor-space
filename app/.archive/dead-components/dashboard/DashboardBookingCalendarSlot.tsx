"use client";

import dynamic from "next/dynamic";

type Props = {
  signupDate?: string | null;
  selectedDate?: Date | null;
  onDateSelect?: (date: Date) => void;
};

const DashboardBookingCalendarLazy = dynamic(
  () =>
    import("@/components/dashboard/dashboard-booking-calendar").then(
      (mod) => mod.DashboardBookingCalendar
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-[520px] w-full animate-pulse rounded-3xl bg-muted/30" />
    ),
  }
);

export function DashboardBookingCalendarSlot(props: Props) {
  return <DashboardBookingCalendarLazy {...props} />;
}

import { listBookings } from "@/lib/actions/bookings";
import { listStudents } from "@/lib/actions/students";
import { getAvailability } from "@/lib/actions/availability";
import { createClient } from "@/lib/supabase/server";
import { BookingDashboard } from "@/components/bookings/booking-dashboard";
import { getCalendarBusyWindows } from "@/lib/calendar/busy-windows";
import { addDays } from "date-fns";

type ServiceSummary = {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
  currency: string;
};

type ServiceRow = ServiceSummary & { is_active: boolean };

export default async function BookingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const tutorId = user?.id ?? "";

  const [bookings, studentsResponse] = await Promise.all([listBookings(), listStudents()]);

  const servicesResponse = await supabase
    .from("services")
    .select("id, name, duration_minutes, is_active, price_amount, price_currency, price, currency")
    .order("name", { ascending: true });

  const profileResponse = await supabase
    .from("profiles")
    .select("timezone, buffer_time_minutes")
    .eq("id", tutorId)
    .maybeSingle<{ timezone: string | null; buffer_time_minutes: number | null }>();

  const availabilityResponse = await getAvailability();
  const startRange = addDays(new Date(), -1);
  const endRange = addDays(new Date(), 15);
  const [busyWindowsExternal, blockedTimesResult] = await Promise.all([
    tutorId ? getCalendarBusyWindows({ tutorId, start: startRange, days: 16 }) : Promise.resolve([]),
    supabase
      .from("blocked_times")
      .select("start_time, end_time")
      .eq("tutor_id", tutorId)
      .lt("start_time", endRange.toISOString())
      .gt("end_time", startRange.toISOString()),
  ]);
  const busyWindows = [
    ...(busyWindowsExternal ?? []),
    ...(blockedTimesResult.data ?? [])
      .filter((block) => block.start_time && block.end_time)
      .map((block) => ({ start: block.start_time, end: block.end_time })),
  ];

  const serviceRows = (servicesResponse.data ?? []) as Array<{
    id: string;
    name: string;
    duration_minutes: number;
    is_active: boolean;
    price_amount?: number | null;
    price_currency?: string | null;
    price?: number | null;
    currency?: string | null;
  }>;
  const activeServices: ServiceSummary[] = serviceRows
    .filter((service) => service.is_active)
    .map((service) => ({
      id: service.id,
      name: service.name,
      duration_minutes: service.duration_minutes,
      price: service.price_amount ?? service.price ?? 0,
      currency: service.price_currency ?? service.currency ?? "USD",
    }));
  const timezone = profileResponse.data?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const bufferMinutes = profileResponse.data?.buffer_time_minutes ?? 0;
  const availability = availabilityResponse.slots.map((slot) => ({
    day_of_week: slot.day_of_week,
    start_time: slot.start_time,
    end_time: slot.end_time,
    is_available: slot.is_available,
    id: slot.id,
  }));

  return (
    <BookingDashboard
      bookings={bookings}
      students={studentsResponse}
      services={activeServices}
      timezone={timezone}
      availability={availability}
      busyWindows={busyWindows}
      bufferMinutes={bufferMinutes}
      tutorId={tutorId}
    />
  );
}

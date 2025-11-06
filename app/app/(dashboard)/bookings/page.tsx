import { listBookings } from "@/lib/actions/bookings";
import { listStudents } from "@/lib/actions/students";
import { getAvailability } from "@/lib/actions/availability";
import { createClient } from "@/lib/supabase/server";
import { BookingDashboard } from "@/components/bookings/booking-dashboard";

type ServiceSummary = {
  id: string;
  name: string;
  duration_minutes: number;
};

export default async function BookingsPage() {
  const supabase = await createClient();
  const [bookings, studentsResponse, servicesResponse, profileResponse, availabilityResponse] =
    await Promise.all([
      listBookings(),
      listStudents(),
      supabase
        .from("services")
        .select("id, name, duration_minutes, is_active")
        .order("name", { ascending: true }) as Promise<{
        data: Array<ServiceSummary & { is_active: boolean }> | null;
      }>,
      supabase
        .from("profiles")
        .select("timezone")
        .eq("id", (await supabase.auth.getUser()).data.user?.id ?? "")
        .maybeSingle<{ timezone: string | null }>(),
      getAvailability(),
    ]);

  const activeServices = (servicesResponse.data ?? []).filter((service) => service.is_active);
  const timezone = profileResponse.data?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
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
    />
  );
}

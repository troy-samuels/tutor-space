import { listBookings } from "@/lib/actions/bookings";
import { createClient } from "@/lib/supabase/server";
import { BookingDashboard } from "@/components/bookings/booking-dashboard";

export default async function BookingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const tutorId = user?.id ?? "";

  const [bookings, profileResponse] = await Promise.all([
    listBookings(),
    supabase
      .from("profiles")
      .select("timezone")
      .eq("id", tutorId)
      .maybeSingle<{ timezone: string | null }>(),
  ]);

  const timezone = profileResponse.data?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <BookingDashboard
      bookings={bookings}
      timezone={timezone}
      tutorId={tutorId}
    />
  );
}

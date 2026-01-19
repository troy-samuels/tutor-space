import { useEffect, useMemo, useState } from "react";
import type { BookingRecord } from "@/lib/actions/bookings";

export function useBookingList(initialBookings: BookingRecord[]) {
  const [bookingList, setBookingList] = useState<BookingRecord[]>(initialBookings);

  useEffect(() => {
    setBookingList(initialBookings);
  }, [initialBookings]);

  const today = useMemo(() => new Date(), []);

  const todaysLessons = useMemo(() => {
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    return bookingList
      .filter((booking) => {
        const bookingDate = new Date(booking.scheduled_at);
        return bookingDate >= todayStart && bookingDate <= todayEnd;
      })
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
  }, [bookingList, today]);

  const upcomingBookings = useMemo(
    () => bookingList.filter((booking) => new Date(booking.scheduled_at).getTime() >= Date.now()),
    [bookingList]
  );

  const pastBookings = useMemo(
    () => bookingList.filter((booking) => new Date(booking.scheduled_at).getTime() < Date.now()),
    [bookingList]
  );

  return {
    bookingList,
    setBookingList,
    today,
    todaysLessons,
    upcomingBookings,
    pastBookings,
  };
}

import { redirect, notFound } from "next/navigation";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { getBookingByShortCode } from "@/lib/repositories/bookings";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Joining Classroom | TutorLingua",
  description: "Redirecting to your lesson...",
};

type Props = {
  params: Promise<{ shortCode: string }>;
};

/**
 * Short code redirect route for memorable classroom URLs
 * Redirects /c/fluent-parrot-42 → /classroom/[bookingId]
 */
export default async function ShortCodeRedirect({ params }: Props) {
  const { shortCode } = await params;

  // Validate short code format
  const validFormat = /^[a-z]+-[a-z]+-\d{1,4}$/.test(shortCode);
  if (!validFormat) {
    notFound();
  }

  const adminClient = createServiceRoleClient();
  if (!adminClient) {
    notFound();
  }

  // Look up booking by short code
  const booking = await getBookingByShortCode(adminClient, shortCode);

  if (!booking) {
    notFound();
  }

  // Redirect to the full classroom URL
  redirect(`/classroom/${booking.id}`);
}

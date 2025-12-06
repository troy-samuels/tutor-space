import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";

interface CancelledPageProps {
  searchParams: Promise<{
    booking_id?: string;
  }>;
}

export default async function BookingCancelledPage({ searchParams }: CancelledPageProps) {
  const { booking_id } = await searchParams;
  const t = await getTranslations("bookingCancelledPage");

  let tutorUsername = "";

  // Try to get tutor info from booking if booking_id is provided
  if (booking_id) {
    const adminClient = createServiceRoleClient();

    if (adminClient) {
      const { data: booking } = await adminClient
        .from("bookings")
        .select(`
          tutor_id,
          profiles!bookings_tutor_id_fkey (
            username
          )
        `)
        .eq("id", booking_id)
        .single();

      if (booking) {
        const tutorProfile = Array.isArray(booking.profiles)
          ? booking.profiles[0]
          : booking.profiles;
        tutorUsername = tutorProfile?.username || "";
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg border border-gray-200 p-8 md:p-12 text-center">
          {/* Cancelled Icon */}
          <div className="mb-6">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
              <svg
                className="w-8 h-8 text-gray-600"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {t("title")}
          </h1>

          <p className="text-gray-600 mb-8">
            {t("message")}
          </p>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8 text-left">
            <p className="text-sm text-yellow-800">
              <strong>{t("note")}</strong> {t("noteBody")}
            </p>
          </div>

          <div className="space-y-3">
            {tutorUsername && (
              <Link
                href={`/book/${tutorUsername}`}
                className="block w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                {t("tryAgain")}
              </Link>
            )}

            <Link
              href="/"
              className="block w-full px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              {t("backHome")}
            </Link>
          </div>

          {booking_id && (
            <p className="text-xs text-gray-500 mt-6">
              {t("reference", { bookingId: booking_id })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

import { createServiceRoleClient } from "@/lib/supabase/admin";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { RequestRefundButton } from "@/components/refunds/RequestRefundButton";

interface SuccessPageProps {
  searchParams: Promise<{
    session_id?: string;
    booking_id?: string;
  }>;
}

type TutorProfileInfo = {
  full_name: string | null;
  email: string | null;
  timezone: string | null;
  payment_instructions: string | null;
  venmo_handle: string | null;
  paypal_email: string | null;
  zelle_phone: string | null;
  stripe_payment_link: string | null;
  custom_payment_url: string | null;
  custom_video_name: string | null;
} | null;

type BookingSuccessRecord = {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  timezone: string;
  status: string | null;
  payment_status: string | null;
  payment_amount: number | null;
  currency: string | null;
  tutor_id: string;
  student_id: string | null;
  meeting_provider: string | null;
  meeting_url: string | null;
  students: {
    full_name: string | null;
    email: string | null;
  } | null;
  services: {
    name: string | null;
  } | null;
  profiles: TutorProfileInfo | TutorProfileInfo[] | null;
};

export default async function BookingSuccessPage({ searchParams }: SuccessPageProps) {
  const { booking_id } = await searchParams;
  const t = await getTranslations("bookingSuccessPage");

  if (!booking_id) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold mb-4">{t("notFoundTitle")}</h1>
          <p className="text-gray-600">
            {t("notFoundBody")}
          </p>
        </div>
      </div>
    );
  }

  const adminClient = createServiceRoleClient();

  if (!adminClient) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold mb-4">{t("serviceUnavailableTitle")}</h1>
          <p className="text-gray-600">
            {t("serviceUnavailableBody")}
          </p>
        </div>
      </div>
    );
  }

  // Get booking details with tutor payment info
  const { data: bookingData } = await adminClient
    .from("bookings")
    .select(`
      id,
      scheduled_at,
      duration_minutes,
      timezone,
      status,
      payment_status,
      payment_amount,
      currency,
      tutor_id,
      student_id,
      meeting_provider,
      meeting_url,
      students (
        full_name,
        email
      ),
      services (
        name
      ),
      profiles!bookings_tutor_id_fkey (
        full_name,
        email,
        timezone,
        payment_instructions,
        venmo_handle,
        paypal_email,
        zelle_phone,
        stripe_payment_link,
        custom_payment_url,
        custom_video_name
      )
    `)
    .eq("id", booking_id)
    .single();

  const booking = (bookingData ?? null) as BookingSuccessRecord | null;

  // Also get meeting_url and meeting_provider from booking
  const meetingUrl = booking?.meeting_url ?? null;
  const meetingProvider = booking?.meeting_provider ?? null;

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold mb-4">{t("notFoundTitle")}</h1>
          <p className="text-gray-600">
            {t("notFoundBody")}
          </p>
        </div>
      </div>
    );
  }

  const tutorProfile = Array.isArray(booking.profiles)
    ? booking.profiles[0] ?? null
    : booking.profiles;

  const zonedStart = toZonedTime(
    new Date(booking.scheduled_at),
    booking.timezone
  );
  const zonedEnd = new Date(zonedStart.getTime() + booking.duration_minutes * 60000);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-lg border border-gray-200 p-8 md:p-12 text-center">
          {/* Success Icon */}
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {booking.payment_status === "paid" ? t("confirmedTitle") : t("requestReceivedTitle")}
          </h1>

          <p className="text-gray-600 mb-8">
            {booking.payment_status === "paid"
              ? t.rich("paidDescription", {
                  email: booking.students?.email ?? "",
                  strong: (chunks) => <strong>{chunks}</strong>,
                })
              : t.rich("unpaidDescription", {
                  email: booking.students?.email ?? "",
                  strong: (chunks) => <strong>{chunks}</strong>,
                })}
          </p>

          {/* Booking Details */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
            <h2 className="font-semibold text-lg mb-4">{t("detailsTitle")}</h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">{t("tutor")}</span>
                <span className="font-medium">{tutorProfile?.full_name}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">{t("service")}</span>
                <span className="font-medium">{booking.services?.name}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">{t("student")}</span>
                <span className="font-medium">{booking.students?.full_name}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">{t("date")}</span>
                <span className="font-medium">
                  {format(zonedStart, "EEEE, MMMM d, yyyy")}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">{t("time")}</span>
                <span className="font-medium">
                  {format(zonedStart, "h:mm a")} - {format(zonedEnd, "h:mm a")}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">{t("timezone")}</span>
                <span className="font-medium">{booking.timezone}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">{t("duration")}</span>
                <span className="font-medium">{booking.duration_minutes} minutes</span>
              </div>

              {booking.payment_amount && (
                <div className="flex justify-between pt-3 border-t border-gray-200">
                  <span className="text-gray-600">{t("lessonPrice")}</span>
                  <span className="font-bold">
                    {booking.currency?.toUpperCase()} {booking.payment_amount}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Meeting Link */}
          {meetingUrl && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 text-left">
              <h3 className="font-semibold text-blue-900 mb-3">🎥 {t("joinLesson")}</h3>
              <p className="text-sm text-blue-800 mb-4">
                {t("meetingOn", {
                  provider:
                    meetingProvider === "zoom_personal"
                      ? "Zoom"
                      : meetingProvider === "google_meet"
                        ? "Google Meet"
                        : meetingProvider === "calendly"
                          ? "Calendly"
                          : meetingProvider === "custom"
                            ? tutorProfile?.custom_video_name || "Video Platform"
                            : "Video call",
                })}
              </p>
              <a
                href={meetingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                {t("joinMeeting")}
              </a>
              <p className="text-xs text-blue-600 mt-3 break-all">{meetingUrl}</p>
            </div>
          )}

          {/* Payment Instructions (only show for unpaid bookings) */}
          {booking.payment_status !== "paid" && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8 text-left">
              <h3 className="font-semibold text-yellow-900 mb-3">💳 {t("paymentInstructionsTitle")}</h3>

              {tutorProfile?.payment_instructions ||
               tutorProfile?.venmo_handle ||
               tutorProfile?.paypal_email ||
               tutorProfile?.zelle_phone ||
               tutorProfile?.stripe_payment_link ||
               tutorProfile?.custom_payment_url ? (
              <div className="space-y-3 text-sm">
                {tutorProfile?.payment_instructions && (
                  <div className="text-yellow-800 mb-3 pb-3 border-b border-yellow-200">
                    <p className="whitespace-pre-line">{tutorProfile?.payment_instructions}</p>
                  </div>
                )}

                {tutorProfile?.venmo_handle && (
                  <div>
                    <span className="text-yellow-700 font-medium">Venmo: </span>
                    <span className="text-yellow-900">@{tutorProfile?.venmo_handle}</span>
                  </div>
                )}

                {tutorProfile?.paypal_email && (
                  <div>
                    <span className="text-yellow-700 font-medium">PayPal: </span>
                    <a
                      href={`https://paypal.me/${tutorProfile?.paypal_email}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {tutorProfile?.paypal_email}
                    </a>
                  </div>
                )}

                {tutorProfile?.zelle_phone && (
                  <div>
                    <span className="text-yellow-700 font-medium">Zelle: </span>
                    <span className="text-yellow-900">{tutorProfile?.zelle_phone}</span>
                  </div>
                )}

                {tutorProfile?.stripe_payment_link && (
                  <div>
                    <a
                      href={tutorProfile?.stripe_payment_link ?? undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      Pay via Stripe →
                    </a>
                  </div>
                )}

                {tutorProfile?.custom_payment_url && (
                  <div>
                    <a
                      href={tutorProfile?.custom_payment_url ?? undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Pay Now →
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-yellow-800">
                {t.rich("paymentInstructionsFallback", {
                  email: booking.students?.email ?? "",
                  strong: (chunks) => <strong>{chunks}</strong>,
                })}
              </p>
            )}
            </div>
          )}

          {/* Payment Confirmation (only show for paid bookings) */}
          {booking.payment_status === "paid" && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8 text-left">
              <h3 className="font-semibold text-green-900 mb-3">✅ {t("paymentConfirmedTitle")}</h3>
              <p className="text-sm text-green-800">
                {t("paymentConfirmedBody")}
              </p>
              {booking.payment_amount && (
                <div className="mt-3 text-sm">
                  <span className="text-green-700 font-medium">{t("amountPaid")} </span>
                  <span className="text-green-900 font-bold">
                    {booking.currency?.toUpperCase()} {(booking.payment_amount / 100).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Next Steps */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 text-left">
            <h3 className="font-semibold text-blue-900 mb-3">{t("whatsNextTitle")}</h3>
            <ul className="text-sm text-blue-800 space-y-2">
              {booking.payment_status !== "paid" && (
                <>
                  <li className="flex gap-2">
                    <span>1.</span>
                    <span>{t("stepPay1")}</span>
                  </li>
                  <li className="flex gap-2">
                    <span>2.</span>
                    <span>{t("stepPay2")}</span>
                  </li>
                  <li className="flex gap-2">
                    <span>3.</span>
                    <span>{t("stepPay3")}</span>
                  </li>
                  <li className="flex gap-2">
                    <span>4.</span>
                    <span>{t("stepPay4")}</span>
                  </li>
                </>
              )}
              {booking.payment_status === "paid" && (
                <>
                  <li className="flex gap-2">
                    <span>1.</span>
                    <span>{t("stepPaid1")}</span>
                  </li>
                  <li className="flex gap-2">
                    <span>2.</span>
                    <span>{t("stepPaid2")}</span>
                  </li>
                  <li className="flex gap-2">
                    <span>3.</span>
                    <span>{t("stepPaid3")}</span>
                  </li>
                  <li className="flex gap-2">
                    <span>4.</span>
                    <span>{t("stepPaid4")}</span>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Action Button */}
          <div className="flex items-center gap-3 justify-center">
            <Link
              href="/"
              className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              {t("backHome")}
            </Link>
            {booking.payment_status === "paid" && booking.student_id && (
              <RequestRefundButton
                tutorId={booking.tutor_id}
                bookingId={booking.id}
                amountCents={booking.payment_amount ?? 0}
                currency={booking.currency ?? "USD"}
                actor="student"
              />
            )}
          </div>

          <p className="text-xs text-gray-500 mt-6">
            {t("bookingId", { bookingId: booking.id })}
          </p>
        </div>
      </div>
    </div>
  );
}

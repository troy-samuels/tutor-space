import { formatInTimeZone } from "date-fns-tz";

interface TutorBookingConfirmedEmailProps {
  tutorName: string;
  studentName: string;
  studentEmail: string;
  studentPhone?: string;
  serviceName: string;
  scheduledAt: string;
  durationMinutes: number;
  timezone: string;
  amount: number;
  currency: string;
  notes?: string;
  meetingUrl?: string;
  meetingProvider?: string;
  customVideoName?: string;
  dashboardUrl?: string;
  paymentStatusLabel?: string;
}

function getMeetingProviderName(provider?: string, customName?: string | null) {
  switch (provider) {
    case "zoom_personal":
      return "Zoom";
    case "google_meet":
      return "Google Meet";
    case "microsoft_teams":
      return "Microsoft Teams";
    case "calendly":
      return "Calendly";
    case "livekit":
      return "Classroom";
    case "custom":
      return customName || "Video Platform";
    default:
      return null;
  }
}

export function TutorBookingConfirmedEmail({
  tutorName,
  studentName,
  studentEmail,
  studentPhone,
  serviceName,
  scheduledAt,
  durationMinutes,
  timezone,
  amount,
  currency,
  notes,
  meetingUrl,
  meetingProvider,
  customVideoName,
  dashboardUrl,
  paymentStatusLabel,
}: TutorBookingConfirmedEmailProps) {
  const formattedDate = formatInTimeZone(scheduledAt, timezone, "EEEE, MMMM d, yyyy");
  const formattedTime = formatInTimeZone(scheduledAt, timezone, "h:mm a zzz");
  const providerName = getMeetingProviderName(meetingProvider, customVideoName);
  const resolvedPaymentStatus =
    paymentStatusLabel || (amount === 0 ? "Free lesson" : "Paid");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmed</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">

          <tr>
            <td style="background: linear-gradient(135deg, #1E3A8A 0%, #1E40AF 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Booking Confirmed</h1>
              <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Your lesson is confirmed and ready</p>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px 30px;">

              <p style="margin: 0 0 20px 0; color: #333; font-size: 16px; line-height: 1.6;">
                Hi ${tutorName},
              </p>

              <p style="margin: 0 0 30px 0; color: #333; font-size: 16px; line-height: 1.6;">
                ${studentName}'s lesson is confirmed. Here are the details:
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9f9f9; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                <tr>
                  <td style="padding-bottom: 15px;">
                    <strong style="color: #1E3A8A; font-size: 14px; display: block; margin-bottom: 5px;">STUDENT</strong>
                    <span style="color: #333; font-size: 16px;">${studentName}</span><br>
                    <a href="mailto:${studentEmail}" style="color: #1E3A8A; text-decoration: none; font-size: 14px;">${studentEmail}</a>
                    ${studentPhone ? `<br><span style="color: #666; font-size: 14px;">${studentPhone}</span>` : ""}
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 15px;">
                    <strong style="color: #1E3A8A; font-size: 14px; display: block; margin-bottom: 5px;">SERVICE</strong>
                    <span style="color: #333; font-size: 16px;">${serviceName}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 15px;">
                    <strong style="color: #1E3A8A; font-size: 14px; display: block; margin-bottom: 5px;">DATE & TIME</strong>
                    <span style="color: #333; font-size: 16px;">${formattedDate}</span><br>
                    <span style="color: #333; font-size: 16px;">${formattedTime}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 15px;">
                    <strong style="color: #1E3A8A; font-size: 14px; display: block; margin-bottom: 5px;">DURATION</strong>
                    <span style="color: #333; font-size: 16px;">${durationMinutes} minutes</span>
                  </td>
                </tr>
                <tr>
                  <td ${notes ? 'style="padding-bottom: 15px;"' : ""}>
                    <strong style="color: #1E3A8A; font-size: 14px; display: block; margin-bottom: 5px;">AMOUNT</strong>
                    <span style="color: #333; font-size: 16px;">${currency.toUpperCase()} ${amount.toFixed(2)}</span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong style="color: #1E3A8A; font-size: 14px; display: block; margin-bottom: 5px;">PAYMENT STATUS</strong>
                    <span style="color: #333; font-size: 16px;">${resolvedPaymentStatus}</span>
                  </td>
                </tr>
                ${
                  notes
                    ? `
                <tr>
                  <td>
                    <strong style="color: #1E3A8A; font-size: 14px; display: block; margin-bottom: 5px;">STUDENT NOTES</strong>
                    <span style="color: #333; font-size: 14px; line-height: 1.6;">${notes}</span>
                  </td>
                </tr>
                `
                    : ""
                }
              </table>

              ${
                meetingUrl && providerName
                  ? `
              <div style="background-color: #DBEAFE; border-left: 4px solid #3B82F6; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                <h2 style="margin: 0 0 15px 0; color: #1E40AF; font-size: 18px; font-weight: 600;">Meeting Link Ready</h2>
                <p style="margin: 0 0 15px 0; color: #1E3A8A; font-size: 14px; line-height: 1.6;">
                  The lesson will take place on ${providerName}.
                </p>
                <div style="text-align: center; margin: 20px 0;">
                  <a href="${meetingUrl}" style="display: inline-block; background-color: #3B82F6; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 15px; font-weight: 600;">
                    Open ${providerName}
                  </a>
                </div>
                <p style="margin: 0; color: #1E3A8A; font-size: 12px; text-align: center;">
                  ${meetingUrl}
                </p>
              </div>
              `
                  : ""
              }

              ${
                dashboardUrl
                  ? `
              <div style="text-align: center; margin: 30px 0;">
                <a href="${dashboardUrl}" style="display: inline-block; background-color: #1E3A8A; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                  View in Dashboard
                </a>
              </div>
              `
                  : ""
              }

              <p style="margin: 0; color: #666; font-size: 14px; line-height: 1.6;">
                The booking is confirmed and will appear in your calendar. Reply to this email if you need to adjust anything.
              </p>

            </td>
          </tr>

          <tr>
            <td style="background-color: #f9f9f9; padding: 30px; text-align: center; border-top: 1px solid #e5e5e5;">
              <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">
                Powered by TutorLingua
              </p>
              <p style="margin: 0; color: #999; font-size: 12px;">
                (c) ${new Date().getFullYear()} TutorLingua. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export function TutorBookingConfirmedEmailText({
  tutorName,
  studentName,
  studentEmail,
  studentPhone,
  serviceName,
  scheduledAt,
  durationMinutes,
  timezone,
  amount,
  currency,
  notes,
  meetingUrl,
  meetingProvider,
  customVideoName,
  dashboardUrl,
  paymentStatusLabel,
}: TutorBookingConfirmedEmailProps) {
  const formattedDate = formatInTimeZone(scheduledAt, timezone, "EEEE, MMMM d, yyyy");
  const formattedTime = formatInTimeZone(scheduledAt, timezone, "h:mm a zzz");
  const providerName = getMeetingProviderName(meetingProvider, customVideoName);
  const resolvedPaymentStatus =
    paymentStatusLabel || (amount === 0 ? "Free lesson" : "Paid");

  return `Booking Confirmed

Hi ${tutorName},

${studentName}'s lesson is confirmed.

BOOKING DETAILS:
--------------
Student: ${studentName}
Email: ${studentEmail}
${studentPhone ? `Phone: ${studentPhone}\n` : ""}Service: ${serviceName}
Date: ${formattedDate}
Time: ${formattedTime}
Duration: ${durationMinutes} minutes
Amount: ${currency.toUpperCase()} ${amount.toFixed(2)}
Payment Status: ${resolvedPaymentStatus}
${notes ? `Notes: ${notes}\n` : ""}
MEETING LINK:
------------
${
  meetingUrl && providerName
    ? `Platform: ${providerName}\nLink: ${meetingUrl}\n`
    : "Meeting link will be shared in the dashboard.\n"
}
${dashboardUrl ? `Dashboard: ${dashboardUrl}\n` : ""}

-- TutorLingua
`.trim();
}

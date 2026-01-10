import { formatInTimeZone } from "date-fns-tz";

type BookingRescheduledEmailProps = {
  recipientName: string;
  recipientRole: "student" | "tutor";
  tutorName: string;
  studentName: string;
  serviceName: string;
  oldScheduledAt: string;
  newScheduledAt: string;
  timezone: string;
  durationMinutes: number;
  meetingUrl?: string | null;
  meetingProvider?: string | null;
  rescheduleUrl?: string | null;
};

function formatDateTime(value: string, timezone: string) {
  return formatInTimeZone(value, timezone, "EEEE, MMMM d • h:mm a");
}

function getProviderName(provider?: string | null): string | null {
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
      return "Video Platform";
    default:
      return null;
  }
}

export function BookingRescheduledEmail(props: BookingRescheduledEmailProps) {
  const {
    recipientName,
    recipientRole,
    tutorName,
    studentName,
    serviceName,
    oldScheduledAt,
    newScheduledAt,
    timezone,
    durationMinutes,
    meetingUrl,
    meetingProvider,
    rescheduleUrl,
  } = props;

  const header =
    recipientRole === "student"
      ? "Your lesson was rescheduled"
      : "Lesson rescheduled by you/your student";

  const secondary =
    recipientRole === "student"
      ? `${tutorName} moved your upcoming lesson.`
      : `${studentName} is now booked at a new time.`;

  const providerName = getProviderName(meetingProvider);
  const meetingLine =
    meetingUrl && providerName
      ? `<p style="margin: 0 0 12px 0; color: #111827; font-size: 14px;">Join via <strong>${providerName}</strong>: <a href="${meetingUrl}" style="color:#4338CA; text-decoration:none;">${meetingUrl}</a></p>`
      : meetingUrl
      ? `<p style="margin: 0 0 12px 0; color: #111827; font-size: 14px;">Join: <a href="${meetingUrl}" style="color:#4338CA; text-decoration:none;">${meetingUrl}</a></p>`
      : "";

  const actionButton = rescheduleUrl
    ? `<a href="${rescheduleUrl}" style="display:inline-block; background:#4338CA; color:#fff; font-weight:600; text-decoration:none; padding:12px 20px; border-radius:10px;">Review booking</a>`
    : "";

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${header}</title>
  </head>
  <body style="margin:0; padding:0; background:#F3F4F6; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#F3F4F6; padding:32px 16px;">
      <tr>
        <td align="center">
          <table width="640" cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 8px 20px rgba(0,0,0,0.05);">
            <tr>
              <td style="padding:28px 28px 12px 28px; background:linear-gradient(135deg,#4338CA 0%,#312E81 100%); color:#fff;">
                <h1 style="margin:0; font-size:22px; font-weight:700;">${header}</h1>
                <p style="margin:8px 0 0 0; font-size:15px; color:rgba(255,255,255,0.9);">${secondary}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 28px 10px 28px; color:#111827; font-size:15px; line-height:1.6;">
                <p style="margin:0 0 14px 0;">Hi ${recipientName},</p>
                <p style="margin:0 0 18px 0;">
                  <strong>${serviceName}</strong><br/>
                  <span style="color:#4B5563;">${durationMinutes} minutes</span>
                </p>
                <p style="margin:0 0 10px 0; color:#6B7280;">Previous time:</p>
                <p style="margin:0 0 14px 0; font-weight:600;">${formatDateTime(oldScheduledAt, timezone)} (${timezone})</p>
                <p style="margin:0 0 10px 0; color:#6B7280;">New time:</p>
                <p style="margin:0 0 16px 0; font-weight:700; font-size:16px;">${formatDateTime(newScheduledAt, timezone)} (${timezone})</p>
                ${meetingLine}
                ${actionButton}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px 28px 28px; color:#6B7280; font-size:13px; line-height:1.6;">
                <p style="margin:0;">If this time does not work, you can reply to this email or use your booking link to reschedule again.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px 24px 28px; background:#F9FAFB; border-top:1px solid #E5E7EB; text-align:center; color:#9CA3AF; font-size:12px;">
                ${recipientRole === "student" ? `Sent on behalf of ${tutorName}` : "Sent by TutorLingua"}
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

export function BookingRescheduledEmailText(props: BookingRescheduledEmailProps) {
  const {
    recipientName,
    recipientRole,
    tutorName,
    studentName,
    serviceName,
    oldScheduledAt,
    newScheduledAt,
    timezone,
    durationMinutes,
    meetingUrl,
    meetingProvider,
    rescheduleUrl,
  } = props;

  const header =
    recipientRole === "student"
      ? "Your lesson was rescheduled"
      : "Lesson rescheduled";

  const providerName = getProviderName(meetingProvider);
  const meetingLine = meetingUrl
    ? `Join${providerName ? ` (${providerName})` : ""}: ${meetingUrl}`
    : "";

  return `${header}

Hi ${recipientName},

${recipientRole === "student" ? tutorName : studentName} moved your lesson "${serviceName}" (${durationMinutes} minutes).

Previous: ${formatDateTime(oldScheduledAt, timezone)} (${timezone})
New: ${formatDateTime(newScheduledAt, timezone)} (${timezone})
${meetingLine ? `${meetingLine}\n` : ""}${rescheduleUrl ? `Manage booking: ${rescheduleUrl}\n` : ""}
If the time doesn't work, reply to this email to reschedule again.`;
}

import { formatInTimeZone } from "date-fns-tz";

type TutorCancellationEmailProps = {
  tutorName: string;
  studentName: string;
  serviceName: string;
  scheduledAt: string;
  timezone: string;
  refundNote?: string | null;
  rescheduleUrl?: string | null;
};

function formatDateTime(value: string, timezone: string) {
  return formatInTimeZone(value, timezone, "EEEE, MMMM d • h:mm a");
}

export function TutorCancellationEmail(props: TutorCancellationEmailProps) {
  const { tutorName, studentName, serviceName, scheduledAt, timezone, refundNote, rescheduleUrl } =
    props;

  const action = rescheduleUrl
    ? `<a href="${rescheduleUrl}" style="display:inline-block; background:#4338CA; color:#fff; font-weight:600; text-decoration:none; padding:12px 20px; border-radius:10px;">Book a new time</a>`
    : "";

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Booking cancelled</title>
  </head>
  <body style="margin:0; padding:0; background:#F3F4F6; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#F3F4F6; padding:32px 16px;">
      <tr>
        <td align="center">
          <table width="640" cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 8px 20px rgba(0,0,0,0.05);">
            <tr>
              <td style="padding:28px 28px 12px 28px; background:linear-gradient(135deg,#DB2777 0%,#BE185D 100%); color:#fff;">
                <h1 style="margin:0; font-size:22px; font-weight:700;">Booking cancelled</h1>
                <p style="margin:8px 0 0 0; font-size:15px; color:rgba(255,255,255,0.9);">${serviceName}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 28px 10px 28px; color:#111827; font-size:15px; line-height:1.6;">
                <p style="margin:0 0 14px 0;">Hi ${tutorName},</p>
                <p style="margin:0 0 16px 0;">You cancelled your lesson with ${studentName}.</p>
                <p style="margin:0 0 10px 0; color:#6B7280;">Original time:</p>
                <p style="margin:0 0 18px 0; font-weight:700; font-size:16px;">${formatDateTime(
                  scheduledAt,
                  timezone
                )} (${timezone})</p>
                ${refundNote ? `<p style="margin:0 0 12px 0; color:#16A34A;">${refundNote}</p>` : ""}
                ${action}
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px 24px 28px; background:#F9FAFB; border-top:1px solid #E5E7EB; text-align:center; color:#9CA3AF; font-size:12px;">
                Keep your calendar in sync to avoid conflicts.
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

export function TutorCancellationEmailText(props: TutorCancellationEmailProps) {
  const { tutorName, studentName, serviceName, scheduledAt, timezone, refundNote, rescheduleUrl } =
    props;

  return `Booking cancelled

Hi ${tutorName},

You cancelled ${serviceName} with ${studentName}.
Time: ${formatDateTime(scheduledAt, timezone)} (${timezone})
${refundNote ? `Refund: ${refundNote}\n` : ""}${rescheduleUrl ? `Book a new time: ${rescheduleUrl}\n` : ""}Keep your calendar in sync to avoid conflicts.`;
}

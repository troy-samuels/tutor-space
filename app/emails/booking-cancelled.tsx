interface BookingCancelledEmailProps {
  studentName: string;
  tutorName: string;
  serviceName: string;
  scheduledAt: string;
  timezone: string;
  reason?: string;
  rescheduleUrl?: string;
}

const baseStyles =
  "font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #111827;";

export function BookingCancelledEmail({
  studentName,
  tutorName,
  serviceName,
  scheduledAt,
  timezone,
  reason,
  rescheduleUrl,
}: BookingCancelledEmailProps) {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${serviceName} has been cancelled</title>
  </head>
  <body style="${baseStyles} background:#f8fafc; padding:0; margin:0;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#fef2f2; padding:32px 0;">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:640px; background:#ffffff; border-radius:16px; border:1px solid #fecaca; padding:32px;">
            <tr>
              <td>
                <p style="font-size:16px; color:#b91c1c;">Lesson cancelled</p>
                <p style="font-size:15px;">
                  Hi ${studentName},<br />
                  your upcoming <strong>${serviceName}</strong> with ${tutorName} scheduled for <strong>${scheduledAt}</strong> (${timezone}) has been cancelled.
                </p>
                ${
                  reason
                    ? `<p style="font-size:15px; color:#6b7280;">Reason provided: ${reason}</p>`
                    : ""
                }
                ${
                  rescheduleUrl
                    ? `<p style="text-align:center; margin:32px 0;">
                    <a href="${rescheduleUrl}" style="display:inline-block; padding:14px 32px; border-radius:9999px; background:#1d4ed8; color:#ffffff; font-weight:600; text-decoration:none;">
                      Book a new time
                    </a>
                  </p>`
                    : ""
                }
                <p style="font-size:14px; color:#6b7280;">
                  Have a question? Reply directly to this email and ${tutorName} will help you out.
                </p>
                <p style="margin-top:32px; font-weight:600;">— ${tutorName}</p>
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

export function BookingCancelledEmailText({
  studentName,
  tutorName,
  serviceName,
  scheduledAt,
  timezone,
  reason,
  rescheduleUrl,
}: BookingCancelledEmailProps) {
  return `Hi ${studentName},

Your ${serviceName} with ${tutorName} scheduled for ${scheduledAt} (${timezone}) has been cancelled.
${reason ? `Reason: ${reason}\n` : ""}${rescheduleUrl ? `Book a new slot: ${rescheduleUrl}\n` : ""}
Reply to this email if you need any help.

— ${tutorName}`.trim();
}

interface QuickInviteEmailProps {
  tutorName: string;
  bookingUrl: string;
}

const baseStyles =
  "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;line-height:1.6;color:#0f172a;";

export function QuickInviteEmail({
  tutorName,
  bookingUrl,
}: QuickInviteEmailProps) {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${tutorName} invited you to book a lesson</title>
  </head>
  <body style="${baseStyles}background:#f8fafc;padding:32px 0;margin:0;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;background:#ffffff;border-radius:20px;border:1px solid #e2e8f0;padding:32px 28px;box-shadow:0 12px 50px rgba(15,23,42,0.08);">
            <tr>
              <td>
                <p style="margin:0 0 16px 0;font-size:16px;color:#0f172a;">
                  Hi there,
                </p>
                <p style="margin:0 0 16px 0;font-size:16px;color:#0f172a;">
                  ${tutorName} invited you to book a lesson. Click below to view available times and schedule your session.
                </p>

                <div style="margin:28px 0;text-align:center;">
                  <a href="${bookingUrl}" style="display:inline-block;background:#8B7355;color:#fff;padding:14px 28px;border-radius:12px;font-weight:700;font-size:15px;text-decoration:none;box-shadow:0 10px 30px rgba(139,115,85,0.35);">
                    Book a Lesson
                  </a>
                </div>

                <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:12px;padding:14px 16px;margin-bottom:18px;">
                  <p style="margin:0;font-size:14px;color:#166534;">
                    <strong>Skip the marketplace fees.</strong> Book directly and your tutor keeps 100% of the lesson fee.
                  </p>
                </div>

                <p style="margin:24px 0 0 0;font-size:13px;color:#94a3b8;">
                  If the button above doesn't work, copy and paste this link into your browser:<br />
                  <span style="color:#0f172a;word-break:break-all;">${bookingUrl}</span>
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

export function QuickInviteEmailText({
  tutorName,
  bookingUrl,
}: QuickInviteEmailProps) {
  return `
Hi there,

${tutorName} invited you to book a lesson. Visit the link below to view available times and schedule your session.

Book a Lesson: ${bookingUrl}

Skip the marketplace fees - book directly and your tutor keeps 100% of the lesson fee.

If the link above doesn't work, copy and paste it into your browser.
  `.trim();
}

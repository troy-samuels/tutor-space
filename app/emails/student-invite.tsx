interface StudentInviteEmailProps {
  tutorName: string;
  studentName?: string | null;
  requestAccessUrl: string;
  bookingUrl: string;
}

const baseStyles =
  "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;line-height:1.6;color:#0f172a;";

export function StudentInviteEmail({
  tutorName,
  studentName,
  requestAccessUrl,
  bookingUrl,
}: StudentInviteEmailProps) {
  const displayName = studentName || "there";

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${tutorName} invited you to TutorLingua</title>
  </head>
  <body style="${baseStyles}background:#f8fafc;padding:32px 0;margin:0;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;background:#ffffff;border-radius:20px;border:1px solid #e2e8f0;padding:32px 28px;box-shadow:0 12px 50px rgba(15,23,42,0.08);">
            <tr>
              <td>
                <p style="margin:0 0 10px 0;font-size:16px;color:#475569;">Hi ${displayName},</p>
                <p style="margin:0 0 16px 0;font-size:16px;color:#0f172a;">
                  ${tutorName} just added you as a student on TutorLingua. Finish your student profile so you can book your first class.
                </p>

                <div style="margin:24px 0;text-align:center;">
                  <a href="${requestAccessUrl}" style="display:inline-block;background:#8B7355;color:#fff;padding:14px 22px;border-radius:12px;font-weight:700;font-size:15px;text-decoration:none;box-shadow:0 10px 30px rgba(139,115,85,0.35);">
                    Complete your profile
                  </a>
                </div>

                <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:18px 16px;margin-bottom:18px;">
                  <p style="margin:0 0 8px 0;font-size:14px;font-weight:700;color:#0f172a;">What to expect</p>
                  <ul style="margin:0;padding-left:18px;color:#475569;font-size:14px;line-height:1.7;">
                    <li>Create a password with your email to access your student portal</li>
                    <li>Confirm a few details (name, timezone, goals) so your tutor can tailor lessons</li>
                    <li>Use the booking link to pick a time that works for you</li>
                  </ul>
                </div>

                <div style="margin:18px 0 10px 0;">
                  <p style="margin:0 0 8px 0;font-size:14px;font-weight:600;color:#0f172a;">Ready to book now?</p>
                  <a href="${bookingUrl}" style="color:#8B7355;font-weight:600;text-decoration:none;">Open your tutor's calendar</a>
                </div>

                <p style="margin:24px 0 0 0;font-size:13px;color:#94a3b8;">
                  If the button above doesn’t work, copy and paste this link into your browser:<br />
                  <span style="color:#0f172a;word-break:break-all;">${requestAccessUrl}</span>
                </p>
                <p style="margin:10px 0 0 0;font-size:13px;color:#94a3b8;">
                  Reply to this email if you have questions—${tutorName} will get back to you.
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

export function StudentInviteEmailText({
  tutorName,
  studentName,
  requestAccessUrl,
  bookingUrl,
}: StudentInviteEmailProps) {
  const displayName = studentName || "there";

  return `
Hi ${displayName},

${tutorName} just added you as a student on TutorLingua. Finish your student profile so you can book your first class.

1) Create a password with your email
2) Confirm your details (name, timezone, goals)
3) Use the booking link to pick a time

Complete your profile: ${requestAccessUrl}
Open your tutor's calendar: ${bookingUrl}

If the button above doesn’t work, copy and paste the link into your browser.
Reply if you have questions—${tutorName} will get back to you.
  `.trim();
}

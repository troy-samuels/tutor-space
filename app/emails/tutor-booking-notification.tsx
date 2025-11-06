import { formatInTimeZone } from "date-fns-tz";

interface TutorBookingNotificationEmailProps {
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
  dashboardUrl?: string;
}

export function TutorBookingNotificationEmail({
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
  dashboardUrl,
}: TutorBookingNotificationEmailProps) {
  const formattedDate = formatInTimeZone(scheduledAt, timezone, "EEEE, MMMM d, yyyy");
  const formattedTime = formatInTimeZone(scheduledAt, timezone, "h:mm a zzz");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Booking Request</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #8B6B47 0%, #6B5335 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">New Booking Request</h1>
              <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">You have a new lesson to confirm</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">

              <p style="margin: 0 0 20px 0; color: #333; font-size: 16px; line-height: 1.6;">
                Hi ${tutorName},
              </p>

              <p style="margin: 0 0 30px 0; color: #333; font-size: 16px; line-height: 1.6;">
                You have received a new booking request from <strong>${studentName}</strong>. The student has been sent payment instructions and will pay you directly.
              </p>

              <!-- Booking Details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9f9f9; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                <tr>
                  <td style="padding-bottom: 15px;">
                    <strong style="color: #8B6B47; font-size: 14px; display: block; margin-bottom: 5px;">STUDENT</strong>
                    <span style="color: #333; font-size: 16px;">${studentName}</span><br>
                    <a href="mailto:${studentEmail}" style="color: #8B6B47; text-decoration: none; font-size: 14px;">${studentEmail}</a>
                    ${studentPhone ? `<br><span style="color: #666; font-size: 14px;">${studentPhone}</span>` : ""}
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 15px;">
                    <strong style="color: #8B6B47; font-size: 14px; display: block; margin-bottom: 5px;">SERVICE</strong>
                    <span style="color: #333; font-size: 16px;">${serviceName}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 15px;">
                    <strong style="color: #8B6B47; font-size: 14px; display: block; margin-bottom: 5px;">DATE & TIME</strong>
                    <span style="color: #333; font-size: 16px;">${formattedDate}</span><br>
                    <span style="color: #333; font-size: 16px;">${formattedTime}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 15px;">
                    <strong style="color: #8B6B47; font-size: 14px; display: block; margin-bottom: 5px;">DURATION</strong>
                    <span style="color: #333; font-size: 16px;">${durationMinutes} minutes</span>
                  </td>
                </tr>
                <tr>
                  <td ${notes ? 'style="padding-bottom: 15px;"' : ""}>
                    <strong style="color: #8B6B47; font-size: 14px; display: block; margin-bottom: 5px;">AMOUNT</strong>
                    <span style="color: #333; font-size: 16px;">${currency.toUpperCase()} ${amount.toFixed(2)}</span>
                  </td>
                </tr>
                ${
                  notes
                    ? `
                <tr>
                  <td>
                    <strong style="color: #8B6B47; font-size: 14px; display: block; margin-bottom: 5px;">STUDENT NOTES</strong>
                    <span style="color: #333; font-size: 14px; line-height: 1.6;">${notes}</span>
                  </td>
                </tr>
                `
                    : ""
                }
              </table>

              <!-- Next Steps -->
              <div style="background-color: #DBEAFE; border-left: 4px solid #3B82F6; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                <h2 style="margin: 0 0 15px 0; color: #1E40AF; font-size: 18px; font-weight: 600;">Next Steps</h2>
                <ol style="margin: 0; padding-left: 20px; color: #1E3A8A; font-size: 14px; line-height: 1.8;">
                  <li>Wait for the student to send payment via your preferred method</li>
                  <li>Once payment is received, mark the booking as "Paid" in your dashboard</li>
                  <li>The lesson will be confirmed and added to your schedule</li>
                </ol>
              </div>

              ${
                dashboardUrl
                  ? `
              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${dashboardUrl}" style="display: inline-block; background-color: #8B6B47; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                  View in Dashboard
                </a>
              </div>
              `
                  : ""
              }

              <p style="margin: 0; color: #666; font-size: 14px; line-height: 1.6;">
                The student has been sent your payment information and instructions. You'll receive a confirmation once they complete their payment.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9f9f9; padding: 30px; text-align: center; border-top: 1px solid #e5e5e5;">
              <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">
                Powered by Learn with Sarai
              </p>
              <p style="margin: 0; color: #999; font-size: 12px;">
                © ${new Date().getFullYear()} Learn with Sarai. All rights reserved.
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

/**
 * Plain text version
 */
export function TutorBookingNotificationEmailText({
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
  dashboardUrl,
}: TutorBookingNotificationEmailProps) {
  const formattedDate = formatInTimeZone(scheduledAt, timezone, "EEEE, MMMM d, yyyy");
  const formattedTime = formatInTimeZone(scheduledAt, timezone, "h:mm a zzz");

  const text = `New Booking Request

Hi ${tutorName},

You have received a new booking request from ${studentName}. The student has been sent payment instructions and will pay you directly.

BOOKING DETAILS:
--------------
Student: ${studentName}
Email: ${studentEmail}
${studentPhone ? `Phone: ${studentPhone}\n` : ""}
Service: ${serviceName}
Date: ${formattedDate}
Time: ${formattedTime}
Duration: ${durationMinutes} minutes
Amount: ${currency.toUpperCase()} ${amount.toFixed(2)}
${notes ? `\nStudent Notes:\n${notes}\n` : ""}

NEXT STEPS:
----------
1. Wait for the student to send payment via your preferred method
2. Once payment is received, mark the booking as "Paid" in your dashboard
3. The lesson will be confirmed and added to your schedule

${dashboardUrl ? `View in Dashboard: ${dashboardUrl}\n` : ""}
The student has been sent your payment information and instructions. You'll receive a confirmation once they complete their payment.

---
Powered by Learn with Sarai
© ${new Date().getFullYear()} Learn with Sarai. All rights reserved.
`;

  return text;
}

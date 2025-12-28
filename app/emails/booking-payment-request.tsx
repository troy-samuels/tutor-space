import { formatInTimeZone } from "date-fns-tz";

interface BookingPaymentRequestEmailProps {
  studentName: string;
  tutorName: string;
  tutorEmail: string;
  serviceName: string;
  scheduledAt: string;
  durationMinutes: number;
  timezone: string;
  amount: number;
  currency: string;
  paymentUrl: string;
}

export function BookingPaymentRequestEmail({
  studentName,
  tutorName,
  tutorEmail,
  serviceName,
  scheduledAt,
  durationMinutes,
  timezone,
  amount,
  currency,
  paymentUrl,
}: BookingPaymentRequestEmailProps) {
  const formattedDate = formatInTimeZone(scheduledAt, timezone, "EEEE, MMMM d, yyyy");
  const formattedTime = formatInTimeZone(scheduledAt, timezone, "h:mm a zzz");
  const formattedAmount = `${currency.toUpperCase()} ${amount.toFixed(2)}`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Complete Your Booking</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #FDF8F5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FDF8F5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 20px; box-shadow: 0 12px 50px rgba(15,23,42,0.08); overflow: hidden;">

          <!-- Header -->
          <tr>
            <td style="background: #D36135; padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">Complete Your Booking</h1>
              <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">with ${tutorName}</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">

              <p style="margin: 0 0 24px 0; color: #2D2A26; font-size: 16px; line-height: 1.6;">
                Hi ${studentName},
              </p>

              <p style="margin: 0 0 30px 0; color: #2D2A26; font-size: 16px; line-height: 1.6;">
                ${tutorName} has scheduled a lesson with you. Please complete your payment to confirm the booking.
              </p>

              <!-- Lesson Details Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F5EDE8; border-radius: 16px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-bottom: 16px; border-bottom: 1px solid rgba(45,42,38,0.1);">
                          <span style="color: #6B6560; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Lesson</span>
                          <span style="color: #2D2A26; font-size: 18px; font-weight: 600;">${serviceName}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 16px 0; border-bottom: 1px solid rgba(45,42,38,0.1);">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td width="50%">
                                <span style="color: #6B6560; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Date</span>
                                <span style="color: #2D2A26; font-size: 15px;">${formattedDate}</span>
                              </td>
                              <td width="50%">
                                <span style="color: #6B6560; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Time</span>
                                <span style="color: #2D2A26; font-size: 15px;">${formattedTime}</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top: 16px;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td width="50%">
                                <span style="color: #6B6560; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Duration</span>
                                <span style="color: #2D2A26; font-size: 15px;">${durationMinutes} minutes</span>
                              </td>
                              <td width="50%">
                                <span style="color: #6B6560; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Price</span>
                                <span style="color: #D36135; font-size: 18px; font-weight: 700;">${formattedAmount}</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Payment CTA -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="${paymentUrl}" style="display: inline-block; background: #D36135; color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 12px; font-size: 16px; font-weight: 700; box-shadow: 0 4px 14px rgba(211,97,53,0.3);">
                  Complete Payment - ${formattedAmount}
                </a>
              </div>

              <p style="margin: 0 0 24px 0; color: #6B6560; font-size: 14px; line-height: 1.6; text-align: center;">
                Once payment is confirmed, you'll receive a confirmation email with the meeting link.
              </p>

              <!-- Note -->
              <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
                <p style="margin: 0; color: #92400E; font-size: 14px; line-height: 1.6;">
                  <strong>Note:</strong> This booking will be held for 24 hours. If payment is not completed, the time slot may become available to other students.
                </p>
              </div>

              <!-- Contact -->
              <p style="margin: 0 0 8px 0; color: #2D2A26; font-size: 14px; line-height: 1.6;">
                Questions? Contact ${tutorName}:
              </p>
              <p style="margin: 0;">
                <a href="mailto:${tutorEmail}" style="color: #D36135; text-decoration: none; font-size: 14px;">${tutorEmail}</a>
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F5EDE8; padding: 24px 30px; text-align: center;">
              <p style="margin: 0 0 8px 0; color: #6B6560; font-size: 13px;">
                Powered by TutorLingua
              </p>
              <p style="margin: 0; color: #9A9590; font-size: 11px;">
                &copy; ${new Date().getFullYear()} TutorLingua. All rights reserved.
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
 * Plain text version for email clients that don't support HTML
 */
export function BookingPaymentRequestEmailText({
  studentName,
  tutorName,
  tutorEmail,
  serviceName,
  scheduledAt,
  durationMinutes,
  timezone,
  amount,
  currency,
  paymentUrl,
}: BookingPaymentRequestEmailProps) {
  const formattedDate = formatInTimeZone(scheduledAt, timezone, "EEEE, MMMM d, yyyy");
  const formattedTime = formatInTimeZone(scheduledAt, timezone, "h:mm a zzz");
  const formattedAmount = `${currency.toUpperCase()} ${amount.toFixed(2)}`;

  return `Complete Your Booking with ${tutorName}

Hi ${studentName},

${tutorName} has scheduled a lesson with you. Please complete your payment to confirm the booking.

LESSON DETAILS
--------------
Lesson: ${serviceName}
Date: ${formattedDate}
Time: ${formattedTime}
Duration: ${durationMinutes} minutes
Price: ${formattedAmount}

COMPLETE PAYMENT
----------------
Click here to pay: ${paymentUrl}

Once payment is confirmed, you'll receive a confirmation email with the meeting link.

NOTE: This booking will be held for 24 hours. If payment is not completed, the time slot may become available to other students.

QUESTIONS?
----------
Contact ${tutorName} at ${tutorEmail}

---
Powered by TutorLingua
(c) ${new Date().getFullYear()} TutorLingua. All rights reserved.
`;
}

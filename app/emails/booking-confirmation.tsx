import { formatInTimeZone } from "date-fns-tz";

interface BookingConfirmationEmailProps {
  studentName: string;
  tutorName: string;
  tutorEmail: string;
  serviceName: string;
  scheduledAt: string;
  durationMinutes: number;
  timezone: string;
  amount: number;
  currency: string;
  paymentInstructions?: {
    general?: string;
    venmoHandle?: string;
    paypalEmail?: string;
    zellePhone?: string;
    stripePaymentLink?: string;
    customPaymentUrl?: string;
  };
  meetingUrl?: string;
  meetingProvider?: string;
  customVideoName?: string;
}

export function BookingConfirmationEmail({
  studentName,
  tutorName,
  tutorEmail,
  serviceName,
  scheduledAt,
  durationMinutes,
  timezone,
  amount,
  currency,
  paymentInstructions,
  meetingUrl,
  meetingProvider,
  customVideoName,
}: BookingConfirmationEmailProps) {
  const formattedDate = formatInTimeZone(scheduledAt, timezone, "EEEE, MMMM d, yyyy");
  const formattedTime = formatInTimeZone(scheduledAt, timezone, "h:mm a zzz");

  // Get platform display name
  const getProviderName = () => {
    switch (meetingProvider) {
      case "zoom_personal":
        return "Zoom";
      case "google_meet":
        return "Google Meet";
      case "calendly":
        return "Calendly";
      case "custom":
        return customVideoName || "Video Platform";
      default:
        return null;
    }
  };

  const providerName = getProviderName();

  // Build payment methods
  const paymentMethods: Array<{ label: string; value: string; link?: string }> = [];

  if (paymentInstructions?.venmoHandle) {
    paymentMethods.push({
      label: "Venmo",
      value: `@${paymentInstructions.venmoHandle}`,
      link: `https://venmo.com/${paymentInstructions.venmoHandle}`,
    });
  }

  if (paymentInstructions?.paypalEmail) {
    paymentMethods.push({
      label: "PayPal",
      value: paymentInstructions.paypalEmail,
      link: `https://paypal.me/${paymentInstructions.paypalEmail.split("@")[0]}`,
    });
  }

  if (paymentInstructions?.zellePhone) {
    paymentMethods.push({
      label: "Zelle",
      value: paymentInstructions.zellePhone,
    });
  }

  if (paymentInstructions?.stripePaymentLink) {
    paymentMethods.push({
      label: "Credit/Debit Card",
      value: "Pay with Stripe",
      link: paymentInstructions.stripePaymentLink,
    });
  }

  if (paymentInstructions?.customPaymentUrl) {
    paymentMethods.push({
      label: "Payment Link",
      value: "Click to pay",
      link: paymentInstructions.customPaymentUrl,
    });
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #8B6B47 0%, #6B5335 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Booking Confirmed!</h1>
              <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Your lesson has been scheduled</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">

              <p style="margin: 0 0 20px 0; color: #333; font-size: 16px; line-height: 1.6;">
                Hi ${studentName},
              </p>

              <p style="margin: 0 0 30px 0; color: #333; font-size: 16px; line-height: 1.6;">
                Great news! Your lesson with ${tutorName} has been confirmed. Here are the details:
              </p>

              <!-- Booking Details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9f9f9; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                <tr>
                  <td style="padding-bottom: 15px;">
                    <strong style="color: #8B6B47; font-size: 14px; display: block; margin-bottom: 5px;">SERVICE</strong>
                    <span style="color: #333; font-size: 16px;">${serviceName}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 15px;">
                    <strong style="color: #8B6B47; font-size: 14px; display: block; margin-bottom: 5px;">DATE</strong>
                    <span style="color: #333; font-size: 16px;">${formattedDate}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 15px;">
                    <strong style="color: #8B6B47; font-size: 14px; display: block; margin-bottom: 5px;">TIME</strong>
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
                  <td>
                    <strong style="color: #8B6B47; font-size: 14px; display: block; margin-bottom: 5px;">AMOUNT</strong>
                    <span style="color: #333; font-size: 16px;">${currency.toUpperCase()} ${amount.toFixed(2)}</span>
                  </td>
                </tr>
              </table>

              <!-- Meeting Link -->
              ${
                meetingUrl && providerName
                  ? `
              <div style="background-color: #DBEAFE; border-left: 4px solid #3B82F6; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                <h2 style="margin: 0 0 15px 0; color: #1E40AF; font-size: 18px; font-weight: 600;">Join Your Lesson</h2>
                <p style="margin: 0 0 15px 0; color: #1E3A8A; font-size: 14px; line-height: 1.6;">
                  Your lesson will take place on ${providerName}. Click the button below to join when it's time.
                </p>
                <div style="text-align: center; margin: 20px 0;">
                  <a href="${meetingUrl}" style="display: inline-block; background-color: #3B82F6; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                    Join on ${providerName}
                  </a>
                </div>
                <p style="margin: 0; color: #1E3A8A; font-size: 12px; text-align: center;">
                  Meeting Link: <a href="${meetingUrl}" style="color: #3B82F6;">${meetingUrl}</a>
                </p>
              </div>
              `
                  : `
              <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                <h2 style="margin: 0 0 10px 0; color: #92400E; font-size: 18px; font-weight: 600;">Meeting Link Coming Soon</h2>
                <p style="margin: 0; color: #78350F; font-size: 14px; line-height: 1.6;">
                  ${tutorName} will send you the video meeting link before your lesson starts.
                </p>
              </div>
              `
              }

              <!-- Payment Instructions -->
              ${
                paymentMethods.length > 0
                  ? `
              <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                <h2 style="margin: 0 0 15px 0; color: #92400E; font-size: 18px; font-weight: 600;">Payment Required</h2>

                ${
                  paymentInstructions?.general
                    ? `<p style="margin: 0 0 20px 0; color: #78350F; font-size: 14px; line-height: 1.6;">${paymentInstructions.general}</p>`
                    : ""
                }

                <p style="margin: 0 0 15px 0; color: #78350F; font-size: 14px; font-weight: 600;">Choose a payment method:</p>

                ${paymentMethods
                  .map(
                    (method) => `
                  <div style="margin-bottom: 12px; padding: 12px; background-color: #ffffff; border-radius: 6px;">
                    <strong style="color: #92400E; font-size: 14px;">${method.label}:</strong>
                    ${
                      method.link
                        ? `<a href="${method.link}" style="color: #8B6B47; text-decoration: none; font-size: 14px; margin-left: 8px;">${method.value}</a>`
                        : `<span style="color: #333; font-size: 14px; margin-left: 8px;">${method.value}</span>`
                    }
                  </div>
                `
                  )
                  .join("")}
              </div>
              `
                  : `
              <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                <h2 style="margin: 0 0 10px 0; color: #92400E; font-size: 18px; font-weight: 600;">Payment Information</h2>
                <p style="margin: 0; color: #78350F; font-size: 14px; line-height: 1.6;">
                  Please contact ${tutorName} at <a href="mailto:${tutorEmail}" style="color: #8B6B47;">${tutorEmail}</a> for payment instructions.
                </p>
              </div>
              `
              }

              <!-- Cancellation Policy Notice -->
              <div style="background-color: #FEE2E2; border-left: 4px solid #DC2626; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                <h3 style="margin: 0 0 10px 0; color: #991B1B; font-size: 16px; font-weight: 600;">⚠️ Cancellation Policy</h3>
                <p style="margin: 0 0 10px 0; color: #7F1D1D; font-size: 14px; line-height: 1.6;">
                  <strong>12+ hours notice:</strong> Full refund or rescheduling available
                </p>
                <p style="margin: 0; color: #7F1D1D; font-size: 14px; line-height: 1.6;">
                  <strong>Less than 12 hours:</strong> No refund, exchange, or rescheduling available. The full lesson fee is forfeited.
                </p>
                <p style="margin: 10px 0 0 0; color: #7F1D1D; font-size: 12px;">
                  Please cancel or reschedule at least 12 hours before your lesson to avoid charges.
                </p>
              </div>

              <!-- Contact Info -->
              <p style="margin: 0 0 10px 0; color: #333; font-size: 16px; line-height: 1.6;">
                If you have any questions, feel free to reach out to ${tutorName}:
              </p>
              <p style="margin: 0 0 30px 0;">
                <a href="mailto:${tutorEmail}" style="color: #8B6B47; text-decoration: none; font-size: 16px;">${tutorEmail}</a>
              </p>

              <p style="margin: 0; color: #666; font-size: 14px; line-height: 1.6;">
                Looking forward to your lesson!
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
 * Plain text version for email clients that don't support HTML
 */
export function BookingConfirmationEmailText({
  studentName,
  tutorName,
  tutorEmail,
  serviceName,
  scheduledAt,
  durationMinutes,
  timezone,
  amount,
  currency,
  paymentInstructions,
  meetingUrl,
  meetingProvider,
  customVideoName,
}: BookingConfirmationEmailProps) {
  const formattedDate = formatInTimeZone(scheduledAt, timezone, "EEEE, MMMM d, yyyy");
  const formattedTime = formatInTimeZone(scheduledAt, timezone, "h:mm a zzz");

  // Get platform display name
  const getProviderName = () => {
    switch (meetingProvider) {
      case "zoom_personal":
        return "Zoom";
      case "google_meet":
        return "Google Meet";
      case "calendly":
        return "Calendly";
      case "custom":
        return customVideoName || "Video Platform";
      default:
        return null;
    }
  };

  const providerName = getProviderName();

  let text = `Booking Confirmed!

Hi ${studentName},

Great news! Your lesson with ${tutorName} has been confirmed.

BOOKING DETAILS:
--------------
Service: ${serviceName}
Date: ${formattedDate}
Time: ${formattedTime}
Duration: ${durationMinutes} minutes
Amount: ${currency.toUpperCase()} ${amount.toFixed(2)}

JOIN YOUR LESSON:
----------------
${
  meetingUrl && providerName
    ? `Platform: ${providerName}\nMeeting Link: ${meetingUrl}\n`
    : `${tutorName} will send you the video meeting link before your lesson starts.\n`
}

PAYMENT INFORMATION:
-------------------
`;

  if (paymentInstructions?.general) {
    text += `${paymentInstructions.general}\n\n`;
  }

  if (paymentInstructions?.venmoHandle) {
    text += `Venmo: @${paymentInstructions.venmoHandle}\n`;
  }
  if (paymentInstructions?.paypalEmail) {
    text += `PayPal: ${paymentInstructions.paypalEmail}\n`;
  }
  if (paymentInstructions?.zellePhone) {
    text += `Zelle: ${paymentInstructions.zellePhone}\n`;
  }
  if (paymentInstructions?.stripePaymentLink) {
    text += `Card Payment: ${paymentInstructions.stripePaymentLink}\n`;
  }
  if (paymentInstructions?.customPaymentUrl) {
    text += `Payment Link: ${paymentInstructions.customPaymentUrl}\n`;
  }

  if (!paymentInstructions || Object.keys(paymentInstructions).length === 0) {
    text += `Please contact ${tutorName} at ${tutorEmail} for payment instructions.\n`;
  }

  text += `
⚠️ CANCELLATION POLICY:
-----------------------
• 12+ hours notice: Full refund or rescheduling available
• Less than 12 hours: No refund, exchange, or rescheduling available. Full lesson fee is forfeited.

Please cancel or reschedule at least 12 hours before your lesson to avoid charges.

QUESTIONS?
----------
If you have any questions, reach out to ${tutorName} at ${tutorEmail}

Looking forward to your lesson!

---
Powered by Learn with Sarai
© ${new Date().getFullYear()} Learn with Sarai. All rights reserved.
`;

  return text;
}

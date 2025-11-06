/**
 * Email template sent to student when tutor approves calendar access
 */

interface AccessApprovedEmailProps {
  studentName: string;
  tutorName: string;
  tutorEmail: string;
  tutorNotes?: string;
  bookingUrl: string;
  paymentInstructions?: {
    general?: string;
    venmoHandle?: string;
    paypalEmail?: string;
    zellePhone?: string;
    stripePaymentLink?: string;
    customPaymentUrl?: string;
  };
}

export function AccessApprovedEmail({
  studentName,
  tutorName,
  tutorEmail,
  tutorNotes,
  bookingUrl,
  paymentInstructions,
}: AccessApprovedEmailProps) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Calendar Access Approved</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

  <!-- Header -->
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <div style="font-size: 48px; margin-bottom: 10px;">✓</div>
    <h1 style="margin: 0; font-size: 24px; font-weight: 600;">Calendar Access Approved!</h1>
  </div>

  <!-- Content -->
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">

    <p style="font-size: 16px; margin-bottom: 20px;">Hi ${studentName},</p>

    <p style="font-size: 16px; margin-bottom: 20px;">
      Great news! <strong>${tutorName}</strong> has approved your request to access their booking calendar.
    </p>

    <p style="font-size: 16px; margin-bottom: 20px;">
      You can now view available time slots and book lessons directly.
    </p>

    ${tutorNotes ? `
    <!-- Tutor Notes -->
    <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: 600; color: #166534;">Message from ${tutorName}:</h3>
      <p style="margin: 0; font-size: 14px; color: #15803d; line-height: 1.5; white-space: pre-wrap;">${tutorNotes}</p>
    </div>
    ` : ''}

    ${paymentInstructions && (paymentInstructions.general || paymentInstructions.venmoHandle || paymentInstructions.paypalEmail || paymentInstructions.zellePhone || paymentInstructions.stripePaymentLink || paymentInstructions.customPaymentUrl) ? `
    <!-- Payment Instructions -->
    <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="margin: 0 0 15px 0; font-size: 16px; font-weight: 600; color: #92400e;">Payment Information</h3>

      ${paymentInstructions.general ? `
      <p style="margin: 0 0 15px 0; font-size: 14px; color: #78350f; line-height: 1.5; white-space: pre-wrap;">${paymentInstructions.general}</p>
      ` : ''}

      ${paymentInstructions.venmoHandle || paymentInstructions.paypalEmail || paymentInstructions.zellePhone ? `
      <div style="font-size: 14px; color: #78350f;">
        ${paymentInstructions.venmoHandle ? `
        <p style="margin: 5px 0;"><strong>Venmo:</strong> ${paymentInstructions.venmoHandle}</p>
        ` : ''}
        ${paymentInstructions.paypalEmail ? `
        <p style="margin: 5px 0;"><strong>PayPal:</strong> ${paymentInstructions.paypalEmail}</p>
        ` : ''}
        ${paymentInstructions.zellePhone ? `
        <p style="margin: 5px 0;"><strong>Zelle:</strong> ${paymentInstructions.zellePhone}</p>
        ` : ''}
      </div>
      ` : ''}

      ${paymentInstructions.stripePaymentLink ? `
      <div style="margin-top: 15px;">
        <a href="${paymentInstructions.stripePaymentLink}" style="display: inline-block; background: #635bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
          Pay with Stripe
        </a>
      </div>
      ` : ''}

      ${paymentInstructions.customPaymentUrl ? `
      <div style="margin-top: 15px;">
        <a href="${paymentInstructions.customPaymentUrl}" style="display: inline-block; background: #8B7355; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
          View Payment Options
        </a>
      </div>
      ` : ''}
    </div>
    ` : ''}

    <!-- Next Steps -->
    <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: 600; color: #1e40af;">What's Next?</h3>
      <ol style="margin: 0; padding-left: 20px; font-size: 14px; color: #1e3a8a;">
        <li style="margin-bottom: 8px;">Browse ${tutorName}'s available time slots</li>
        <li style="margin-bottom: 8px;">Select a service and time that works for you</li>
        <li style="margin-bottom: 8px;">Complete the booking</li>
        <li>You'll receive confirmation with meeting details</li>
      </ol>
    </div>

    <!-- CTA Button -->
    <div style="text-align: center; margin: 30px 0;">
      <a href="${bookingUrl}" style="display: inline-block; background: #8B7355; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Book Your First Lesson
      </a>
    </div>

    <!-- Contact Info -->
    <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
      <p style="font-size: 14px; color: #6b7280; margin: 0 0 10px 0;">
        Have questions? Contact ${tutorName} directly:
      </p>
      <p style="font-size: 14px; margin: 0;">
        <a href="mailto:${tutorEmail}" style="color: #8B7355; text-decoration: none;">${tutorEmail}</a>
      </p>
    </div>

  </div>

  <!-- Footer -->
  <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
    <p style="margin: 0;">TutorLingua - Your Learning Platform</p>
    <p style="margin: 5px 0 0 0;">
      <a href="${bookingUrl}" style="color: #8B7355; text-decoration: none;">View Calendar</a>
    </p>
  </div>

</body>
</html>
  `.trim();
}

export function AccessApprovedEmailText({
  studentName,
  tutorName,
  tutorEmail,
  tutorNotes,
  bookingUrl,
  paymentInstructions,
}: AccessApprovedEmailProps) {
  return `
Calendar Access Approved!

Hi ${studentName},

Great news! ${tutorName} has approved your request to access their booking calendar.

You can now view available time slots and book lessons directly.

${tutorNotes ? `
MESSAGE FROM ${tutorName.toUpperCase()}:
${tutorNotes}
` : ''}

${paymentInstructions && (paymentInstructions.general || paymentInstructions.venmoHandle || paymentInstructions.paypalEmail || paymentInstructions.zellePhone || paymentInstructions.stripePaymentLink || paymentInstructions.customPaymentUrl) ? `
PAYMENT INFORMATION
${paymentInstructions.general || ''}

${paymentInstructions.venmoHandle ? `Venmo: ${paymentInstructions.venmoHandle}` : ''}
${paymentInstructions.paypalEmail ? `PayPal: ${paymentInstructions.paypalEmail}` : ''}
${paymentInstructions.zellePhone ? `Zelle: ${paymentInstructions.zellePhone}` : ''}
${paymentInstructions.stripePaymentLink ? `Stripe Payment Link: ${paymentInstructions.stripePaymentLink}` : ''}
${paymentInstructions.customPaymentUrl ? `Payment Options: ${paymentInstructions.customPaymentUrl}` : ''}
` : ''}

WHAT'S NEXT?
1. Browse ${tutorName}'s available time slots
2. Select a service and time that works for you
3. Complete the booking
4. You'll receive confirmation with meeting details

Book Your First Lesson: ${bookingUrl}

---
Have questions? Contact ${tutorName} directly:
${tutorEmail}

TutorLingua - Your Learning Platform
View Calendar: ${bookingUrl}
  `.trim();
}

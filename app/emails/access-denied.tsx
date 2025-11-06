/**
 * Email template sent to student when tutor denies calendar access
 */

interface AccessDeniedEmailProps {
  studentName: string;
  tutorName: string;
  tutorEmail: string;
  tutorNotes?: string;
  instagramHandle?: string;
  websiteUrl?: string;
}

export function AccessDeniedEmail({
  studentName,
  tutorName,
  tutorEmail,
  tutorNotes,
  instagramHandle,
  websiteUrl,
}: AccessDeniedEmailProps) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Calendar Access Request Update</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

  <!-- Header -->
  <div style="background: linear-gradient(135deg, #8B7355 0%, #6B5345 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="margin: 0; font-size: 24px; font-weight: 600;">Calendar Access Request Update</h1>
  </div>

  <!-- Content -->
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">

    <p style="font-size: 16px; margin-bottom: 20px;">Hi ${studentName},</p>

    <p style="font-size: 16px; margin-bottom: 20px;">
      Thank you for your interest in booking lessons with <strong>${tutorName}</strong>.
    </p>

    <p style="font-size: 16px; margin-bottom: 20px;">
      Unfortunately, ${tutorName} is unable to accept your booking request at this time.
    </p>

    ${tutorNotes ? `
    <!-- Tutor Notes -->
    <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: 600; color: #991b1b;">Message from ${tutorName}:</h3>
      <p style="margin: 0; font-size: 14px; color: #7f1d1d; line-height: 1.5; white-space: pre-wrap;">${tutorNotes}</p>
    </div>
    ` : ''}

    <!-- What to do next -->
    <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: 600; color: #1e40af;">What You Can Do</h3>
      <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #1e3a8a;">
        <li style="margin-bottom: 8px;">Contact ${tutorName} directly to discuss your situation</li>
        <li style="margin-bottom: 8px;">Ask about alternative scheduling options</li>
        <li>Check back later if availability changes</li>
      </ul>
    </div>

    <!-- Contact Options -->
    <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="margin: 0 0 15px 0; font-size: 16px; font-weight: 600; color: #374151;">Contact ${tutorName}</h3>

      <div style="margin-bottom: 15px;">
        <p style="margin: 0 0 5px 0; font-size: 14px; color: #6b7280;">Email:</p>
        <p style="margin: 0;">
          <a href="mailto:${tutorEmail}" style="color: #8B7355; text-decoration: none; font-size: 16px; font-weight: 500;">${tutorEmail}</a>
        </p>
      </div>

      ${instagramHandle ? `
      <div style="margin-bottom: 15px;">
        <p style="margin: 0 0 5px 0; font-size: 14px; color: #6b7280;">Instagram:</p>
        <p style="margin: 0;">
          <a href="https://instagram.com/${instagramHandle.replace(/^@/, '')}" style="color: #8B7355; text-decoration: none; font-size: 16px; font-weight: 500;">${instagramHandle}</a>
        </p>
      </div>
      ` : ''}

      ${websiteUrl ? `
      <div>
        <p style="margin: 0 0 5px 0; font-size: 14px; color: #6b7280;">Website:</p>
        <p style="margin: 0;">
          <a href="${websiteUrl}" style="color: #8B7355; text-decoration: none; font-size: 16px; font-weight: 500;">${websiteUrl}</a>
        </p>
      </div>
      ` : ''}
    </div>

    <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
      If you believe this was a mistake or have questions about the decision, please reach out to ${tutorName} directly using the contact information above.
    </p>

  </div>

  <!-- Footer -->
  <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
    <p style="margin: 0;">TutorLingua - Your Learning Platform</p>
  </div>

</body>
</html>
  `.trim();
}

export function AccessDeniedEmailText({
  studentName,
  tutorName,
  tutorEmail,
  tutorNotes,
  instagramHandle,
  websiteUrl,
}: AccessDeniedEmailProps) {
  return `
Calendar Access Request Update

Hi ${studentName},

Thank you for your interest in booking lessons with ${tutorName}.

Unfortunately, ${tutorName} is unable to accept your booking request at this time.

${tutorNotes ? `
MESSAGE FROM ${tutorName.toUpperCase()}:
${tutorNotes}
` : ''}

WHAT YOU CAN DO:
- Contact ${tutorName} directly to discuss your situation
- Ask about alternative scheduling options
- Check back later if availability changes

CONTACT ${tutorName.toUpperCase()}:
Email: ${tutorEmail}
${instagramHandle ? `Instagram: ${instagramHandle} (https://instagram.com/${instagramHandle.replace(/^@/, '')})` : ''}
${websiteUrl ? `Website: ${websiteUrl}` : ''}

If you believe this was a mistake or have questions about the decision, please reach out to ${tutorName} directly using the contact information above.

---
TutorLingua - Your Learning Platform
  `.trim();
}

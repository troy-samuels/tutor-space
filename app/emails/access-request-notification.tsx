/**
 * Email template sent to tutor when a student requests calendar access
 */

interface AccessRequestNotificationEmailProps {
  tutorName: string;
  studentName: string;
  studentEmail: string;
  studentPhone?: string;
  studentMessage?: string;
  reviewUrl: string;
}

export function AccessRequestNotificationEmail({
  tutorName,
  studentName,
  studentEmail,
  studentPhone,
  studentMessage,
  reviewUrl,
}: AccessRequestNotificationEmailProps) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Access Request</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

  <!-- Header -->
  <div style="background: linear-gradient(135deg, #8B7355 0%, #6B5345 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="margin: 0; font-size: 24px; font-weight: 600;">New Calendar Access Request</h1>
  </div>

  <!-- Content -->
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">

    <p style="font-size: 16px; margin-bottom: 20px;">Hi ${tutorName},</p>

    <p style="font-size: 16px; margin-bottom: 20px;">
      <strong>${studentName}</strong> has requested access to your booking calendar.
    </p>

    <!-- Student Details -->
    <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="margin: 0 0 15px 0; font-size: 16px; font-weight: 600; color: #6B5345;">Student Information</h3>

      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Name:</td>
          <td style="padding: 8px 0; font-size: 14px; font-weight: 500;">${studentName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Email:</td>
          <td style="padding: 8px 0; font-size: 14px;">
            <a href="mailto:${studentEmail}" style="color: #8B7355; text-decoration: none;">${studentEmail}</a>
          </td>
        </tr>
        ${studentPhone ? `
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Phone:</td>
          <td style="padding: 8px 0; font-size: 14px;">
            <a href="tel:${studentPhone}" style="color: #8B7355; text-decoration: none;">${studentPhone}</a>
          </td>
        </tr>
        ` : ''}
      </table>
    </div>

    ${studentMessage ? `
    <!-- Student Message -->
    <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: 600; color: #1e40af;">Message from ${studentName}:</h3>
      <p style="margin: 0; font-size: 14px; color: #1e3a8a; line-height: 1.5;">${studentMessage}</p>
    </div>
    ` : ''}

    <!-- Next Steps -->
    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 14px; color: #92400e;">
        <strong>Action Required:</strong> Review this request and approve or deny calendar access.
      </p>
    </div>

    <!-- CTA Button -->
    <div style="text-align: center; margin: 30px 0;">
      <a href="${reviewUrl}" style="display: inline-block; background: #8B7355; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Review Request
      </a>
    </div>

    <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
      Once you approve the request, the student will be able to see your calendar and book lessons. You can also add payment instructions and notes when approving.
    </p>

  </div>

  <!-- Footer -->
  <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
    <p style="margin: 0;">TutorLingua - Your Teaching Platform</p>
    <p style="margin: 5px 0 0 0;">
      <a href="${reviewUrl}" style="color: #8B7355; text-decoration: none;">Manage Access Requests</a>
    </p>
  </div>

</body>
</html>
  `.trim();
}

export function AccessRequestNotificationEmailText({
  tutorName,
  studentName,
  studentEmail,
  studentPhone,
  studentMessage,
  reviewUrl,
}: AccessRequestNotificationEmailProps) {
  return `
New Calendar Access Request

Hi ${tutorName},

${studentName} has requested access to your booking calendar.

STUDENT INFORMATION
Name: ${studentName}
Email: ${studentEmail}
${studentPhone ? `Phone: ${studentPhone}` : ''}

${studentMessage ? `
MESSAGE FROM STUDENT:
${studentMessage}
` : ''}

ACTION REQUIRED
Review this request and approve or deny calendar access.

Review Request: ${reviewUrl}

Once you approve the request, the student will be able to see your calendar and book lessons. You can also add payment instructions and notes when approving.

---
TutorLingua - Your Teaching Platform
Manage Access Requests: ${reviewUrl}
  `.trim();
}

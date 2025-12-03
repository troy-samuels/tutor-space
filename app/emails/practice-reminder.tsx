import { formatInTimeZone } from "date-fns-tz";

interface PracticeReminderEmailProps {
  studentName: string;
  tutorName: string;
  homeworkTitle: string;
  dueDate: string;
  timezone: string;
  practiceUrl: string;
}

export function PracticeReminderEmail({
  studentName,
  tutorName,
  homeworkTitle,
  dueDate,
  timezone,
  practiceUrl,
}: PracticeReminderEmailProps) {
  const formattedDate = formatInTimeZone(dueDate, timezone, "EEEE, MMMM d");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Extra Practice Available</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Extra Practice Available</h1>
              <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Reinforce what you're learning</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">

              <p style="margin: 0 0 20px 0; color: #333; font-size: 16px; line-height: 1.6;">
                Hi ${studentName},
              </p>

              <p style="margin: 0 0 30px 0; color: #333; font-size: 16px; line-height: 1.6;">
                Your homework "<strong>${homeworkTitle}</strong>" is due on <strong>${formattedDate}</strong>.
                ${tutorName} has made AI practice available to help you reinforce the topic.
              </p>

              <!-- Practice Card -->
              <div style="background: linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%); border: 1px solid #DDD6FE; border-radius: 12px; padding: 24px; margin-bottom: 30px; text-align: center;">
                <div style="font-size: 48px; margin-bottom: 12px;">🎯</div>
                <h2 style="margin: 0 0 8px 0; color: #5B21B6; font-size: 20px; font-weight: 600;">
                  Practice conversation
                </h2>
                <p style="margin: 0 0 20px 0; color: #6B7280; font-size: 14px; line-height: 1.5;">
                  Have a conversation with our AI tutor to practice the topic.<br>
                  It only takes a few minutes!
                </p>
                <a href="${practiceUrl}" style="display: inline-block; background-color: #7C3AED; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                  Try a Practice Session
                </a>
              </div>

              <!-- Note -->
              <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
                <p style="margin: 0; color: #78350F; font-size: 14px; line-height: 1.6;">
                  <strong>This is optional.</strong> Practice is extra reinforcement to help you feel more confident with the material before your homework is due.
                </p>
              </div>

              <p style="margin: 0; color: #666; font-size: 14px; line-height: 1.6;">
                Good luck with your studies!
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9f9f9; padding: 30px; text-align: center; border-top: 1px solid #e5e5e5;">
              <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">
                Sent on behalf of ${tutorName}
              </p>
              <p style="margin: 0; color: #999; font-size: 12px;">
                Powered by TutorLingua
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
export function PracticeReminderEmailText({
  studentName,
  tutorName,
  homeworkTitle,
  dueDate,
  timezone,
  practiceUrl,
}: PracticeReminderEmailProps) {
  const formattedDate = formatInTimeZone(dueDate, timezone, "EEEE, MMMM d");

  return `EXTRA PRACTICE AVAILABLE

Hi ${studentName},

Your homework "${homeworkTitle}" is due on ${formattedDate}. ${tutorName} has made AI practice available to help you reinforce the topic.

TRY A PRACTICE SESSION:
${practiceUrl}

This is optional. Practice is extra reinforcement to help you feel more confident with the material before your homework is due.

Good luck with your studies!

---
Sent on behalf of ${tutorName}
Powered by TutorLingua
`;
}

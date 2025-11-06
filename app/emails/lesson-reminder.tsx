import { formatInTimeZone } from "date-fns-tz";

interface LessonReminderEmailProps {
  studentName: string;
  tutorName: string;
  serviceName: string;
  scheduledAt: string;
  durationMinutes: number;
  timezone: string;
  meetingUrl?: string;
  meetingProvider?: string;
  customVideoName?: string;
  hoursUntil: 24 | 1;
}

export function LessonReminderEmail({
  studentName,
  tutorName,
  serviceName,
  scheduledAt,
  durationMinutes,
  timezone,
  meetingUrl,
  meetingProvider,
  customVideoName,
  hoursUntil,
}: LessonReminderEmailProps) {
  const formattedDate = formatInTimeZone(scheduledAt, timezone, "EEEE, MMMM d, yyyy");
  const formattedTime = formatInTimeZone(scheduledAt, timezone, "h:mm a zzz");

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
  const reminderText = hoursUntil === 24 ? "tomorrow" : "in 1 hour";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lesson Reminder</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${hoursUntil === 1 ? "#DC2626" : "#8B6B47"} 0%, ${hoursUntil === 1 ? "#991B1B" : "#6B5335"} 100%); padding: 40px 30px; text-align: center;">
              ${
                hoursUntil === 1
                  ? `<h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700;">⏰ STARTING SOON!</h1>`
                  : `<h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">📚 Lesson Tomorrow</h1>`
              }
              <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Your lesson with ${tutorName} ${reminderText}</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">

              <p style="margin: 0 0 20px 0; color: #333; font-size: 16px; line-height: 1.6;">
                Hi ${studentName},
              </p>

              <p style="margin: 0 0 30px 0; color: #333; font-size: 16px; line-height: 1.6;">
                ${
                  hoursUntil === 1
                    ? `Your lesson starts in <strong>1 hour</strong>! Make sure you're ready to join.`
                    : `This is a friendly reminder that you have a lesson scheduled for tomorrow.`
                }
              </p>

              <!-- Lesson Details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9f9f9; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                <tr>
                  <td style="padding-bottom: 15px;">
                    <strong style="color: #8B6B47; font-size: 14px; display: block; margin-bottom: 5px;">TUTOR</strong>
                    <span style="color: #333; font-size: 16px;">${tutorName}</span>
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
                  <td>
                    <strong style="color: #8B6B47; font-size: 14px; display: block; margin-bottom: 5px;">DURATION</strong>
                    <span style="color: #333; font-size: 16px;">${durationMinutes} minutes</span>
                  </td>
                </tr>
              </table>

              ${
                meetingUrl && providerName
                  ? `
              <!-- Join Button -->
              <div style="background-color: ${hoursUntil === 1 ? "#FEE2E2" : "#DBEAFE"}; border-left: 4px solid ${hoursUntil === 1 ? "#DC2626" : "#3B82F6"}; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                <h2 style="margin: 0 0 15px 0; color: ${hoursUntil === 1 ? "#991B1B" : "#1E40AF"}; font-size: 18px; font-weight: 600;">
                  ${hoursUntil === 1 ? "🚀 Join Now!" : "📹 Meeting Link"}
                </h2>
                <p style="margin: 0 0 15px 0; color: ${hoursUntil === 1 ? "#7F1D1D" : "#1E3A8A"}; font-size: 14px; line-height: 1.6;">
                  Your lesson will take place on ${providerName}.
                </p>
                <div style="text-align: center; margin: 20px 0;">
                  <a href="${meetingUrl}" style="display: inline-block; background-color: ${hoursUntil === 1 ? "#DC2626" : "#3B82F6"}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                    Join on ${providerName}
                  </a>
                </div>
                <p style="margin: 0; color: ${hoursUntil === 1 ? "#7F1D1D" : "#1E3A8A"}; font-size: 12px; text-align: center; word-break: break-all;">
                  ${meetingUrl}
                </p>
              </div>
              `
                  : `
              <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                <h2 style="margin: 0 0 10px 0; color: #92400E; font-size: 18px; font-weight: 600;">Meeting Link</h2>
                <p style="margin: 0; color: #78350F; font-size: 14px; line-height: 1.6;">
                  ${tutorName} will send you the meeting link before your lesson starts.
                </p>
              </div>
              `
              }

              ${
                hoursUntil === 1
                  ? `
              <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <p style="margin: 0; color: #78350F; font-size: 14px; line-height: 1.6;">
                  <strong>💡 Quick Tips:</strong>
                </p>
                <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #78350F; font-size: 14px;">
                  <li>Test your camera and microphone</li>
                  <li>Have any materials ready</li>
                  <li>Find a quiet space</li>
                </ul>
              </div>
              `
                  : ""
              }

              <p style="margin: 0; color: #666; font-size: 14px; line-height: 1.6;">
                ${hoursUntil === 1 ? "See you soon!" : "Looking forward to your lesson!"}
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
export function LessonReminderEmailText({
  studentName,
  tutorName,
  serviceName,
  scheduledAt,
  durationMinutes,
  timezone,
  meetingUrl,
  meetingProvider,
  customVideoName,
  hoursUntil,
}: LessonReminderEmailProps) {
  const formattedDate = formatInTimeZone(scheduledAt, timezone, "EEEE, MMMM d, yyyy");
  const formattedTime = formatInTimeZone(scheduledAt, timezone, "h:mm a zzz");

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

  let text = `${hoursUntil === 1 ? "⏰ LESSON STARTING SOON!" : "📚 LESSON REMINDER"}

Hi ${studentName},

${
    hoursUntil === 1
      ? `Your lesson starts in 1 HOUR! Make sure you're ready to join.`
      : `This is a friendly reminder that you have a lesson scheduled for tomorrow.`
  }

LESSON DETAILS:
--------------
Tutor: ${tutorName}
Service: ${serviceName}
Date: ${formattedDate}
Time: ${formattedTime}
Duration: ${durationMinutes} minutes

`;

  if (meetingUrl && providerName) {
    text += `JOIN YOUR LESSON:
----------------
Platform: ${providerName}
Meeting Link: ${meetingUrl}

`;
  } else {
    text += `MEETING LINK:
-------------
${tutorName} will send you the meeting link before your lesson starts.

`;
  }

  if (hoursUntil === 1) {
    text += `QUICK TIPS:
-----------
✓ Test your camera and microphone
✓ Have any materials ready
✓ Find a quiet space

`;
  }

  text += `${hoursUntil === 1 ? "See you soon!" : "Looking forward to your lesson!"}

---
Powered by Learn with Sarai
© ${new Date().getFullYear()} Learn with Sarai. All rights reserved.
`;

  return text;
}

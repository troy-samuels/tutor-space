interface ParentUpdateEmailProps {
  parentName?: string;
  studentName: string;
  tutorName: string;
  lessonDate: string;
  timezone: string;
  highlights: string[];
  nextFocus?: string;
  resources?: Array<{ label: string; url: string }>;
  bookingLink?: string;
}

const baseStyles =
  "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;line-height:1.6;color:#0f172a;";

export function ParentUpdateEmail({
  parentName,
  studentName,
  tutorName,
  lessonDate,
  timezone,
  highlights,
  nextFocus,
  resources,
  bookingLink,
}: ParentUpdateEmailProps) {
  const greeting = parentName ? `Hi ${parentName},` : "Hello!";
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${studentName}'s lesson update</title>
  </head>
  <body style="${baseStyles}background:#f8fafc;padding:32px 0;margin:0;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:640px;background:#ffffff;border-radius:18px;border:1px solid #e2e8f0;padding:32px;">
            <tr>
              <td>
                <p style="font-size:16px;">${greeting}</p>
                <p style="font-size:15px;color:#475569;">
                  Here’s a quick recap of ${studentName}’s ${lessonDate} lesson (${timezone}).
                </p>
                <div style="margin:24px 0;padding:20px;border-radius:16px;background:#ecfccb;border:1px solid #bef264;">
                  <p style="font-size:13px;text-transform:uppercase;color:#4d7c0f;margin:0 0 12px 0;">Wins & Highlights</p>
                  <ul style="padding-left:20px;margin:0;color:#365314;font-size:14px;">
                    ${highlights.map((item) => `<li>${item}</li>`).join("")}
                  </ul>
                </div>
                ${
                  nextFocus
                    ? `<div style="margin:24px 0;padding:20px;border-radius:16px;background:#e0f2fe;border:1px solid #bae6fd;">
                    <p style="font-size:13px;text-transform:uppercase;color:#0c4a6e;margin:0 0 12px 0;">What we’re focusing on next</p>
                    <p style="color:#0c4a6e;font-size:14px;">${nextFocus}</p>
                  </div>`
                    : ""
                }
                ${
                  resources && resources.length > 0
                    ? `<div style="margin:24px 0;">
                    <p style="font-size:13px;text-transform:uppercase;color:#94a3b8;margin-bottom:12px;">Practice at home</p>
                    <ul style="padding-left:20px;margin:0;">
                      ${resources
                        .map(
                          (resource) =>
                            `<li><a href="${resource.url}" style="color:#2563eb;">${resource.label}</a></li>`
                        )
                        .join("")}
                    </ul>
                  </div>`
                    : ""
                }
                ${
                  bookingLink
                    ? `<p style="text-align:center;margin:32px 0;">
                    <a href="${bookingLink}" style="display:inline-block;padding:12px 28px;border-radius:9999px;background:#8B6B47;color:#ffffff;text-decoration:none;font-weight:600;">
                      View schedule / book follow-up
                    </a>
                  </p>`
                    : ""
                }
                <p style="font-size:14px;color:#94a3b8;margin-top:32px;">
                  Thanks for trusting me with ${studentName}’s progress. Let me know if you have any questions.
                </p>
                <p style="font-weight:600;">— ${tutorName}</p>
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

export function ParentUpdateEmailText({
  parentName,
  studentName,
  tutorName,
  lessonDate,
  timezone,
  highlights,
  nextFocus,
  resources,
  bookingLink,
}: ParentUpdateEmailProps) {
  return `${parentName ? `Hi ${parentName},` : "Hello!"}

${studentName}'s lesson on ${lessonDate} (${timezone}) went great. Wins:
- ${highlights.join("\n- ")}
${nextFocus ? `\nNext focus: ${nextFocus}\n` : ""}${
    resources && resources.length
      ? `\nPractice links:\n${resources.map((resource) => `• ${resource.label}: ${resource.url}`).join("\n")}\n`
      : ""
  }${bookingLink ? `\nBook/schedule: ${bookingLink}\n` : ""}
— ${tutorName}`.trim();
}

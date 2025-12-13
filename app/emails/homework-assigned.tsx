import { formatInTimeZone } from "date-fns-tz";

type HomeworkAssignedEmailProps = {
  studentName: string;
  tutorName: string;
  title: string;
  instructions?: string | null;
  dueDate?: string | null;
  timezone?: string | null;
  homeworkUrl?: string | null;
  practiceUrl?: string | null;
};

function formatDate(value: string, timezone?: string | null) {
  if (!value) return null;
  try {
    return formatInTimeZone(value, timezone || "UTC", "EEEE, MMMM d");
  } catch {
    return new Date(value).toDateString();
  }
}

export function HomeworkAssignedEmail(props: HomeworkAssignedEmailProps) {
  const { studentName, tutorName, title, instructions, dueDate, timezone, homeworkUrl, practiceUrl } =
    props;

  const formattedDue = dueDate ? formatDate(dueDate, timezone) : null;
  const dueLine = formattedDue
    ? `<p style="margin:0 0 12px 0;"><strong>Due:</strong> ${formattedDue}${timezone ? ` (${timezone})` : ""}</p>`
    : "";

  const cta =
    homeworkUrl || practiceUrl
      ? `<div style="margin:16px 0 0 0;">
            ${homeworkUrl ? `<a href="${homeworkUrl}" style="display:inline-block; margin-right:10px; background:#4338CA; color:#fff; font-weight:600; text-decoration:none; padding:12px 18px; border-radius:10px;">Open homework</a>` : ""}
            ${practiceUrl ? `<a href="${practiceUrl}" style="display:inline-block; background:#10B981; color:#fff; font-weight:600; text-decoration:none; padding:12px 18px; border-radius:10px;">Start practice</a>` : ""}
         </div>`
      : "";

  const instructionsBlock = instructions
    ? `<div style="margin:12px 0 0 0; padding:12px; background:#F9FAFB; border:1px solid #E5E7EB; border-radius:10px; color:#374151; white-space:pre-wrap;">${instructions}</div>`
    : "";

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>New homework assigned</title>
  </head>
  <body style="margin:0; padding:0; background:#F3F4F6; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#F3F4F6; padding:32px 16px;">
      <tr>
        <td align="center">
          <table width="640" cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 8px 20px rgba(0,0,0,0.05);">
            <tr>
              <td style="padding:28px 28px 12px 28px; background:linear-gradient(135deg,#4338CA 0%,#312E81 100%); color:#fff;">
                <h1 style="margin:0; font-size:22px; font-weight:700;">New homework assigned</h1>
                <p style="margin:8px 0 0 0; font-size:15px; color:rgba(255,255,255,0.9);">From ${tutorName}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 28px 16px 28px; color:#111827; font-size:15px; line-height:1.6;">
                <p style="margin:0 0 12px 0;">Hi ${studentName},</p>
                <p style="margin:0 0 10px 0;"><strong>${title}</strong></p>
                ${dueLine}
                ${instructionsBlock}
                ${cta}
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px 24px 28px; background:#F9FAFB; border-top:1px solid #E5E7EB; text-align:center; color:#9CA3AF; font-size:12px;">
                Submit whenever you’re ready—your tutor will be notified.
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

export function HomeworkAssignedEmailText(props: HomeworkAssignedEmailProps) {
  const { studentName, tutorName, title, instructions, dueDate, timezone, homeworkUrl, practiceUrl } =
    props;

  const formattedDue = dueDate ? formatDate(dueDate, timezone) : null;

  return `New homework assigned

Hi ${studentName},

${title}
${formattedDue ? `Due: ${formattedDue}${timezone ? ` (${timezone})` : ""}\n` : ""}${
    instructions ? `\n${instructions}\n` : ""
  }${homeworkUrl ? `Open homework: ${homeworkUrl}\n` : ""}${practiceUrl ? `Practice: ${practiceUrl}\n` : ""}From ${tutorName}.`;
}

interface OnboardingChecklistEmailProps {
  tutorName: string;
  checklist: Array<{ label: string; description: string; link: string }>;
  supportEmail?: string;
}

const baseStyles =
  "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;line-height:1.6;color:#0f172a;";

export function OnboardingChecklistEmail({
  tutorName,
  checklist,
  supportEmail,
}: OnboardingChecklistEmailProps) {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Your 5-minute TutorLingua launch plan</title>
  </head>
  <body style="${baseStyles}background:#f8fafc;padding:32px 0;margin:0;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;background:#ffffff;border-radius:20px;border:1px solid #e2e8f0;padding:36px;">
            <tr>
              <td>
                <p style="font-size:16px;">Welcome, ${tutorName} 🎉</p>
                <p style="font-size:15px;color:#475569;">
                  Here’s the launch checklist to get your tutor site live in under five minutes.
                </p>
                <ol style="margin:24px 0 0 20px;padding:0;color:#0f172a;">
                  ${checklist
                    .map(
                      (item) => `
                    <li style="margin-bottom:18px;">
                      <p style="margin:0;font-weight:600;">${item.label}</p>
                      <p style="margin:4px 0 0 0;font-size:14px;color:#475569;">${item.description}</p>
                      <a href="${item.link}" style="font-size:13px;color:#2563eb;">Open</a>
                    </li>`
                    )
                    .join("")}
                </ol>
                <p style="font-size:13px;color:#94a3b8;margin-top:24px;">
                  ${supportEmail ? `Need help? Reply or email ${supportEmail}.` : "Need help? Reply to this email."}
                </p>
                <p style="margin-top:24px;font-weight:600;">— Team TutorLingua</p>
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

export function OnboardingChecklistEmailText({
  tutorName,
  checklist,
  supportEmail,
}: OnboardingChecklistEmailProps) {
  return `Welcome, ${tutorName}!

Here’s your fast launch checklist:
${checklist
  .map((item, index) => `${index + 1}. ${item.label} — ${item.description} (${item.link})`)
  .join("\n")}

Need help? ${supportEmail ? `Email ${supportEmail}` : "Reply to this email."}
— Team TutorLingua`.trim();
}

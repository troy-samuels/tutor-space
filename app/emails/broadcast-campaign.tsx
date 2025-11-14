interface BroadcastCampaignEmailProps {
  subject: string;
  tutorName: string;
  studentName: string;
  body: string;
  unsubscribeUrl?: string;
}

const baseStyles =
  "font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #111827;";

export function BroadcastCampaignEmail({
  subject,
  tutorName,
  studentName,
  body,
  unsubscribeUrl,
}: BroadcastCampaignEmailProps) {
  const paragraphs = body
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map(
      (paragraph) =>
        `<p style="margin: 0 0 16px 0; font-size: 15px;">${paragraph}</p>`
    )
    .join("\n");

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${subject}</title>
  </head>
  <body style="${baseStyles} background: #f8fafc; padding: 0; margin: 0;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background: #f8fafc; padding: 32px 0;">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 640px; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px;">
            <tr>
              <td>
                <p style="font-size: 14px; color: #6b7280; margin: 0 0 8px 0;">Hi ${studentName},</p>
                ${paragraphs}
                <p style="font-size: 15px; font-weight: 600; margin: 24px 0 0 0;">— ${tutorName}</p>
              </td>
            </tr>
          </table>
          <p style="font-size: 12px; color: #94a3b8; margin-top: 16px;">
            Sent via TutorLingua
            ${unsubscribeUrl ? ` · <a href="${unsubscribeUrl}" style="color: #64748b;">Unsubscribe</a>` : ""}
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>
`.trim();
}

export function BroadcastCampaignEmailText({
  studentName,
  tutorName,
  body,
  unsubscribeUrl,
}: BroadcastCampaignEmailProps) {
  return `Hi ${studentName},

${body}

— ${tutorName}
${unsubscribeUrl ? `\n\nUnsubscribe: ${unsubscribeUrl}` : ""}`.trim();
}

interface TestimonialRequestEmailProps {
  parentName?: string;
  tutorName: string;
  studentName: string;
  lessonHighlight: string;
  testimonialUrl: string;
  incentive?: string;
}

const baseStyles =
  "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;line-height:1.6;color:#0f172a;";

export function TestimonialRequestEmail({
  parentName,
  tutorName,
  studentName,
  lessonHighlight,
  testimonialUrl,
  incentive,
}: TestimonialRequestEmailProps) {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Can you share a quick win?</title>
  </head>
  <body style="${baseStyles}background:#f8fafc;padding:32px 0;margin:0;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:520px;background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;padding:32px;">
            <tr>
              <td>
                <p style="font-size:16px;">${parentName ? `Hi ${parentName},` : "Hi there!"}</p>
                <p style="font-size:15px;color:#475569;">
                  ${studentName} has been crushing it—${lessonHighlight}. Could you take 60 seconds to share a quick testimonial that I can use on my parent credibility page?
                </p>
                ${
                  incentive
                    ? `<p style="font-size:14px;color:#16a34a;">As a thank you, ${incentive}.</p>`
                    : ""
                }
                <p style="text-align:center;margin:28px 0;">
                  <a href="${testimonialUrl}" style="display:inline-block;padding:14px 32px;border-radius:9999px;background:#1d4ed8;color:#ffffff;font-weight:600;text-decoration:none;">
                    Leave a quick testimonial
                  </a>
                </p>
                <p style="font-size:13px;color:#94a3b8;">The form works on desktop or phone. Thank you!</p>
                <p style="margin-top:32px;font-weight:600;">— ${tutorName}</p>
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

export function TestimonialRequestEmailText({
  parentName,
  tutorName,
  studentName,
  lessonHighlight,
  testimonialUrl,
  incentive,
}: TestimonialRequestEmailProps) {
  return `${parentName ? `Hi ${parentName},` : "Hi!"}

${studentName} has been doing great—${lessonHighlight}.
Could you share a quick testimonial? ${testimonialUrl}
${incentive ? `Thank-you perk: ${incentive}\n` : ""}
— ${tutorName}`.trim();
}

type LeadNurtureStage = "getting_started" | "social_proof" | "last_call";

interface LeadNurtureEmailProps {
  tutorName: string;
  leadName?: string;
  stage: LeadNurtureStage;
  bookingLink: string;
  bonusOffer?: string;
}

const stageCopy: Record<
  LeadNurtureStage,
  { headline: string; body: string; cta: string }
> = {
  getting_started: {
    headline: "Ready for your first session?",
    body: `I’d love to learn more about your language goals and map out the perfect plan. 
During our first session we’ll set milestones, review current strengths, and give you an easy win to build momentum.`,
    cta: "Book a trial lesson",
  },
  social_proof: {
    headline: "See how other students made progress",
    body: `Students just like you are publishing projects, passing exams, and holding their first confident conversations.
Let me show you the exact framework we used so you can copy it.`,
    cta: "Claim your spot",
  },
  last_call: {
    headline: "Last call before the waitlist",
    body: `I’m holding a few opening times this week before my schedule fills again. If we should work together, now’s the moment to grab a slot.`,
    cta: "Reserve your lesson",
  },
};

const baseStyles =
  "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;line-height:1.6;color:#0f172a;";

export function LeadNurtureEmail({
  tutorName,
  leadName,
  stage,
  bookingLink,
  bonusOffer,
}: LeadNurtureEmailProps) {
  const copy = stageCopy[stage];
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${copy.headline}</title>
  </head>
  <body style="${baseStyles}background:#f8fafc;padding:0;margin:0;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="padding:32px 0;">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;padding:32px;">
            <tr>
              <td>
                <p style="font-size:16px;">${leadName ? `Hi ${leadName},` : "Hey there!"}</p>
                <h1 style="margin:8px 0 16px 0;font-size:22px;color:#0f172a;">${copy.headline}</h1>
                <p style="font-size:15px;color:#475569;white-space:pre-line;">${copy.body}</p>
                ${
                  bonusOffer
                    ? `<p style="margin-top:12px;font-size:14px;color:#16a34a;"><strong>Bonus:</strong> ${bonusOffer}</p>`
                    : ""
                }
                <p style="text-align:center;margin:28px 0;">
                  <a href="${bookingLink}" style="display:inline-block;padding:14px 32px;border-radius:9999px;background:#8B6B47;color:#ffffff;font-weight:600;text-decoration:none;">
                    ${copy.cta}
                  </a>
                </p>
                <p style="font-size:14px;color:#94a3b8;">If the link doesn’t work, copy and paste: ${bookingLink}</p>
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

export function LeadNurtureEmailText({
  tutorName,
  leadName,
  stage,
  bookingLink,
  bonusOffer,
}: LeadNurtureEmailProps) {
  const copy = stageCopy[stage];
  return `${leadName ? `Hi ${leadName},` : "Hello!"}

${copy.headline}
${copy.body}
${bonusOffer ? `Bonus: ${bonusOffer}\n` : ""}Book here: ${bookingLink}

— ${tutorName}`.trim();
}

export { type LeadNurtureEmailProps, type LeadNurtureStage };

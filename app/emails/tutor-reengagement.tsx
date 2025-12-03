type ReengagementStage = "friendly_checkin" | "feature_highlight" | "account_status";

interface TutorReengagementEmailProps {
  tutorName: string;
  stage: ReengagementStage;
  loginUrl: string;
  daysSinceLogin?: number;
}

const stageCopy: Record<
  ReengagementStage,
  { subject: string; headline: string; body: string; cta: string }
> = {
  friendly_checkin: {
    subject: "We miss you at TutorLingua!",
    headline: "It's been a while!",
    body: `We noticed you haven't logged in for a bit, and we wanted to check in.

Your students and potential new bookings are waiting. Here's what you might have missed:
• New booking features to save you time
• Improved calendar sync reliability
• Enhanced student management tools

Need help getting back on track? Reply to this email and our team will assist you.`,
    cta: "Log in to Dashboard",
  },
  feature_highlight: {
    subject: "New features waiting for you at TutorLingua",
    headline: "See what's new!",
    body: `We've been busy making TutorLingua even better for tutors like you!

Here's what's new since your last visit:
• Streamlined booking flow for students
• Better analytics and insights
• Improved mobile experience

Don't miss out on these improvements that could help grow your tutoring business.

Your profile is still active and ready for students. Come back and see what's changed!`,
    cta: "Explore What's New",
  },
  account_status: {
    subject: "Your TutorLingua account needs attention",
    headline: "Is everything okay?",
    body: `It's been a while since you last logged into TutorLingua.

We want to make sure everything is alright. If you're experiencing any issues or need help with your account, please let us know.

If you'd like to keep your tutor profile active and visible to students, please log in at your earliest convenience.

If you no longer wish to use TutorLingua, you can deactivate your account in Settings. We'd love to hear any feedback you have.`,
    cta: "Reactivate My Account",
  },
};

const baseStyles =
  "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;line-height:1.6;color:#0f172a;";

export function TutorReengagementEmail({
  tutorName,
  stage,
  loginUrl,
  daysSinceLogin,
}: TutorReengagementEmailProps) {
  const copy = stageCopy[stage];
  const greeting = tutorName ? `Hi ${tutorName},` : "Hi there,";
  const daysText = daysSinceLogin ? ` It's been ${daysSinceLogin} days since your last visit.` : "";

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${copy.subject}</title>
  </head>
  <body style="${baseStyles}background:#f8fafc;padding:0;margin:0;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="padding:32px 0;">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;padding:32px;">
            <tr>
              <td>
                <p style="font-size:16px;margin:0 0 16px 0;">${greeting}${daysText}</p>
                <h1 style="margin:8px 0 16px 0;font-size:22px;color:#0f172a;">${copy.headline}</h1>
                <p style="font-size:15px;color:#475569;white-space:pre-line;">${copy.body}</p>
                <p style="text-align:center;margin:28px 0;">
                  <a href="${loginUrl}" style="display:inline-block;padding:14px 32px;border-radius:9999px;background:#8B6B47;color:#ffffff;font-weight:600;text-decoration:none;">
                    ${copy.cta}
                  </a>
                </p>
                <p style="font-size:14px;color:#94a3b8;">If the button doesn't work, copy and paste this link: ${loginUrl}</p>
                <p style="margin-top:32px;font-size:14px;color:#64748b;">Best regards,<br/>The TutorLingua Team</p>
              </td>
            </tr>
          </table>
          <p style="margin-top:24px;font-size:12px;color:#94a3b8;text-align:center;">
            You're receiving this because you have a TutorLingua account.<br/>
            <a href="${loginUrl}" style="color:#94a3b8;">Manage your preferences</a>
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>
`.trim();
}

export function TutorReengagementEmailText({
  tutorName,
  stage,
  loginUrl,
  daysSinceLogin,
}: TutorReengagementEmailProps) {
  const copy = stageCopy[stage];
  const greeting = tutorName ? `Hi ${tutorName},` : "Hi there,";
  const daysText = daysSinceLogin ? ` It's been ${daysSinceLogin} days since your last visit.` : "";

  return `${greeting}${daysText}

${copy.headline}

${copy.body}

${copy.cta}: ${loginUrl}

Best regards,
The TutorLingua Team

---
You're receiving this because you have a TutorLingua account.`.trim();
}

export function getReengagementSubject(stage: ReengagementStage): string {
  return stageCopy[stage].subject;
}

export { type TutorReengagementEmailProps, type ReengagementStage };

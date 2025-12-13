type SubscriptionUpdateEmailProps = {
  recipientName: string;
  audience: "student" | "tutor";
  status: "activated" | "renewed" | "cancellation_scheduled" | "canceled";
  planName: string;
  tutorName: string;
  lessonsPerMonth?: number | null;
  periodEnd?: string | null;
  manageUrl?: string | null;
};

function statusCopy(status: SubscriptionUpdateEmailProps["status"]) {
  switch (status) {
    case "activated":
      return { title: "Subscription started", subtitle: "You're set for this month." };
    case "renewed":
      return { title: "Subscription renewed", subtitle: "New credits added." };
    case "cancellation_scheduled":
      return { title: "Cancellation scheduled", subtitle: "You keep access until period end." };
    case "canceled":
    default:
      return { title: "Subscription cancelled", subtitle: "Access ends after the current period." };
  }
}

export function SubscriptionUpdateEmail(props: SubscriptionUpdateEmailProps) {
  const { recipientName, audience, status, planName, tutorName, lessonsPerMonth, periodEnd, manageUrl } =
    props;
  const { title, subtitle } = statusCopy(status);

  const lessonsLine =
    lessonsPerMonth && lessonsPerMonth > 0
      ? `<p style="margin:0 0 10px 0;"><strong>Lessons per month:</strong> ${lessonsPerMonth}</p>`
      : "";

  const periodLine = periodEnd
    ? `<p style="margin:0 0 10px 0;"><strong>Current period ends:</strong> ${new Date(
        periodEnd
      ).toLocaleDateString()}</p>`
    : "";

  const manageButton = manageUrl
    ? `<a href="${manageUrl}" style="display:inline-block; background:#4338CA; color:#fff; font-weight:600; text-decoration:none; padding:12px 20px; border-radius:10px;">Manage subscription</a>`
    : "";

  const audienceLine =
    audience === "student"
      ? `Tutor: ${tutorName}`
      : `Student subscription for your lessons`;

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
  </head>
  <body style="margin:0; padding:0; background:#F3F4F6; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#F3F4F6; padding:32px 16px;">
      <tr>
        <td align="center">
          <table width="640" cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 8px 20px rgba(0,0,0,0.05);">
            <tr>
              <td style="padding:28px 28px 12px 28px; background:linear-gradient(135deg,#4338CA 0%,#312E81 100%); color:#fff;">
                <h1 style="margin:0; font-size:22px; font-weight:700;">${title}</h1>
                <p style="margin:8px 0 0 0; font-size:15px; color:rgba(255,255,255,0.9);">${subtitle}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 28px 10px 28px; color:#111827; font-size:15px; line-height:1.6;">
                <p style="margin:0 0 12px 0;">Hi ${recipientName},</p>
                <p style="margin:0 0 12px 0;"><strong>${planName}</strong></p>
                <p style="margin:0 0 10px 0; color:#6B7280;">${audienceLine}</p>
                ${lessonsLine}
                ${periodLine}
                ${manageButton}
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px 24px 28px; background:#F9FAFB; border-top:1px solid #E5E7EB; text-align:center; color:#9CA3AF; font-size:12px;">
                If you have questions, reply to this email to reach ${audience === "student" ? tutorName : "your student"}.
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

export function SubscriptionUpdateEmailText(props: SubscriptionUpdateEmailProps) {
  const { recipientName, audience, status, planName, tutorName, lessonsPerMonth, periodEnd, manageUrl } =
    props;
  const { title, subtitle } = statusCopy(status);

  return `${title}

Hi ${recipientName},

${planName}
${subtitle}
${audience === "student" ? `Tutor: ${tutorName}\n` : "Student subscription for your lessons\n"}${
    lessonsPerMonth ? `Lessons per month: ${lessonsPerMonth}\n` : ""
  }${periodEnd ? `Current period ends: ${new Date(periodEnd).toLocaleDateString()}\n` : ""}${
    manageUrl ? `Manage subscription: ${manageUrl}\n` : ""
  }If you have questions, reply to this email.`;
}

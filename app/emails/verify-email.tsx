interface VerifyEmailEmailProps {
  confirmUrl: string;
  role: "tutor" | "student";
}

const baseStyles =
  "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;line-height:1.6;color:#0f172a;";

export function VerifyEmailEmail({ confirmUrl, role }: VerifyEmailEmailProps) {
  const heading =
    role === "student"
      ? "Confirm your email to start learning"
      : "Confirm your email to start onboarding";
  const intro =
    role === "student"
      ? "Use the link below to verify your email and activate your student account."
      : "Use the link below to verify your email and activate your tutor account.";

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${heading}</title>
  </head>
  <body style="${baseStyles}background:#f8fafc;padding:32px 0;margin:0;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;background:#ffffff;border-radius:20px;border:1px solid #e2e8f0;padding:32px 28px;box-shadow:0 12px 50px rgba(15,23,42,0.08);">
            <tr>
              <td>
                <h1 style="margin:0 0 12px 0;font-size:22px;color:#0f172a;">${heading}</h1>
                <p style="margin:0 0 18px 0;font-size:16px;color:#0f172a;">
                  ${intro}
                </p>

                <div style="margin:28px 0;text-align:center;">
                  <a href="${confirmUrl}" style="display:inline-block;background:#D36135;color:#fff;padding:14px 28px;border-radius:12px;font-weight:700;font-size:15px;text-decoration:none;">
                    Confirm email
                  </a>
                </div>

                <p style="margin:0;font-size:14px;color:#6B6560;">
                  If you did not request this email, you can safely ignore it.
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

export function VerifyEmailEmailText({ confirmUrl, role }: VerifyEmailEmailProps) {
  const heading =
    role === "student"
      ? "Confirm your email to start learning"
      : "Confirm your email to start onboarding";
  const intro =
    role === "student"
      ? "Use the link below to verify your email and activate your student account."
      : "Use the link below to verify your email and activate your tutor account.";

  return `
${heading}

${intro}

Click here to confirm: ${confirmUrl}

If you did not request this email, you can safely ignore it.
  `.trim();
}

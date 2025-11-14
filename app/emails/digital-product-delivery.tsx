interface DigitalProductDeliveryEmailProps {
  studentName?: string | null;
  tutorName: string;
  productTitle: string;
  downloadUrl: string;
  supportEmail?: string;
}

const baseStyles =
  "font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #111827;";

export function DigitalProductDeliveryEmail({
  studentName,
  tutorName,
  productTitle,
  downloadUrl,
  supportEmail,
}: DigitalProductDeliveryEmailProps) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Your ${productTitle} download</title>
</head>
<body style="${baseStyles} background:#f8fafc; padding:32px;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;padding:32px;">
    <tr>
      <td>
        <p style="font-size:16px;">Hi ${studentName || "there"},</p>
        <p style="font-size:15px;">
          Thanks for purchasing <strong>${productTitle}</strong> from ${tutorName}. Use the link below to download your resources. The link stays active for a few minutes—feel free to download again later using the same email if needed.
        </p>
        <p style="text-align:center;margin:24px 0;">
          <a href="${downloadUrl}" style="display:inline-block;padding:14px 24px;border-radius:9999px;background:#8B7355;color:#ffffff;font-weight:600;text-decoration:none;">
            Download ${productTitle}
          </a>
        </p>
        <p style="font-size:14px;color:#6b7280;">
          Having trouble? ${supportEmail ? `Reach me at ${supportEmail}.` : "Reply to this email and I’ll help you out."}
        </p>
        <p style="font-size:15px;font-weight:600;margin-top:32px;">— ${tutorName}</p>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
}

export function DigitalProductDeliveryEmailText({
  studentName,
  tutorName,
  productTitle,
  downloadUrl,
  supportEmail,
}: DigitalProductDeliveryEmailProps) {
  return `Hi ${studentName || "there"},

Thanks for purchasing ${productTitle} from ${tutorName}.

Download it here: ${downloadUrl}

Need help? ${supportEmail ? `Email ${supportEmail}` : "Reply to this message."}

— ${tutorName}`.trim();
}

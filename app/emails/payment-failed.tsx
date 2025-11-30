interface PaymentFailedEmailProps {
  userName: string;
  planName: string;
  amountDue: string;
  nextRetryDate?: string;
  updatePaymentUrl: string;
}

const baseStyles =
  "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;line-height:1.6;color:#0f172a;";

export function PaymentFailedEmail({
  userName,
  planName,
  amountDue,
  nextRetryDate,
  updatePaymentUrl,
}: PaymentFailedEmailProps) {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Payment failed - action required</title>
  </head>
  <body style="${baseStyles}background:#f8fafc;padding:32px 0;margin:0;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:640px;background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;padding:32px;">
            <tr>
              <td>
                <div style="text-align:center;margin-bottom:24px;">
                  <div style="display:inline-block;width:48px;height:48px;background:#fef2f2;border-radius:50%;line-height:48px;font-size:24px;">
                    &#9888;
                  </div>
                </div>
                <h1 style="font-size:20px;font-weight:600;text-align:center;margin:0 0 16px;">
                  Payment Failed
                </h1>
                <p style="font-size:16px;">Hi ${userName},</p>
                <p style="font-size:15px;color:#475569;">
                  We weren't able to process your payment for your <strong>${planName}</strong> subscription.
                </p>
                <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;border-radius:12px;background:#fef2f2;border:1px solid #fecaca;padding:20px;">
                  <tr>
                    <td style="font-size:13px;text-transform:uppercase;color:#94a3b8;">Plan</td>
                    <td style="text-align:right;font-weight:600;color:#0f172a;">${planName}</td>
                  </tr>
                  <tr>
                    <td style="padding-top:8px;font-size:13px;text-transform:uppercase;color:#94a3b8;">Amount Due</td>
                    <td style="padding-top:8px;text-align:right;color:#dc2626;font-weight:600;">${amountDue}</td>
                  </tr>
                  ${
                    nextRetryDate
                      ? `<tr>
                    <td style="padding-top:8px;font-size:13px;text-transform:uppercase;color:#94a3b8;">Next Retry</td>
                    <td style="padding-top:8px;text-align:right;color:#0f172a;">${nextRetryDate}</td>
                  </tr>`
                      : ""
                  }
                </table>
                <p style="font-size:15px;color:#475569;">
                  To avoid any interruption to your service, please update your payment method as soon as possible.
                </p>
                <p style="text-align:center;margin:32px 0;">
                  <a href="${updatePaymentUrl}" style="display:inline-block;padding:14px 32px;border-radius:9999px;background:#8b5cf6;color:#ffffff;font-weight:600;text-decoration:none;">
                    Update Payment Method
                  </a>
                </p>
                <p style="font-size:14px;color:#94a3b8;">
                  If you believe this is an error or need assistance, please contact our support team.
                </p>
                <p style="margin-top:32px;font-weight:600;">— The TutorLingua Team</p>
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

export function PaymentFailedEmailText({
  userName,
  planName,
  amountDue,
  nextRetryDate,
  updatePaymentUrl,
}: PaymentFailedEmailProps) {
  return `Hi ${userName},

We weren't able to process your payment for your ${planName} subscription.

Plan: ${planName}
Amount Due: ${amountDue}
${nextRetryDate ? `Next Retry: ${nextRetryDate}\n` : ""}
To avoid any interruption to your service, please update your payment method:
${updatePaymentUrl}

If you believe this is an error or need assistance, please contact our support team.

— The TutorLingua Team`.trim();
}

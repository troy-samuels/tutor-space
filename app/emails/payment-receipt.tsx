interface PaymentReceiptEmailProps {
  studentName: string;
  tutorName: string;
  serviceName: string;
  scheduledAt: string;
  timezone: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  invoiceNumber?: string;
  invoiceUrl?: string;
  notes?: string;
}

const baseStyles =
  "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;line-height:1.6;color:#0f172a;";

function formatAmount(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(amount / 100);
  } catch {
    return `${currency.toUpperCase()} ${(amount / 100).toFixed(2)}`;
  }
}

export function PaymentReceiptEmail({
  studentName,
  tutorName,
  serviceName,
  scheduledAt,
  timezone,
  amount,
  currency,
  paymentMethod,
  invoiceNumber,
  invoiceUrl,
  notes,
}: PaymentReceiptEmailProps) {
  const formattedAmount = formatAmount(amount, currency);
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${serviceName} payment receipt</title>
  </head>
  <body style="${baseStyles}background:#f8fafc;padding:32px 0;margin:0;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:640px;background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;padding:32px;">
            <tr>
              <td>
                <p style="font-size:16px;">Hi ${studentName},</p>
                <p style="font-size:15px;color:#475569;">
                  Thanks for your payment. Here’s a quick receipt for your records.
                </p>
                <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;border-radius:12px;background:#f8fafc;padding:20px;">
                  <tr>
                    <td style="font-size:13px;text-transform:uppercase;color:#94a3b8;">Service</td>
                    <td style="text-align:right;font-weight:600;color:#0f172a;">${serviceName}</td>
                  </tr>
                  <tr>
                    <td style="padding-top:8px;font-size:13px;text-transform:uppercase;color:#94a3b8;">Scheduled</td>
                    <td style="padding-top:8px;text-align:right;color:#0f172a;">${scheduledAt} (${timezone})</td>
                  </tr>
                  <tr>
                    <td style="padding-top:8px;font-size:13px;text-transform:uppercase;color:#94a3b8;">Paid</td>
                    <td style="padding-top:8px;text-align:right;color:#0f172a;">${formattedAmount}</td>
                  </tr>
                  <tr>
                    <td style="padding-top:8px;font-size:13px;text-transform:uppercase;color:#94a3b8;">Method</td>
                    <td style="padding-top:8px;text-align:right;color:#0f172a;">${paymentMethod}</td>
                  </tr>
                  ${
                    invoiceNumber
                      ? `<tr><td style="padding-top:8px;font-size:13px;text-transform:uppercase;color:#94a3b8;">Invoice #</td><td style="padding-top:8px;text-align:right;color:#0f172a;">${invoiceNumber}</td></tr>`
                      : ""
                  }
                </table>
                ${
                  invoiceUrl
                    ? `<p style="text-align:center;margin:24px 0;">
                    <a href="${invoiceUrl}" style="display:inline-block;padding:12px 28px;border-radius:9999px;background:#8b5cf6;color:#ffffff;font-weight:600;text-decoration:none;">
                      View detailed invoice
                    </a>
                  </p>`
                    : ""
                }
                ${
                  notes
                    ? `<p style="font-size:14px;color:#475569;">Notes: ${notes}</p>`
                    : ""
                }
                <p style="font-size:14px;color:#94a3b8;">
                  Keep this receipt for your records. Let me know if you need anything else.
                </p>
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

export function PaymentReceiptEmailText({
  studentName,
  tutorName,
  serviceName,
  scheduledAt,
  timezone,
  amount,
  currency,
  paymentMethod,
  invoiceNumber,
  invoiceUrl,
  notes,
}: PaymentReceiptEmailProps) {
  const formattedAmount = formatAmount(amount, currency);
  return `Hi ${studentName},

Payment received for ${serviceName}.

Scheduled: ${scheduledAt} (${timezone})
Amount: ${formattedAmount}
Method: ${paymentMethod}
${invoiceNumber ? `Invoice #: ${invoiceNumber}\n` : ""}${notes ? `Notes: ${notes}\n` : ""}${
    invoiceUrl ? `Invoice: ${invoiceUrl}\n` : ""
  }
— ${tutorName}`.trim();
}

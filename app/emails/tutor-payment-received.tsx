interface TutorPaymentReceivedEmailProps {
  tutorName: string;
  studentName: string;
  serviceName: string;
  scheduledAt: string;
  timezone: string;
  amountCents: number;
  currency: string;
  paymentMethod: string;
  notes?: string;
  dashboardUrl?: string;
}

const baseStyles =
  "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;line-height:1.6;color:#0f172a;";

function formatAmount(amountCents: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(amountCents / 100);
  } catch {
    return `${currency.toUpperCase()} ${(amountCents / 100).toFixed(2)}`;
  }
}

export function TutorPaymentReceivedEmail({
  tutorName,
  studentName,
  serviceName,
  scheduledAt,
  timezone,
  amountCents,
  currency,
  paymentMethod,
  notes,
  dashboardUrl,
}: TutorPaymentReceivedEmailProps) {
  const formattedAmount = formatAmount(amountCents, currency);
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Payment received</title>
  </head>
  <body style="${baseStyles}background:#f8fafc;padding:32px 0;margin:0;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:640px;background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;padding:32px;">
            <tr>
              <td>
                <p style="font-size:16px;">Hi ${tutorName},</p>
                <p style="font-size:15px;color:#475569;">
                  Payment received from ${studentName}. Here are the details:
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
                    <td style="padding-top:8px;font-size:13px;text-transform:uppercase;color:#94a3b8;">Amount</td>
                    <td style="padding-top:8px;text-align:right;color:#0f172a;">${formattedAmount}</td>
                  </tr>
                  <tr>
                    <td style="padding-top:8px;font-size:13px;text-transform:uppercase;color:#94a3b8;">Method</td>
                    <td style="padding-top:8px;text-align:right;color:#0f172a;">${paymentMethod}</td>
                  </tr>
                </table>
                ${
                  notes
                    ? `<p style="font-size:14px;color:#475569;">Notes: ${notes}</p>`
                    : ""
                }
                ${
                  dashboardUrl
                    ? `<p style="text-align:center;margin:24px 0;">
                    <a href="${dashboardUrl}" style="display:inline-block;padding:12px 28px;border-radius:9999px;background:#1E3A8A;color:#ffffff;font-weight:600;text-decoration:none;">
                      View booking
                    </a>
                  </p>`
                    : ""
                }
                <p style="font-size:14px;color:#94a3b8;">
                  This booking is confirmed and ready.
                </p>
                <p style="margin-top:32px;font-weight:600;">-- TutorLingua</p>
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

export function TutorPaymentReceivedEmailText({
  tutorName,
  studentName,
  serviceName,
  scheduledAt,
  timezone,
  amountCents,
  currency,
  paymentMethod,
  notes,
  dashboardUrl,
}: TutorPaymentReceivedEmailProps) {
  const formattedAmount = formatAmount(amountCents, currency);
  return `Hi ${tutorName},

Payment received from ${studentName}.

Service: ${serviceName}
Scheduled: ${scheduledAt} (${timezone})
Amount: ${formattedAmount}
Method: ${paymentMethod}
${notes ? `Notes: ${notes}\n` : ""}${dashboardUrl ? `Dashboard: ${dashboardUrl}\n` : ""}
-- TutorLingua`;
}

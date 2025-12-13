type RefundReceiptEmailProps = {
  studentName: string;
  tutorName: string;
  amountCents: number;
  currency: string;
  serviceName?: string | null;
  scheduledAt?: string | null;
  refundId?: string | null;
  reason?: string | null;
};

function formatAmount(cents: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(cents / 100);
  } catch {
    return `${currency.toUpperCase()} ${(cents / 100).toFixed(2)}`;
  }
}

export function RefundReceiptEmail(props: RefundReceiptEmailProps) {
  const { studentName, tutorName, amountCents, currency, serviceName, scheduledAt, refundId, reason } =
    props;

  const serviceLine = serviceName ? `<p style="margin:0 0 6px 0;"><strong>Service:</strong> ${serviceName}</p>` : "";
  const timeLine = scheduledAt
    ? `<p style="margin:0 0 6px 0;"><strong>Original date:</strong> ${new Date(scheduledAt).toLocaleString()}</p>`
    : "";
  const reasonLine = reason ? `<p style="margin:0 0 10px 0; color:#16A34A;">${reason}</p>` : "";
  const refundLine = refundId ? `<p style="margin:0 0 6px 0; color:#6B7280;">Refund ID: ${refundId}</p>` : "";

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Your refund is on the way</title>
  </head>
  <body style="margin:0; padding:0; background:#F3F4F6; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#F3F4F6; padding:32px 16px;">
      <tr>
        <td align="center">
          <table width="640" cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 8px 20px rgba(0,0,0,0.05);">
            <tr>
              <td style="padding:28px 28px 12px 28px; background:linear-gradient(135deg,#059669 0%,#047857 100%); color:#fff;">
                <h1 style="margin:0; font-size:22px; font-weight:700;">Your refund is on the way</h1>
                <p style="margin:8px 0 0 0; font-size:15px; color:rgba(255,255,255,0.9);">Processed by ${tutorName}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 28px 10px 28px; color:#111827; font-size:15px; line-height:1.6;">
                <p style="margin:0 0 12px 0;">Hi ${studentName},</p>
                <p style="margin:0 0 12px 0;">We've issued a refund of <strong>${formatAmount(
                  amountCents,
                  currency
                )}</strong>.</p>
                ${serviceLine}
                ${timeLine}
                ${refundLine}
                ${reasonLine}
                <p style="margin:0 0 12px 0; color:#6B7280;">Refunds typically appear on your statement within 5-10 business days depending on your bank.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px 24px 28px; background:#F9FAFB; border-top:1px solid #E5E7EB; text-align:center; color:#9CA3AF; font-size:12px;">
                Questions? Reply to this email to reach ${tutorName}.
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

export function RefundReceiptEmailText(props: RefundReceiptEmailProps) {
  const { studentName, tutorName, amountCents, currency, serviceName, scheduledAt, refundId, reason } =
    props;

  return `Your refund is on the way

Hi ${studentName},

We've issued a refund of ${formatAmount(amountCents, currency)}${serviceName ? ` for "${serviceName}"` : ""}.
${scheduledAt ? `Original date: ${new Date(scheduledAt).toLocaleString()}\n` : ""}${refundId ? `Refund ID: ${refundId}\n` : ""}${reason ? `Reason: ${reason}\n` : ""}Refunds typically appear within 5-10 business days depending on your bank.
You can reply to reach ${tutorName}.`;
}

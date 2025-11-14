interface DigestLesson {
  student: string;
  service: string;
  timeLabel: string;
}

interface DigestInvoice {
  label: string;
  amount: string;
  dueDate: string;
  invoiceUrl?: string;
}

interface DigestLead {
  name: string;
  channel: string;
  lastAction: string;
}

interface DailyDigestEmailProps {
  tutorName: string;
  dateLabel: string;
  timezone: string;
  lessons: DigestLesson[];
  invoices: DigestInvoice[];
  leads: DigestLead[];
  dashboardUrl?: string;
}

const baseStyles =
  "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;line-height:1.6;color:#0f172a;";

export function DailyDigestEmail({
  tutorName,
  dateLabel,
  timezone,
  lessons,
  invoices,
  leads,
  dashboardUrl,
}: DailyDigestEmailProps) {
  const section = (title: string, body: string) => `
    <div style="margin-bottom:24px;border-radius:16px;background:#f8fafc;border:1px solid #e2e8f0;padding:20px;">
      <p style="margin:0 0 12px 0;font-size:13px;text-transform:uppercase;color:#94a3b8;">${title}</p>
      ${body}
    </div>
  `;

  const lessonsBody =
    lessons.length > 0
      ? `<ul style="margin:0;padding-left:18px;">
        ${lessons
          .map(
            (lesson) =>
              `<li><strong>${lesson.student}</strong> — ${lesson.service} · ${lesson.timeLabel}</li>`
          )
          .join("")}
      </ul>`
      : `<p style="margin:0;color:#94a3b8;">No lessons booked today.</p>`;

  const invoiceBody =
    invoices.length > 0
      ? `<ul style="margin:0;padding-left:18px;">
        ${invoices
          .map(
            (invoice) =>
              `<li>${invoice.label} · ${invoice.amount} due ${invoice.dueDate}${
                invoice.invoiceUrl ? ` — <a href="${invoice.invoiceUrl}" style="color:#2563eb;">View</a>` : ""
              }</li>`
          )
          .join("")}
      </ul>`
      : `<p style="margin:0;color:#94a3b8;">No unpaid invoices.</p>`;

  const leadBody =
    leads.length > 0
      ? `<ul style="margin:0;padding-left:18px;">
        ${leads
          .map(
            (lead) =>
              `<li>${lead.name} (${lead.channel}) · ${lead.lastAction}</li>`
          )
          .join("")}
      </ul>`
      : `<p style="margin:0;color:#94a3b8;">No new leads to review.</p>`;

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${dateLabel} digest</title>
  </head>
  <body style="${baseStyles}background:#f8fafc;padding:32px 0;margin:0;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:640px;background:#ffffff;border-radius:18px;border:1px solid #e2e8f0;padding:32px;">
            <tr>
              <td>
                <p style="font-size:16px;">Morning, ${tutorName} 👋</p>
                <p style="font-size:14px;color:#94a3b8;margin-bottom:24px;">${dateLabel} · ${timezone}</p>
                ${section("Today's lessons", lessonsBody)}
                ${section("Unpaid invoices", invoiceBody)}
                ${section("Leads needing love", leadBody)}
                ${
                  dashboardUrl
                    ? `<p style="text-align:center;margin-top:24px;">
                    <a href="${dashboardUrl}" style="display:inline-block;padding:12px 28px;border-radius:9999px;background:#8B6B47;color:#ffffff;font-weight:600;text-decoration:none;">
                      Open dashboard
                    </a>
                  </p>`
                    : ""
                }
                <p style="font-size:13px;color:#94a3b8;margin-top:24px;">Stay consistent. You’ve got this!</p>
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

export function DailyDigestEmailText({
  tutorName,
  dateLabel,
  timezone,
  lessons,
  invoices,
  leads,
  dashboardUrl,
}: DailyDigestEmailProps) {
  return `Morning ${tutorName}!
${dateLabel} (${timezone})

Lessons:
${lessons.length ? lessons.map((l) => `• ${l.student} — ${l.service} · ${l.timeLabel}`).join("\n") : "• None"}

Invoices:
${invoices.length ? invoices.map((i) => `• ${i.label} · ${i.amount} due ${i.dueDate}`).join("\n") : "• None"}

Leads:
${leads.length ? leads.map((lead) => `• ${lead.name} (${lead.channel}) — ${lead.lastAction}`).join("\n") : "• None"}
${
    dashboardUrl ? `\nDashboard: ${dashboardUrl}\n` : ""
  }Keep going!`.trim();
}

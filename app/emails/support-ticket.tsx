type SupportTicketEmailProps = {
  audience: "user" | "support";
  ticketId: string;
  subject: string;
  message: string;
  category?: string | null;
  submittedByName?: string | null;
  submittedByEmail?: string | null;
  viewUrl?: string | null;
};

export function SupportTicketEmail(props: SupportTicketEmailProps) {
  const { audience, ticketId, subject, message, category, submittedByName, submittedByEmail, viewUrl } =
    props;

  const heading = audience === "user" ? "We received your support request" : "New support ticket";
  const subheading =
    audience === "user"
      ? "We'll reply as soon as possible."
      : `Ticket ${ticketId} from ${submittedByName || "Unknown user"}`;

  const action = viewUrl
    ? `<a href="${viewUrl}" style="display:inline-block; background:#4338CA; color:#fff; font-weight:600; text-decoration:none; padding:12px 18px; border-radius:10px;">View ticket</a>`
    : "";

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${heading}</title>
  </head>
  <body style="margin:0; padding:0; background:#F3F4F6; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#F3F4F6; padding:32px 16px;">
      <tr>
        <td align="center">
          <table width="640" cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 8px 20px rgba(0,0,0,0.05);">
            <tr>
              <td style="padding:28px 28px 12px 28px; background:linear-gradient(135deg,#4338CA 0%,#312E81 100%); color:#fff;">
                <h1 style="margin:0; font-size:22px; font-weight:700;">${heading}</h1>
                <p style="margin:8px 0 0 0; font-size:15px; color:rgba(255,255,255,0.9);">${subheading}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 28px 16px 28px; color:#111827; font-size:15px; line-height:1.6;">
                <p style="margin:0 0 10px 0;"><strong>Subject:</strong> ${subject}</p>
                ${category ? `<p style="margin:0 0 10px 0; color:#6B7280;">Category: ${category}</p>` : ""}
                ${
                  submittedByEmail
                    ? `<p style="margin:0 0 10px 0; color:#6B7280;">From: ${submittedByName || "User"} (${submittedByEmail})</p>`
                    : ""
                }
                <div style="margin:12px 0 0 0; padding:12px; background:#F9FAFB; border:1px solid #E5E7EB; border-radius:10px; color:#374151; white-space:pre-wrap;">${message}</div>
                ${action}
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px 24px 28px; background:#F9FAFB; border-top:1px solid #E5E7EB; text-align:center; color:#9CA3AF; font-size:12px;">
                Ticket ID: ${ticketId}
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

export function SupportTicketEmailText(props: SupportTicketEmailProps) {
  const { audience, ticketId, subject, message, category, submittedByName, submittedByEmail, viewUrl } =
    props;

  const heading = audience === "user" ? "We received your support request" : "New support ticket";

  return `${heading}

Ticket: ${ticketId}
Subject: ${subject}
${category ? `Category: ${category}\n` : ""}${submittedByEmail ? `From: ${submittedByName || "User"} (${submittedByEmail})\n` : ""}\n${message}\n${viewUrl ? `View: ${viewUrl}\n` : ""}`;
}

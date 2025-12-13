type DigestItem = {
  otherPartyName: string;
  preview: string;
  lastMessageAt: string;
  threadUrl?: string | null;
};

type UnreadMessagesDigestEmailProps = {
  recipientName: string;
  role: "tutor" | "student";
  totalUnread: number;
  items: DigestItem[];
  dashboardUrl?: string | null;
};

function formatTime(value: string) {
  try {
    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function UnreadMessagesDigestEmail(props: UnreadMessagesDigestEmailProps) {
  const { recipientName, role, totalUnread, items, dashboardUrl } = props;

  const listItems = items
    .map(
      (item) => `
        <tr>
          <td style="padding:14px 0; border-bottom:1px solid #E5E7EB;">
            <p style="margin:0; font-weight:600; color:#111827;">${item.otherPartyName}</p>
            <p style="margin:4px 0; color:#4B5563; font-size:14px;">${item.preview || "New message"}</p>
            <p style="margin:0; color:#9CA3AF; font-size:12px;">${formatTime(item.lastMessageAt)}</p>
            ${
              item.threadUrl
                ? `<p style="margin:8px 0 0 0;"><a href="${item.threadUrl}" style="color:#4338CA; text-decoration:none; font-weight:600;">Open conversation</a></p>`
                : ""
            }
          </td>
        </tr>`
    )
    .join("");

  const action =
    dashboardUrl && dashboardUrl.length > 0
      ? `<a href="${dashboardUrl}" style="display:inline-block; margin-top:16px; background:#4338CA; color:#fff; font-weight:600; text-decoration:none; padding:12px 20px; border-radius:10px;">View all messages</a>`
      : "";

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>You have unread messages</title>
  </head>
  <body style="margin:0; padding:0; background:#F3F4F6; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#F3F4F6; padding:32px 16px;">
      <tr>
        <td align="center">
          <table width="640" cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 8px 20px rgba(0,0,0,0.05);">
            <tr>
              <td style="padding:28px 28px 12px 28px; background:linear-gradient(135deg,#0EA5E9 0%,#0369A1 100%); color:#fff;">
                <h1 style="margin:0; font-size:22px; font-weight:700;">You have ${totalUnread} unread message${totalUnread === 1 ? "" : "s"}</h1>
                <p style="margin:8px 0 0 0; font-size:15px; color:rgba(255,255,255,0.9);">${
                  role === "tutor" ? "Students are waiting for a reply." : "Your tutor replied."
                }</p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 28px 16px 28px; color:#111827; font-size:15px; line-height:1.6;">
                <p style="margin:0 0 12px 0;">Hi ${recipientName},</p>
                <p style="margin:0 0 12px 0;">Here are the most recent unread conversations:</p>
                <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                  ${listItems}
                </table>
                ${action}
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px 24px 28px; background:#F9FAFB; border-top:1px solid #E5E7EB; text-align:center; color:#9CA3AF; font-size:12px;">
                Replies help keep students engaged and bookings consistent.
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

export function UnreadMessagesDigestEmailText(props: UnreadMessagesDigestEmailProps) {
  const { recipientName, role, totalUnread, items, dashboardUrl } = props;

  const lines = items
    .map(
      (item) =>
        `${item.otherPartyName} — ${item.preview || "New message"} (${formatTime(
          item.lastMessageAt
        )})${item.threadUrl ? ` | ${item.threadUrl}` : ""}`
    )
    .join("\n");

  return `You have ${totalUnread} unread message${totalUnread === 1 ? "" : "s"}

Hi ${recipientName},
${role === "tutor" ? "Students are waiting for a reply." : "Your tutor replied."}

${lines}${dashboardUrl ? `\n\nView all: ${dashboardUrl}` : ""}`;
}

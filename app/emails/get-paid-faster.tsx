type Props = {
  tutorName?: string;
  connectUrl?: string;
  tips?: string[];
};

export function GetPaidFasterEmail({ tutorName, connectUrl, tips }: Props) {
  const name = tutorName ?? "Tutor";
  const list = tips && tips.length > 0 ? tips : [
    "Connect your Stripe account from Settings → Payments",
    "Ask students to book from your TutorLingua site so payment is collected up-front",
    "Add session packages for fewer failed payments",
    "Turn on email reminders to reduce no-shows",
  ];
  return `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111">
      <h2>Hey ${name}, here’s how to get paid faster</h2>
      <p>You can accept card payments directly with your own Stripe account and confirm bookings only after payment.</p>
      ${connectUrl ? `<p><a href="${connectUrl}" style="background:#000;color:#fff;padding:10px 14px;border-radius:6px;text-decoration:none;display:inline-block">Connect Stripe</a></p>` : ""}
      <h3 style="margin-top:24px">Quick wins</h3>
      <ul>
        ${list.map(t => `<li>${t}</li>`).join("")}
      </ul>
      <p>Questions? Reply to this email and we’ll help you get set up.</p>
      <p>— TutorLingua Team</p>
    </div>
  `;
}

export function GetPaidFasterEmailText({ tutorName, connectUrl, tips }: Props) {
  const name = tutorName ?? "Tutor";
  const list = tips && tips.length > 0 ? tips : [
    "Connect your Stripe account from Settings → Payments",
    "Ask students to book from your TutorLingua site so payment is collected up-front",
    "Add session packages for fewer failed payments",
    "Turn on email reminders to reduce no-shows",
  ];
  const connectLine = connectUrl ? `Connect Stripe: ${connectUrl}\n` : "";
  return [
    `Hey ${name}, here’s how to get paid faster`,
    "",
    "You can accept card payments directly with your own Stripe account and confirm bookings only after payment.",
    "",
    connectLine,
    "Quick wins:",
    ...list.map(t => `- ${t}`),
    "",
    "Questions? Reply to this email and we’ll help you get set up.",
    "",
    "— TutorLingua Team",
  ].join("\n");
}



const resendApiKey = process.env.RESEND_API_KEY;
const isProduction = process.env.NODE_ENV === "production";

type EmailPayload = {
  from: string;
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string | string[];
};

type EmailResult = {
  data?: Record<string, unknown> | null;
  error?: Error;
};

class ResendClient {
  constructor(private apiKey: string) {}

  emails = {
    send: async (payload: EmailPayload): Promise<EmailResult> => {
      if (!this.apiKey) {
        return { error: new Error("Resend API key not configured") };
      }

      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: payload.from,
            to: Array.isArray(payload.to) ? payload.to : [payload.to],
            subject: payload.subject,
            html: payload.html,
            text: payload.text,
            cc: payload.cc,
            bcc: payload.bcc,
            reply_to: payload.replyTo,
          }),
        });

        const body = await response.json().catch(() => null);

        if (!response.ok) {
          const message =
            (body && (body.message || body.error)) ||
            `Resend API request failed with status ${response.status}`;
          return { error: new Error(message) };
        }

        return {
          data: body,
        };
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unexpected error while sending email with Resend.";
        return { error: new Error(message) };
      }
    },
  };
}

class NoopResendClient {
  emails = {
    send: async (payload: EmailPayload): Promise<EmailResult> => {
      console.warn("[Resend] Email send skipped (no API key configured)", {
        to: payload.to,
        subject: payload.subject,
      });
      return { data: { skipped: true } };
    },
  };
}

export const resend = resendApiKey ? new ResendClient(resendApiKey) : new NoopResendClient();

if (!resendApiKey && isProduction) {
  throw new Error("RESEND_API_KEY is not set");
}
if (!resendApiKey && !isProduction) {
  console.warn("[Resend] RESEND_API_KEY is not set. Emails will be skipped in development.");
}

const emailFrom = process.env.EMAIL_FROM;
const emailReplyTo = process.env.EMAIL_REPLY_TO;

const resolvedEmailFrom =
  emailFrom ||
  (!isProduction ? "TutorLingua Dev <dev@localhost>" : null);

if (!resolvedEmailFrom) {
  throw new Error("EMAIL_FROM is not set");
}

/**
 * Email configuration
 */
export const EMAIL_CONFIG = {
  from: resolvedEmailFrom,
  replyTo: emailReplyTo || resolvedEmailFrom,
} as const;

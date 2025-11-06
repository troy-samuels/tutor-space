import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
  throw new Error("RESEND_API_KEY is not set");
}

export const resend = new Resend(resendApiKey);

const emailFrom = process.env.EMAIL_FROM;
const emailReplyTo = process.env.EMAIL_REPLY_TO;

if (!emailFrom) {
  throw new Error("EMAIL_FROM is not set");
}

/**
 * Email configuration
 */
export const EMAIL_CONFIG = {
  from: emailFrom,
  replyTo: emailReplyTo || emailFrom,
} as const;

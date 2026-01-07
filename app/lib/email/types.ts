type Tag = { name: string; value: string };

export type SendEmailParams = {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  cc?: string | string[];
  bcc?: string | string[];
  from?: string;
  replyTo?: string | string[];
  tags?: Tag[];
  category?: string;
  idempotencyKey?: string;
  allowSuppressed?: boolean;
  metadata?: Record<string, unknown>;
};

export type SendEmailResult =
  | { success: true; suppressed: string[]; data?: Record<string, unknown> | null }
  | { success: false; suppressed: string[]; error?: string; skipped?: boolean };

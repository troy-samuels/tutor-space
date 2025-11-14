"use server";

import { resend, EMAIL_CONFIG } from "@/lib/resend";
import {
  DigitalProductDeliveryEmail,
  DigitalProductDeliveryEmailText,
} from "@/emails/digital-product-delivery";

export async function sendDigitalProductDeliveryEmail(params: {
  to: string;
  studentName?: string | null;
  tutorName: string;
  productTitle: string;
  downloadUrl: string;
}) {
  const html = DigitalProductDeliveryEmail({
    studentName: params.studentName,
    tutorName: params.tutorName,
    productTitle: params.productTitle,
    downloadUrl: params.downloadUrl,
  });

  const text = DigitalProductDeliveryEmailText({
    studentName: params.studentName,
    tutorName: params.tutorName,
    productTitle: params.productTitle,
    downloadUrl: params.downloadUrl,
  });

  await resend.emails.send({
    from: EMAIL_CONFIG.from,
    to: params.to,
    subject: `${params.productTitle} download`,
    html,
    text,
  });
}

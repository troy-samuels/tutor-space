"use client";

import { useState } from "react";

export function IssueRefundButton(props: {
  refundRequestId: string;
  tutorId: string;
  studentId?: string | null;
  bookingId?: string | null;
  amountCents: number;
  currency: string;
  paymentIntentId?: string | null;
  adminUserId: string;
}) {
  const [busy, setBusy] = useState(false);

  async function submit() {
    try {
      setBusy(true);
      const res = await fetch("/api/refunds/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          refundRequestId: props.refundRequestId,
          tutorId: props.tutorId,
          studentId: props.studentId ?? null,
          bookingId: props.bookingId ?? null,
          paymentsAuditId: null,
          paymentIntentId: props.paymentIntentId,
          amountCents: props.amountCents,
          currency: props.currency,
          adminUserId: props.adminUserId,
        }),
      });
      if (!res.ok) throw new Error("Failed to issue refund");
      alert("Refund issued.");
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      disabled={busy || !props.paymentIntentId}
      onClick={submit}
      className="inline-flex h-8 items-center rounded-md bg-black px-3 text-xs font-medium text-white hover:bg-black/90 disabled:opacity-60"
      title={!props.paymentIntentId ? "Missing payment intent id" : "Issue refund"}
    >
      {busy ? "Processing..." : "Issue refund"}
    </button>
  );
}



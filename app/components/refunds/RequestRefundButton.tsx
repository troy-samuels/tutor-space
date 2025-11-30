"use client";

import { useState } from "react";

export function RequestRefundButton(props: {
  tutorId: string;
  bookingId: string;
  amountCents: number;
  currency: string;
  actor: "student" | "tutor";
}) {
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState("");
  const [open, setOpen] = useState(false);

  async function submit() {
    try {
      setBusy(true);
      const res = await fetch("/api/refunds/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tutorId: props.tutorId,
          bookingId: props.bookingId,
          paymentsAuditId: null,
          amountCents: props.amountCents,
          currency: props.currency,
          reason: reason || null,
          actorRequested: props.actor,
        }),
      });
      if (res.status === 401) {
        alert("Please sign in to request a refund.");
        return;
      }
      if (!res.ok) throw new Error("Failed to request refund");
      setOpen(false);
      setReason("");
      alert("Refund request sent.");
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium hover:bg-muted"
      >
        Request refund
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm">
        <span className="block text-muted-foreground mb-1">Reason</span>
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Optional reason for refund"
          className="w-full rounded-md border px-3 py-2"
        />
      </label>
      <div className="flex items-center gap-2">
        <button
          onClick={submit}
          disabled={busy}
          className="inline-flex h-9 items-center rounded-md bg-black px-3 text-sm font-medium text-white hover:bg-black/90 disabled:opacity-60"
        >
          {busy ? "Submitting..." : "Submit request"}
        </button>
        <button
          onClick={() => setOpen(false)}
          className="inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium hover:bg-muted"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}



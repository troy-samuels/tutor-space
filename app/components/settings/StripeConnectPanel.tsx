"use client";

import { useState } from "react";

type Props = {
  tutorId: string;
  accountId: string | null;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  onboardingStatus: "pending" | "completed" | "restricted";
};

export default function StripeConnectPanel(props: Props) {
  const [busy, setBusy] = useState(false);
  const [status] = useState<Pick<Props, "accountId" | "chargesEnabled" | "payoutsEnabled" | "onboardingStatus">>({
    accountId: props.accountId,
    chargesEnabled: props.chargesEnabled,
    payoutsEnabled: props.payoutsEnabled,
    onboardingStatus: props.onboardingStatus,
  });

  async function connectStripe() {
    try {
      setBusy(true);
      const res = await fetch("/api/stripe/connect/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tutorId: props.tutorId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create account");
      await openOnboarding(data.accountId);
    } catch (e) {
      console.error(e);
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function openOnboarding(accId?: string) {
    try {
      setBusy(true);
      const accountId = accId ?? status.accountId;
      const res = await fetch("/api/stripe/connect/account-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create onboarding link");
      window.location.href = data.url as string;
    } catch (e) {
      console.error(e);
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function openDashboard() {
    try {
      setBusy(true);
      const res = await fetch("/api/stripe/connect/login-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId: status.accountId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create dashboard link");
      window.location.href = data.url as string;
    } catch (e) {
      console.error(e);
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function refreshStatus() {
    try {
      setBusy(true);
      const res = await fetch("/api/stripe/connect/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tutorId: props.tutorId, accountId: status.accountId }),
      });
      if (!res.ok) throw new Error("Failed to refresh status");
      alert("Stripe status refreshed. Reload the page to see updates.");
    } catch (e) {
      console.error(e);
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const connected = Boolean(status.accountId);
  const ready = connected && status.chargesEnabled && status.payoutsEnabled && status.onboardingStatus === "completed";

  return (
    <div className="rounded-lg border p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Stripe Connect</h3>
        <div className="flex gap-2">
          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${ready ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-700"}`}>
            {ready ? "Ready" : connected ? "Pending" : "Not connected"}
          </span>
          {connected && (
            <>
              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${status.chargesEnabled ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-700"}`}>
                Charges {status.chargesEnabled ? "enabled" : "pending"}
              </span>
              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${status.payoutsEnabled ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-700"}`}>
                Payouts {status.payoutsEnabled ? "enabled" : "pending"}
              </span>
            </>
          )}
        </div>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Connect your Stripe account to accept card payments. You can still add a Stripe Payment Link as a fallback.
      </p>
      <div className="flex flex-wrap gap-2">
        {!connected && (
          <button className="inline-flex h-9 items-center rounded-md bg-black px-3 text-white hover:bg-black/90" onClick={connectStripe} disabled={busy}>
            Connect Stripe
          </button>
        )}
        {connected && !ready && (
          <button className="inline-flex h-9 items-center rounded-md border px-3 hover:bg-muted" onClick={() => openOnboarding()} disabled={busy}>
            Continue onboarding
          </button>
        )}
        {connected && (
          <button className="inline-flex h-9 items-center rounded-md border px-3 hover:bg-muted" onClick={openDashboard} disabled={busy}>
            Open Stripe Dashboard
          </button>
        )}
        {connected && (
          <button className="inline-flex h-9 items-center rounded-md border px-3 hover:bg-muted" onClick={refreshStatus} disabled={busy}>
            Refresh status
          </button>
        )}
      </div>
    </div>
  );
}

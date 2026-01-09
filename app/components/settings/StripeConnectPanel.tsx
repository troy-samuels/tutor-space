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

  // Single status label for cleaner UI
  const statusLabel = ready
    ? "Connected"
    : connected
    ? "Setup incomplete"
    : "Not connected";

  return (
    <div className="py-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-medium">Stripe Connect</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Accept card payments directly
          </p>
        </div>
        <span
          className={`text-xs font-medium ${
            ready ? "text-emerald-600" : "text-muted-foreground"
          }`}
        >
          {statusLabel}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {!connected && (
          <button
            className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm text-white hover:bg-primary/90 disabled:opacity-50"
            onClick={connectStripe}
            disabled={busy}
          >
            Connect Stripe
          </button>
        )}
        {connected && !ready && (
          <button
            className="inline-flex h-9 items-center rounded-md border border-stone-200 px-4 text-sm hover:bg-muted disabled:opacity-50"
            onClick={() => openOnboarding()}
            disabled={busy}
          >
            Continue setup
          </button>
        )}
        {connected && (
          <button
            className="inline-flex h-9 items-center rounded-md border border-stone-200 px-4 text-sm hover:bg-muted disabled:opacity-50"
            onClick={openDashboard}
            disabled={busy}
          >
            Dashboard
          </button>
        )}
        {connected && !ready && (
          <button
            className="inline-flex h-9 items-center rounded-md border border-stone-200 px-4 text-sm hover:bg-muted disabled:opacity-50"
            onClick={refreshStatus}
            disabled={busy}
          >
            Refresh
          </button>
        )}
      </div>
    </div>
  );
}

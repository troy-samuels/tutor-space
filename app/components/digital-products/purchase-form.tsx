"use client";

import { useState } from "react";
import { Loader2, ShoppingCart } from "lucide-react";

export function ProductPurchaseForm({
  productId,
  tutorUsername,
}: {
  productId: string;
  tutorUsername: string;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCheckout = async () => {
    setError(null);
    setIsPending(true);
    try {
      const response = await fetch("/api/digital-products/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          buyerEmail: email,
          buyerName: name,
          tutorUsername,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.url) {
        throw new Error(data.error || "Unable to start checkout");
      }

      window.location.href = data.url;
    } catch (err) {
      setError((err as Error).message);
      setIsPending(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="rounded-xl border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <input
          type="email"
          placeholder="Email for delivery"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="rounded-xl border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          required
        />
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <button
        type="button"
        onClick={startCheckout}
        disabled={isPending || !email}
        className="inline-flex h-11 min-w-[180px] items-center justify-center gap-2 rounded-xl bg-brand-brown px-4 text-sm font-semibold text-white shadow transition hover:bg-brand-brown/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
        {isPending ? "Redirecting..." : "Buy now"}
      </button>
    </div>
  );
}

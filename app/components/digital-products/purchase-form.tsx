"use client";

import { useState, useTransition } from "react";
import { Loader2, ShoppingCart } from "lucide-react";
import { buyDigitalProduct } from "@/lib/actions/digital-product-checkout";

export function ProductPurchaseForm({
  productId,
  buttonLabel = "Buy now",
  fullWidth = false,
  tutorUsername, // optional passthrough for future tracking/use
}: {
  productId: string;
  buttonLabel?: string;
  fullWidth?: boolean;
  tutorUsername?: string;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const startCheckout = async () => {
    setError(null);
    startTransition(async () => {
      const result = await buyDigitalProduct(productId);
      if (result.error || !result.url) {
        setError(result.error || "Unable to start checkout");
        return;
      }
      window.location.href = result.url;
    });
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
        className={`inline-flex h-11 min-w-[180px] items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 ${fullWidth ? "w-full" : ""}`}
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
        {isPending ? "Securing connection..." : buttonLabel}
      </button>
    </div>
  );
}

"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { type ToolLang } from "@/lib/tools/types";

interface EmailGateProps {
  previewContent?: React.ReactNode;
  benefit?: string;
  ctaLabel?: string;
  lang?: ToolLang;
  tool?: string;
  onSubmit: (email: string) => void;
}

const BENEFIT_BY_LANG: Record<ToolLang, string> = {
  en: "Get daily English challenges sent to your inbox — free",
  es: "Recibe ejercicios de español cada día — gratis",
  fr: "Recevez des exercices de français chaque jour — gratuit",
  de: "Täglich Deutsch-Übungen per E-Mail — kostenlos",
};

export function EmailGate({
  previewContent,
  benefit,
  ctaLabel = "Unlock My Result →",
  lang = "en",
  tool,
  onSubmit,
}: EmailGateProps) {
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const displayBenefit = benefit ?? BENEFIT_BY_LANG[lang];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      await fetch("/api/tools/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, lang, tool }),
      });
    } catch {
      // Graceful degradation — still unlock results
    }

    setLoading(false);
    onSubmit(email);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-5"
    >
      {/* Blurred preview */}
      {previewContent && (
        <div className="relative rounded-2xl border border-black/8 bg-white p-5 shadow-soft overflow-hidden">
          <div className="blur-sm pointer-events-none select-none">
            {previewContent}
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="rounded-xl px-4 py-2 text-xs font-bold text-white"
              style={{ background: "var(--primary)" }}
            >
              🔒 Unlock your result
            </div>
          </div>
        </div>
      )}

      {/* Gate card */}
      <div className="bg-white rounded-2xl border border-black/8 p-6 shadow-soft">
        <div className="flex flex-col gap-4">
          <div className="text-center">
            <div className="text-3xl mb-2">📬</div>
            <h3 className="text-lg font-bold text-foreground mb-1">
              Unlock your result
            </h3>
            <p className="text-sm text-foreground/60 leading-relaxed">
              {displayBenefit}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-black/12 bg-gray-50 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <Button
              type="submit"
              size="lg"
              className="w-full rounded-xl min-h-[48px]"
              disabled={loading}
            >
              {loading ? "Sending…" : ctaLabel}
            </Button>
          </form>

          <p className="text-xs text-center text-foreground/40 leading-relaxed">
            No spam. Unsubscribe anytime. Free forever.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

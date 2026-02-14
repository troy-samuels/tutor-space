"use client";

import { useState } from "react";
import { Mail, MessageCircle, Copy, Check } from "lucide-react";

type ReferralShareCardProps = {
  referralLink: string;
};

/**
 * Renders share actions for tutor referral links.
 */
export function ReferralShareCard({ referralLink }: ReferralShareCardProps) {
  const [copied, setCopied] = useState(false);

  /**
   * Copies the referral link to clipboard.
   */
  async function handleCopy() {
    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      return;
    }

    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const whatsappLink = `https://wa.me/?text=${encodeURIComponent(
    `Join TutorLingua with my referral link: ${referralLink}`
  )}`;
  const emailLink = `mailto:?subject=${encodeURIComponent(
    "Join TutorLingua"
  )}&body=${encodeURIComponent(`Join TutorLingua with my referral link:\n\n${referralLink}`)}`;

  return (
    <div className="rounded-2xl border border-white/[0.1] bg-white/[0.05] p-4 backdrop-blur-xl">
      <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Share</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-primary/55 bg-primary/18 px-4 text-xs font-semibold text-foreground"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy link"}
        </button>
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.05] px-4 text-xs text-foreground"
        >
          <MessageCircle className="h-3.5 w-3.5 text-primary" />
          WhatsApp
        </a>
        <a
          href={emailLink}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.05] px-4 text-xs text-foreground"
        >
          <Mail className="h-3.5 w-3.5 text-primary" />
          Email
        </a>
      </div>
    </div>
  );
}

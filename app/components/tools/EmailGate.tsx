"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { type ToolLang } from "@/lib/tools/types";

type EmailTool = "level-test" | "daily-challenge" | "vocab";

interface EmailGateProps {
  previewContent?: React.ReactNode;
  benefit?: string;
  ctaLabel?: string;
  lang?: ToolLang;
  tool?: EmailTool;
  onSubmit: (email: string) => void;
}

const BENEFIT_BY_LANG: Record<ToolLang, string> = {
  en: "Get high-impact language drills in your inbox, free",
  es: "Recibe ejercicios de idiomas de alto impacto en tu correo, gratis",
  fr: "Recevez des entraînements linguistiques efficaces dans votre boîte mail, gratuitement",
  de: "Erhalte wirksame Sprachübungen kostenlos per E-Mail",
};

const TOOL_COPY: Record<
  EmailTool,
  {
    heading: string;
    cta: string;
    benefit: Record<ToolLang, string>;
  }
> = {
  "level-test": {
    heading: "Get your CEFR result",
    cta: "See My Level",
    benefit: {
      en: "Save your CEFR result and get a weekly plan to move up one level.",
      es: "Guarda tu resultado MCER y recibe un plan semanal para subir de nivel.",
      fr: "Enregistrez votre niveau CECRL et recevez un plan hebdomadaire pour progresser.",
      de: "Speichere dein GER-Ergebnis und erhalte einen Wochenplan für das nächste Level.",
    },
  },
  "daily-challenge": {
    heading: "Keep your streak alive",
    cta: "See My Score",
    benefit: {
      en: "Get tomorrow's challenge and quick correction notes before everyone else.",
      es: "Recibe el reto de mañana y notas de corrección rápida antes que nadie.",
      fr: "Recevez le défi de demain et des corrections rapides avant tout le monde.",
      de: "Erhalte die Challenge für morgen und schnelle Korrekturhinweise vor allen anderen.",
    },
  },
  vocab: {
    heading: "Lock in today's word",
    cta: "Unlock Word Recap",
    benefit: {
      en: "Get a daily advanced word with collocations you can use in real conversations.",
      es: "Recibe una palabra avanzada diaria con colocaciones para conversaciones reales.",
      fr: "Recevez chaque jour un mot avancé avec des collocations utiles à l'oral.",
      de: "Erhalte täglich ein fortgeschrittenes Wort mit Kollokationen für echte Gespräche.",
    },
  },
};

type SubscribeApiResponse = {
  success?: boolean;
  message?: string;
  error?: string;
};

export function EmailGate({
  previewContent,
  benefit,
  ctaLabel,
  lang = "en",
  tool,
  onSubmit,
}: EmailGateProps) {
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const toolCopy = tool ? TOOL_COPY[tool] : null;
  const displayBenefit = benefit ?? toolCopy?.benefit[lang] ?? BENEFIT_BY_LANG[lang];
  const displayCta = ctaLabel ?? toolCopy?.cta ?? "Unlock My Result";
  const displayHeading = toolCopy?.heading ?? "Unlock your result";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/tools/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, lang, tool }),
      });

      const payload = (await response.json().catch(() => null)) as SubscribeApiResponse | null;
      if (!response.ok || payload?.success === false) {
        const message =
          payload?.message || payload?.error || "Unable to save your email right now. Please try again.";
        setError(message);
        return;
      }
    } catch {
      setError("Unable to save your email right now. Please try again.");
      return;
    } finally {
      setLoading(false);
    }

    onSubmit(normalizedEmail);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-5"
    >
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

      <div className="bg-white rounded-2xl border border-black/8 p-6 shadow-soft">
        <div className="flex flex-col gap-4">
          <div className="text-center">
            <div className="text-3xl mb-2">📬</div>
            <h3 className="text-lg font-bold text-foreground mb-1">
              {displayHeading}
            </h3>
            <p className="text-sm text-foreground/60 leading-relaxed">
              {displayBenefit}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="email"
              placeholder="name@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              inputMode="email"
              required
              className="w-full px-4 py-3 rounded-xl border border-black/12 bg-gray-50 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
            />
            {error && (
              <p className="text-xs text-red-500" role="alert" aria-live="polite">
                {error}
              </p>
            )}
            <Button
              type="submit"
              size="lg"
              className="w-full rounded-xl min-h-[48px]"
              disabled={loading}
            >
              {loading ? "Saving..." : displayCta}
            </Button>
          </form>

          <p className="text-xs text-center text-foreground/40 leading-relaxed">
            No spam. One-click unsubscribe.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

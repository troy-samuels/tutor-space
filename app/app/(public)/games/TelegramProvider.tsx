"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  initTelegram,
  isTelegram,
  getSafeAreaInset,
  getContentSafeAreaInset,
  onTgEvent,
  offTgEvent,
} from "@/lib/telegram";

/** Inject/update safe area CSS custom properties on :root */
function updateSafeAreaProperties() {
  const sa = getSafeAreaInset();
  const csa = getContentSafeAreaInset();
  const root = document.documentElement;

  root.style.setProperty("--tg-safe-top", `${sa.top}px`);
  root.style.setProperty("--tg-safe-bottom", `${sa.bottom}px`);
  root.style.setProperty("--tg-safe-left", `${sa.left}px`);
  root.style.setProperty("--tg-safe-right", `${sa.right}px`);
  root.style.setProperty("--tg-content-safe-top", `${csa.top}px`);
  root.style.setProperty("--tg-content-safe-bottom", `${csa.bottom}px`);
}

/** Valid game slugs for deep linking */
const VALID_GAMES = [
  "connections",
  "word-ladder",
  "daily-decode",
  "missing-piece",
  "odd-one-out",
  "synonym-spiral",
  "neon-intercept",
];
const VALID_LANGUAGES = ["en", "es", "fr", "de"];

/** Parse Telegram startapp deep link parameter */
function parseDeepLink(startParam: string | undefined): { path: string; lang?: string } | null {
  if (!startParam) return null;

  // Format: "connections" or "connections_es" or "daily" or "challenge_123"
  const parts = startParam.toLowerCase().split("_");
  const gameSlug = parts[0]?.replace(/\s+/g, "-");

  // "daily" → go to hub (default experience)
  if (gameSlug === "daily") return null;

  // Check for language suffix: "connections_es"
  const langSuffix = parts[parts.length - 1];
  const lang = VALID_LANGUAGES.includes(langSuffix) ? langSuffix : undefined;

  // Map aliases
  const slugMap: Record<string, string> = {
    connections: "connections",
    wordladder: "word-ladder",
    "word-ladder": "word-ladder",
    decode: "daily-decode",
    "daily-decode": "daily-decode",
    "missing-piece": "missing-piece",
    missingpiece: "missing-piece",
    "odd-one-out": "odd-one-out",
    oddoneout: "odd-one-out",
    "synonym-spiral": "synonym-spiral",
    synonymspiral: "synonym-spiral",
    "neon-intercept": "neon-intercept",
    neonintercept: "neon-intercept",
    neon: "neon-intercept",
  };

  const resolvedSlug = slugMap[gameSlug];
  if (resolvedSlug && VALID_GAMES.includes(resolvedSlug)) {
    const langQuery = lang ? `?lang=${lang}` : "";
    return { path: `/games/${resolvedSlug}${langQuery}`, lang };
  }

  return null;
}

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const [inTelegram, setInTelegram] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    const boot = () => {
      if (!isTelegram()) return false;
      setInTelegram(true);
      initTelegram();
      updateSafeAreaProperties();

      // Handle deep linking from startapp parameter
      const startParam = window.Telegram?.WebApp?.initDataUnsafe?.start_param as string | undefined;
      const deepLink = parseDeepLink(startParam);
      if (deepLink) {
        // Use replace to avoid back-button going to hub first
        router.replace(deepLink.path);
      }

      return true;
    };

    // SDK script loads via beforeInteractive, so it should be available immediately
    if (!boot()) {
      // Retry once after a short delay in case SDK hasn't loaded yet
      const timer = setTimeout(() => {
        boot();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [router]);

  // Listen for safe area changes (fullscreen enter/exit, orientation, etc.)
  React.useEffect(() => {
    if (!inTelegram) return;

    const onSafeAreaChanged = () => updateSafeAreaProperties();
    const onContentSafeAreaChanged = () => updateSafeAreaProperties();
    const onFullscreenChanged = () => updateSafeAreaProperties();

    onTgEvent("safeAreaChanged", onSafeAreaChanged);
    onTgEvent("contentSafeAreaChanged", onContentSafeAreaChanged);
    onTgEvent("fullscreenChanged", onFullscreenChanged);

    return () => {
      offTgEvent("safeAreaChanged", onSafeAreaChanged);
      offTgEvent("contentSafeAreaChanged", onContentSafeAreaChanged);
      offTgEvent("fullscreenChanged", onFullscreenChanged);
    };
  }, [inTelegram]);

  return <div className={inTelegram ? "tg-app" : ""}>{children}</div>;
}

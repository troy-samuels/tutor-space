"use client";

import * as React from "react";
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

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const [inTelegram, setInTelegram] = React.useState(false);

  React.useEffect(() => {
    const boot = () => {
      if (!isTelegram()) return false;
      setInTelegram(true);
      initTelegram();
      updateSafeAreaProperties();
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
  }, []);

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

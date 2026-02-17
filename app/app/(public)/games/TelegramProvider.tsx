"use client";

import * as React from "react";
import { initTelegram, isTelegram } from "@/lib/telegram";

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const [inTelegram, setInTelegram] = React.useState(false);

  React.useEffect(() => {
    // SDK script loads via beforeInteractive, so it should be available immediately
    if (isTelegram()) {
      setInTelegram(true);
      initTelegram();
    } else {
      // Retry once after a short delay in case SDK hasn't loaded yet
      const timer = setTimeout(() => {
        if (isTelegram()) {
          setInTelegram(true);
          initTelegram();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, []);

  return <div className={inTelegram ? "tg-app" : ""}>{children}</div>;
}

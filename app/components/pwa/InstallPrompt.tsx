"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useIsMobile } from "@/lib/hooks/useMediaQuery";
import { cn } from "@/lib/utils";

interface BeforeInstallPromptEvent extends Event {
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt: () => Promise<void>;
}

const SESSION_STORAGE_KEY = "tl_pwa_install_prompt_session_id";
const SEEN_SESSION_KEY = "tl_pwa_install_prompt_seen_session";

function getOrCreateSessionId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const existing = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (existing) {
      return existing;
    }

    const sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
    return sessionId;
  } catch {
    return null;
  }
}

function isStandaloneMode(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const navigatorWithStandalone = window.navigator as Navigator & {
    standalone?: boolean;
  };

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    navigatorWithStandalone.standalone === true
  );
}

function markSessionAsSeen(sessionId: string | null) {
  if (typeof window === "undefined" || !sessionId) {
    return;
  }

  try {
    window.localStorage.setItem(SEEN_SESSION_KEY, sessionId);
  } catch {
    // Ignore storage errors.
  }
}

function hasSeenPromptThisSession(sessionId: string | null): boolean {
  if (typeof window === "undefined" || !sessionId) {
    return true;
  }

  try {
    return window.localStorage.getItem(SEEN_SESSION_KEY) === sessionId;
  } catch {
    return true;
  }
}

export function InstallPrompt() {
  const isMobile = useIsMobile();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    setSessionId(getOrCreateSessionId());
  }, []);

  useEffect(() => {
    if (!isMobile || !sessionId || isStandaloneMode()) {
      return;
    }

    if (hasSeenPromptThisSession(sessionId)) {
      return;
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setIsVisible(true);
      markSessionAsSeen(sessionId);
    };

    const handleAppInstalled = () => {
      markSessionAsSeen(sessionId);
      setDeferredPrompt(null);
      setIsVisible(false);
    };

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt as EventListener
    );
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt as EventListener
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [isMobile, sessionId]);

  const handleDismiss = useCallback(() => {
    markSessionAsSeen(sessionId);
    setIsVisible(false);
    setDeferredPrompt(null);
  }, [sessionId]);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) {
      return;
    }

    setIsInstalling(true);

    try {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
    } finally {
      markSessionAsSeen(sessionId);
      setDeferredPrompt(null);
      setIsVisible(false);
      setIsInstalling(false);
    }
  }, [deferredPrompt, sessionId]);

  return (
    <AnimatePresence>
      {isMobile && isVisible && deferredPrompt ? (
        <motion.aside
          key="pwa-install-prompt"
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 24, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] px-3 pb-3 sm:hidden"
          aria-live="polite"
        >
          <div
            className={cn(
              "pointer-events-auto mx-auto w-full max-w-[430px] rounded-2xl border border-white/10",
              "bg-[#242220]/95 px-4 py-3 text-foreground shadow-[0_12px_32px_rgba(0,0,0,0.35)]",
              "backdrop-blur"
            )}
          >
            <div className="flex items-start gap-3">
              <p className="flex-1 text-sm leading-5 text-foreground/90">
                Add TutorLingua to your home screen for the best experience.
              </p>
              <button
                type="button"
                onClick={handleDismiss}
                className="rounded-full p-1 text-foreground/60 transition-colors hover:text-foreground"
                aria-label="Dismiss install prompt"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleDismiss}
                className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold text-foreground/85 transition-colors hover:text-foreground"
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleInstall();
                }}
                disabled={isInstalling}
                className={cn(
                  "rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-background transition-opacity",
                  isInstalling && "cursor-not-allowed opacity-70"
                )}
              >
                {isInstalling ? "Installing..." : "Install"}
              </button>
            </div>
          </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}

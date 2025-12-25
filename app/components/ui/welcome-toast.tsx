"use client";

import { useEffect, useState } from "react";
import { CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Welcome toast component for post-signup success messages.
 * Reads from sessionStorage and auto-dismisses after display.
 *
 * @example
 * // Add to layout (renders when toast is queued)
 * <WelcomeToast />
 *
 * @example
 * // Queue a toast before navigation
 * import { setWelcomeToast } from "@/components/ui/welcome-toast";
 *
 * // In signup handler:
 * setWelcomeToast("Welcome! Your account has been created.");
 * router.push("/dashboard");
 *
 * @example
 * // Custom duration
 * setWelcomeToast("Success!", 6000); // 6 seconds
 */

const TOAST_STORAGE_KEY = "signup_welcome_toast";
const DEFAULT_DURATION = 4000;

interface ToastData {
  message: string;
  duration?: number;
}

export function WelcomeToast() {
  const [toast, setToast] = useState<ToastData | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem(TOAST_STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored) as ToastData;
        sessionStorage.removeItem(TOAST_STORAGE_KEY);
        setToast(data);
        // Trigger animation after mount
        requestAnimationFrame(() => setIsVisible(true));

        // Auto-dismiss
        const timer = setTimeout(() => {
          setIsVisible(false);
          setTimeout(() => setToast(null), 200);
        }, data.duration ?? DEFAULT_DURATION);

        return () => clearTimeout(timer);
      } catch {
        sessionStorage.removeItem(TOAST_STORAGE_KEY);
      }
    }
  }, []);

  if (!toast) return null;

  return (
    <div className="fixed top-6 right-6 z-50 pointer-events-none">
      <div
        className={cn(
          "min-w-[280px] rounded-xl border px-4 py-3 shadow-lg pointer-events-auto",
          "flex items-center gap-3",
          "bg-emerald-50 border-emerald-200 text-emerald-900",
          "transition-all duration-200 ease-out",
          isVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-2"
        )}
        role="status"
        aria-live="polite"
      >
        <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" aria-hidden />
        <p className="text-sm font-medium">{toast.message}</p>
      </div>
    </div>
  );
}

// Utility to trigger the toast (call before navigation)
export function setWelcomeToast(message: string, duration?: number) {
  sessionStorage.setItem(
    TOAST_STORAGE_KEY,
    JSON.stringify({ message, duration })
  );
}

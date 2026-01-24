"use client";

import { useRouter } from "next/navigation";
import { Lock, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
}

export function UpgradeModal({ open, onClose }: UpgradeModalProps) {
  const router = useRouter();

  if (!open) return null;

  const handleUpgrade = () => {
    router.push("/settings/billing?upgrade=pro");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 rounded-2xl bg-white p-6 shadow-xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Content */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
            <Lock className="h-6 w-6 text-amber-600" />
          </div>

          <h3 className="mt-4 text-lg font-semibold text-gray-900">
            Unlock Automations
          </h3>

          <p className="mt-2 text-sm text-gray-500">
            Automatically message students after every lesson. Upgrade to Pro to activate.
          </p>

          <button
            onClick={handleUpgrade}
            className={cn(
              "mt-6 w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium",
              "bg-amber-500 text-white shadow-sm",
              "hover:bg-amber-600",
              "focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2",
              "transition-colors"
            )}
          >
            <Sparkles className="h-4 w-4" />
            Upgrade to Pro
          </button>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              Pro includes: Automations, Analytics, Marketing tools, and more.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

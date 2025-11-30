"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X } from "lucide-react";

interface ImpersonationStatus {
  active: boolean;
  adminEmail?: string;
  tutorId?: string;
  tutorName?: string;
  reason?: string;
  startedAt?: string;
  expiresAt?: string;
}

export function ImpersonationBanner() {
  const router = useRouter();
  const [status, setStatus] = useState<ImpersonationStatus | null>(null);
  const [ending, setEnding] = useState(false);

  useEffect(() => {
    async function checkStatus() {
      try {
        const response = await fetch("/api/admin/impersonate/status");
        const data = await response.json();
        setStatus(data);
      } catch {
        setStatus({ active: false });
      }
    }

    checkStatus();

    // Check status every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  async function handleEndSession() {
    setEnding(true);
    try {
      const response = await fetch("/api/admin/impersonate/end", {
        method: "POST",
      });
      const data = await response.json();

      if (data.redirect) {
        router.push(data.redirect);
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to end impersonation:", error);
      setEnding(false);
    }
  }

  if (!status?.active) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-yellow-400 text-yellow-900 px-4 py-2 shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <div className="text-sm">
            <span className="font-semibold">Impersonating:</span>{" "}
            <span>{status.tutorName}</span>
            <span className="hidden sm:inline text-yellow-800 ml-2">
              ({status.adminEmail})
            </span>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleEndSession}
          disabled={ending}
          className="bg-yellow-500 border-yellow-600 hover:bg-yellow-300 text-yellow-900"
        >
          {ending ? (
            "Ending..."
          ) : (
            <>
              <X className="h-4 w-4 mr-1" />
              End Session
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

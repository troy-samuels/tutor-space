"use client";

import { useState, useEffect } from "react";
import { UserPlus, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { getConnectionStatus } from "@/lib/actions/student-connections";
import type { ConnectionStatus } from "@/lib/actions/types";
import { ConnectionRequestModal } from "./ConnectionRequestModal";

interface StudentConnectButtonProps {
  tutor: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  isLoggedIn: boolean;
}

export function StudentConnectButton({ tutor, isLoggedIn }: StudentConnectButtonProps) {
  const [status, setStatus] = useState<ConnectionStatus | "none" | "loading">("loading");
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    async function checkStatus() {
      if (!isLoggedIn) {
        setStatus("none");
        return;
      }

      const result = await getConnectionStatus(tutor.id);
      setStatus(result.status);
    }
    checkStatus();
  }, [tutor.id, isLoggedIn]);

  const handleSuccess = () => {
    setStatus("pending");
  };

  if (status === "loading") {
    return (
      <button
        disabled
        className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-6 py-2 text-sm font-semibold text-muted-foreground"
      >
        <Loader2 className="h-4 w-4 animate-spin" />
      </button>
    );
  }

  if (!isLoggedIn) {
    return (
      <a
        href={`/student/signup?tutor=${tutor.username}`}
        className="inline-flex items-center justify-center gap-2 rounded-full border border-primary px-6 py-2 text-sm font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground"
      >
        <UserPlus className="h-4 w-4" />
        Sign up as student
      </a>
    );
  }

  if (status === "approved") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-sm font-medium text-green-700">
        <CheckCircle className="h-4 w-4" />
        Connected
      </span>
    );
  }

  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-yellow-50 px-4 py-2 text-sm font-medium text-yellow-700">
        <Clock className="h-4 w-4" />
        Request Pending
      </span>
    );
  }

  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-2 text-sm font-medium text-red-700">
        <XCircle className="h-4 w-4" />
        Request Declined
      </span>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
      >
        <UserPlus className="h-4 w-4" />
        Connect
      </button>

      {showModal && (
        <ConnectionRequestModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          tutor={tutor}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
}

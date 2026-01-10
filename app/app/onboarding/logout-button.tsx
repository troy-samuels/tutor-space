"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { signOut } from "@/lib/actions/auth";

export function LogoutButton() {
  const [isLoggingOut, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await signOut();
    });
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
    >
      <LogOut className="h-4 w-4" />
      <span className="hidden sm:inline">
        {isLoggingOut ? "Logging out..." : "Log out"}
      </span>
    </button>
  );
}

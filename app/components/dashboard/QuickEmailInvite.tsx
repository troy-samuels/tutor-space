"use client";

import { useState, useTransition } from "react";
import { Send, Loader2, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sendQuickInviteEmail } from "@/lib/actions/students";

type QuickEmailInviteProps = {
  tutorName: string;
  bookingUrl: string;
};

export function QuickEmailInvite({ tutorName, bookingUrl }: QuickEmailInviteProps) {
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isValidEmail = email.includes("@") && email.includes(".");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail || isPending) return;

    setStatus("idle");
    setErrorMessage(null);

    startTransition(async () => {
      const result = await sendQuickInviteEmail(email, tutorName, bookingUrl);
      if (result.success) {
        setStatus("success");
        setEmail("");
        // Reset success state after 3 seconds
        setTimeout(() => setStatus("idle"), 3000);
      } else {
        setStatus("error");
        setErrorMessage(result.error ?? "Failed to send invite");
      }
    });
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Send email invite</p>
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <Input
          type="email"
          placeholder="student@email.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status !== "idle") setStatus("idle");
          }}
          disabled={isPending}
          className="flex-1"
        />
        <Button
          type="submit"
          size="sm"
          disabled={!isValidEmail || isPending}
          className="shrink-0"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : status === "success" ? (
            <>
              <Check className="mr-1.5 h-3.5 w-3.5" />
              Sent
            </>
          ) : (
            <>
              <Send className="mr-1.5 h-3.5 w-3.5" />
              Send
            </>
          )}
        </Button>
      </form>
      {status === "success" && (
        <p className="flex items-center gap-1.5 text-xs text-green-600">
          <Check className="h-3 w-3" />
          Invite sent successfully
        </p>
      )}
      {status === "error" && errorMessage && (
        <p className="flex items-center gap-1.5 text-xs text-red-600">
          <AlertCircle className="h-3 w-3" />
          {errorMessage}
        </p>
      )}
      {status === "idle" && (
        <p className="text-xs text-muted-foreground">
          Sends your booking link directly to their inbox.
        </p>
      )}
    </div>
  );
}

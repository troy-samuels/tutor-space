"use client";

import { useActionState, useEffect, useRef } from "react";
import { ArrowUpCircle, Loader2 } from "lucide-react";
import { sendThreadMessage, type MessagingActionState } from "@/lib/actions/messaging";

const initialState: MessagingActionState = {};

type MessageComposerProps = {
  threadId: string;
  placeholder?: string;
};

export function MessageComposer({ threadId, placeholder }: MessageComposerProps) {
  const [state, formAction, isPending] = useActionState(sendThreadMessage, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex items-end gap-3 rounded-2xl border border-border/70 bg-white px-4 py-3 shadow-sm"
    >
      <input type="hidden" name="thread_id" value={threadId} />
      <textarea
        name="body"
        required
        rows={2}
        placeholder={placeholder ?? "Write a message..."}
        className="min-h-[48px] flex-1 resize-none border-0 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
      />
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-brown text-white shadow transition hover:bg-brand-brown/90 disabled:opacity-60"
        aria-label="Send message"
      >
        {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowUpCircle className="h-5 w-5" />}
      </button>
    </form>
  );
}

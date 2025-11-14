import { Suspense } from "react";
import { EmailUnsubscribeForm } from "@/components/email/unsubscribe-form";

type PageProps = {
  searchParams: {
    token?: string;
  };
};

export default function EmailUnsubscribePage({ searchParams }: PageProps) {
  const token = searchParams?.token;

  if (!token) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-4 text-center">
        <p className="text-2xl font-semibold text-foreground">Email preferences</p>
        <p className="text-sm text-muted-foreground">
          This unsubscribe link is missing a token. Please return to the email and try again.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col justify-center gap-6 px-4 text-center">
      <div className="space-y-2">
        <p className="text-2xl font-semibold text-foreground">Unsubscribe from tutor emails</p>
        <p className="text-sm text-muted-foreground">
          Confirm below to stop receiving broadcasts and automations from this tutor. You will still
          receive transactional emails (booking confirmations, receipts).
        </p>
      </div>

      <Suspense fallback={null}>
        <EmailUnsubscribeForm token={token} />
      </Suspense>
    </div>
  );
}

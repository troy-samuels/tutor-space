import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function UpgradeSuccessPage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const params = await searchParams;
  const plan = params.plan === "studio" ? "Studio" : "Growth";

  return (
    <div className="px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl rounded-[32px] border border-border bg-background/95 p-8 text-center shadow-sm">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
        <h1 className="mt-4 text-3xl font-bold">Thanks for upgrading!</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Stripe is confirming your payment. As soon as it clears, the {plan} features will unlock automatically and you&apos;ll receive an email receipt.
        </p>
        <div className="mt-8 flex flex-col gap-3 text-sm font-semibold text-primary sm:flex-row sm:justify-center">
          <Link href="/dashboard" className="inline-flex items-center justify-center rounded-2xl border border-primary px-5 py-3 transition hover:bg-primary hover:text-white">
            Return to dashboard
          </Link>
          <Link href="/settings/billing" className="inline-flex items-center justify-center rounded-2xl border border-border px-5 py-3 transition hover:border-primary hover:text-primary">
            Manage billing
          </Link>
        </div>
      </div>
    </div>
  );
}

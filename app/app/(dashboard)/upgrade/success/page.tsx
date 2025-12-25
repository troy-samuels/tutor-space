import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Sparkles, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { STUDIO_FEATURES } from "@/components/studio/StudioFeatureInfo";
import { Badge } from "@/components/ui/badge";

export default async function UpgradeSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const params = await searchParams;
  const plan = params.plan ?? "All-access";
  const isStudioUpgrade = plan.toLowerCase().includes("studio");

  if (isStudioUpgrade) {
    return (
      <div className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          {/* Celebratory Header */}
          <div className="mb-10 rounded-[32px] border border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50 p-8 text-center shadow-sm">
            <Sparkles className="mx-auto h-12 w-12 animate-pulse text-purple-500" />
            <h1 className="mt-4 text-3xl font-bold text-gray-900">
              Welcome to Studio
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm text-gray-600">
              Your Studio features are now active. Explore everything
              you&apos;ve unlocked below.
            </p>
            <Badge className="mt-4 border-0 bg-purple-100 px-4 py-1 text-sm text-purple-700">
              Studio Active
            </Badge>
          </div>

          {/* Features Grid */}
          <div className="mb-8">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Your Studio Features
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {STUDIO_FEATURES.map((feature) => (
                <div
                  key={feature.id}
                  className="rounded-2xl border border-gray-200 bg-white p-5 transition-all hover:border-purple-200 hover:shadow-md"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <div className="rounded-lg bg-purple-100 p-2">
                      <feature.icon className="h-5 w-5 text-purple-600" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-900">
                    {feature.title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    {feature.description}
                  </p>
                  <Link
                    href={feature.href}
                    className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-purple-600 hover:text-purple-800"
                  >
                    {feature.cta}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Primary CTA */}
          <div className="rounded-2xl border border-purple-200 bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-center text-white">
            <h3 className="text-lg font-semibold">Ready to get started?</h3>
            <p className="mt-1 text-sm text-purple-100">
              Test your new audio classroom to make sure everything is set up
              correctly.
            </p>
            <Link
              href="/classroom/test"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-purple-700 transition hover:bg-purple-50"
            >
              <Sparkles className="h-4 w-4" />
              Try Your First Studio Classroom
            </Link>
          </div>

          {/* Secondary Actions */}
          <div className="mt-6 flex flex-col gap-3 text-center text-sm sm:flex-row sm:justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-5 py-3 font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
            >
              Return to dashboard
            </Link>
            <Link
              href="/settings/billing"
              className="inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-5 py-3 font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
            >
              Manage billing
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Non-Studio upgrade (Pro tier)
  return (
    <div className="px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl rounded-[32px] border border-border bg-background/95 p-8 text-center shadow-sm">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
        <h1 className="mt-4 text-3xl font-bold">Thanks for upgrading!</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Stripe is confirming your payment. As soon as it clears, the {plan}{" "}
          features will unlock automatically and you&apos;ll receive an email
          receipt.
        </p>
        <div className="mt-8 flex flex-col gap-3 text-sm font-semibold text-primary sm:flex-row sm:justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-2xl border border-primary px-5 py-3 transition hover:bg-primary hover:text-white"
          >
            Return to dashboard
          </Link>
          <Link
            href="/settings/billing"
            className="inline-flex items-center justify-center rounded-2xl border border-border px-5 py-3 transition hover:border-primary hover:text-primary"
          >
            Manage billing
          </Link>
        </div>
      </div>
    </div>
  );
}

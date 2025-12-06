"use client";

import { useState } from "react";
import { Loader2, CreditCard, Link as LinkIcon, Check } from "lucide-react";
import { saveOnboardingStep } from "@/lib/actions/onboarding";
import { PlatformSubscriptionCTA } from "@/components/settings/PlatformSubscriptionCTA";

type StepPaymentsProps = {
  profileId: string;
  onComplete: () => void;
  isCompleting: boolean;
};

export function StepPayments({
  profileId,
  onComplete,
  isCompleting,
}: StepPaymentsProps) {
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "custom">("stripe");
  const [customUrl, setCustomUrl] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const startStripeConnectFlow = async (): Promise<string> => {
    // Creates a Stripe Connect account (if needed) and returns an onboarding link
    const accountRes = await fetch("/api/stripe/connect/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tutorId: profileId }),
    });
    const accountData = await accountRes.json();
    if (!accountRes.ok) {
      throw new Error(accountData?.error || "Failed to create Stripe account.");
    }

    const accountId = accountData.accountId as string;
    const linkRes = await fetch("/api/stripe/connect/account-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId }),
    });
    const linkData = await linkRes.json();
    if (!linkRes.ok || !linkData?.url) {
      throw new Error(linkData?.error || "Failed to start Stripe onboarding.");
    }

    return linkData.url as string;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      const urlToTest = url.startsWith("http") ? url : `https://${url}`;
      new URL(urlToTest);
      return true;
    } catch {
      return false;
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (paymentMethod === "custom") {
      if (!customUrl.trim()) {
        newErrors.customUrl = "Payment URL is required";
      } else if (!isValidUrl(customUrl)) {
        newErrors.customUrl = "Please enter a valid URL";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      let paymentUrl = customUrl.trim();
      if (paymentUrl && !paymentUrl.startsWith("http")) {
        paymentUrl = `https://${paymentUrl}`;
      }

      const result = await saveOnboardingStep(6, {
        payment_method: paymentMethod,
        custom_payment_url: paymentMethod === "custom" ? paymentUrl : null,
        // For Stripe, we'll handle the connect flow separately
        // This just marks the step as complete with the intention to connect later
      });

      if (result.success) {
        if (paymentMethod === "stripe") {
          try {
            const onboardingUrl = await startStripeConnectFlow();
            window.location.href = onboardingUrl;
            return;
          } catch (connectError) {
            setErrors({
              submit:
                (connectError as Error).message ||
                "We saved your preferences but couldn't start Stripe onboarding. Please try again from Settings → Payments.",
            });
            return;
          } finally {
            setIsSaving(false);
          }
        }

        onComplete();
      } else {
        setErrors({ submit: result.error || "Failed to save. Please try again." });
      }
    } catch (error) {
      console.error("Error saving step 5:", error);
      setErrors({ submit: "Failed to save payment settings. Please check your connection and try again." });
    } finally {
      // If we redirected to Stripe, this won't run, but that's fine.
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Choose how you'll accept payments from students.
      </p>

      {/* Payment Method Selection */}
      <div className="space-y-3">
        {/* Stripe Option */}
        <button
          type="button"
          onClick={() => setPaymentMethod("stripe")}
          className={`flex w-full items-start gap-4 rounded-xl border p-4 text-left transition ${
            paymentMethod === "stripe"
              ? "border-primary bg-primary/10 ring-2 ring-primary ring-offset-1"
              : "border-gray-200 hover:border-primary/70 hover:bg-primary/5"
          }`}
        >
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-lg ${
              paymentMethod === "stripe"
                ? "bg-primary text-primary-foreground"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            <CreditCard className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">
                Connect with Stripe
              </span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                Recommended
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Accept credit cards and bank transfers. Automatic invoicing and payouts.
            </p>
          </div>
          {paymentMethod === "stripe" && (
            <Check className="h-5 w-5 text-primary" />
          )}
        </button>

        {/* Custom URL Option */}
        <button
          type="button"
          onClick={() => setPaymentMethod("custom")}
          className={`flex w-full items-start gap-4 rounded-xl border p-4 text-left transition ${
            paymentMethod === "custom"
              ? "border-primary bg-primary/10 ring-2 ring-primary ring-offset-1"
              : "border-gray-200 hover:border-primary/70 hover:bg-primary/5"
          }`}
        >
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-lg ${
              paymentMethod === "custom"
                ? "bg-primary text-primary-foreground"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            <LinkIcon className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <span className="text-sm font-semibold text-foreground">
              Use custom payment link
            </span>
            <p className="mt-1 text-xs text-muted-foreground">
              PayPal, Venmo, or any other payment service you prefer.
            </p>
          </div>
          {paymentMethod === "custom" && (
            <Check className="h-5 w-5 text-primary" />
          )}
        </button>
      </div>

      {/* Custom URL Input */}
      {paymentMethod === "custom" && (
        <div className="space-y-2">
          <label htmlFor="custom_url" className="block text-sm font-medium text-foreground">
            Payment URL <span className="text-red-500">*</span>
          </label>
          <input
            id="custom_url"
            type="text"
            value={customUrl}
            onChange={(e) => {
              setCustomUrl(e.target.value);
              if (errors.customUrl) {
                setErrors((prev) => ({ ...prev, customUrl: "" }));
              }
            }}
            placeholder="e.g., paypal.me/yourname"
            className={`w-full rounded-xl border bg-white px-4 py-3 text-sm transition focus:outline-none focus:ring-2 ${
              errors.customUrl
                ? "border-red-300 focus:ring-red-500"
                : "border-gray-300 focus:border-primary focus:ring-primary/20"
            }`}
          />
          {errors.customUrl && (
            <p className="text-xs text-red-600">{errors.customUrl}</p>
          )}
        </div>
      )}

      {/* Stripe info box */}
      {paymentMethod === "stripe" && (
        <div className="rounded-xl bg-blue-50 p-4">
          <p className="text-xs text-blue-800">
            After completing onboarding, you'll be guided through Stripe Connect setup
            to start accepting payments. This usually takes about 5 minutes.
          </p>
        </div>
      )}

      {errors.submit && (
        <p className="text-sm text-red-600">{errors.submit}</p>
      )}

      {/* Platform subscription */}
      <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Activate TutorLingua</p>
            <p className="text-xs text-muted-foreground">
              Start your 14-day free trial. Then $39/mo or $299/yr. Cancel anytime during the trial.
            </p>
          </div>
        </div>
        <div className="mt-3">
          <PlatformSubscriptionCTA
            ctaLabel="Start 14-day free trial"
            helperText="14-day free trial. Then $39/mo or $299/yr. Annual saves 36%."
          />
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSaving || isCompleting}
          className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving || isCompleting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isCompleting ? "Completing..." : "Saving..."}
            </>
          ) : (
            "Complete Setup"
          )}
        </button>
      </div>
    </div>
  );
}

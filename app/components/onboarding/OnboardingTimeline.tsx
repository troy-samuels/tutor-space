"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle, X } from "lucide-react";
import { TimelineStep, StepStatus } from "./TimelineStep";
import { StepProfileBasics } from "./steps/StepProfileBasics";
import { StepProfessionalInfo } from "./steps/StepProfessionalInfo";
import { StepLanguagesServices } from "./steps/StepLanguagesServices";
import { StepAvailability } from "./steps/StepAvailability";
import { StepCalendarSync } from "./steps/StepCalendarSync";
import { StepVideo } from "./steps/StepVideo";
import { StepPayments } from "./steps/StepPayments";
import {
  checkOnboardingStatus,
  completeOnboarding,
} from "@/lib/actions/onboarding";
import { WelcomeToast } from "@/components/ui/welcome-toast";

type OnboardingProfile = {
  id: string;
  full_name: string | null;
  username: string | null;
  email: string | null;
  stripe_charges_enabled?: boolean;
};

type ExistingService = {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
  currency: string;
  offer_type: "trial" | "one_off" | "lesson_block" | "subscription";
};

type ExistingPackage = {
  id: string;
  service_id: string | null;
  name: string;
  session_count: number | null;
  total_minutes: number;
  price_cents: number;
  currency: string;
};

type OnboardingTimelineProps = {
  profile: OnboardingProfile;
  existingServices?: ExistingService[];
  existingPackages?: ExistingPackage[];
};

const STEPS = [
  {
    id: 1,
    title: "Profile Basics",
    description: "Set up your name, username, timezone, and profile photo",
  },
  {
    id: 2,
    title: "Professional Info",
    description: "Add your tagline, bio, and website to showcase your expertise",
  },
  {
    id: 3,
    title: "Languages & Services",
    description: "Define languages you teach and create your first service package",
  },
  {
    id: 4,
    title: "Availability",
    description: "Set your weekly availability windows for student bookings",
  },
  {
    id: 5,
    title: "Calendar Sync",
    description: "Connect Google or Outlook to sync your schedule (optional)",
  },
  {
    id: 6,
    title: "Video Conferencing",
    description: "Add your meeting link so students can easily join lessons",
  },
  {
    id: 7,
    title: "Get Paid",
    description: "Choose how students will pay you for lessons",
  },
] as const;

export function OnboardingTimeline({
  profile,
  existingServices = [],
  existingPackages = [],
}: OnboardingTimelineProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isCompleting, setIsCompleting] = useState(false);
  const [saveError, setSaveError] = useState<{ step: number; message: string } | null>(null);
  const [showSubscriptionBanner, setShowSubscriptionBanner] = useState(false);
  const [showStripeReturnBanner, setShowStripeReturnBanner] = useState(false);
  const [stripeRefresh, setStripeRefresh] = useState(false);
  const [stripeReturnDetected, setStripeReturnDetected] = useState(false);

  // Read URL params after mount to avoid hydration issues with useSearchParams
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const subscriptionSuccess = params.get("subscription") === "success";
    const stripeReturnParam = params.get("stripe_return") === "1";
    const stripeRefreshParam = params.get("stripe_refresh") === "1";

    if (stripeReturnParam || stripeRefreshParam) {
      setCurrentStep(7);
      // Initial status refresh - StepPayments will handle polling
    }
    if (stripeReturnParam) {
      setShowStripeReturnBanner(true);
      setStripeReturnDetected(true);
    }
    if (stripeRefreshParam) {
      setStripeRefresh(true);
    }
    if (subscriptionSuccess) {
      setShowSubscriptionBanner(true);
    }
  }, []);

  // Resume progress from the saved onboarding step
  useEffect(() => {
    let isMounted = true;
    const params = new URLSearchParams(window.location.search);
    const hasStripeReturn = params.get("stripe_return") === "1";
    const hasStripeRefresh = params.get("stripe_refresh") === "1";

    checkOnboardingStatus()
      .then(({ completed, step }) => {
        if (!isMounted || completed) return;

        let normalizedStep = Math.min(Math.max(step || 1, 1), 7);
        if (hasStripeReturn || hasStripeRefresh) {
          normalizedStep = 7;
        }
        setCurrentStep(normalizedStep);

        if (normalizedStep > 1) {
          setCompletedSteps(Array.from({ length: normalizedStep - 1 }, (_, index) => index + 1));
        }
      })
      .catch((error) => {
        console.error("Failed to resume onboarding progress:", error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Auto-dismiss Stripe return banner after 8 seconds
  useEffect(() => {
    if (!showStripeReturnBanner) return;

    const timer = setTimeout(() => setShowStripeReturnBanner(false), 8000);
    return () => clearTimeout(timer);
  }, [showStripeReturnBanner]);

  // Auto-dismiss subscription success banner after 8 seconds
  useEffect(() => {
    if (!showSubscriptionBanner) return;

    const timer = setTimeout(() => setShowSubscriptionBanner(false), 8000);
    return () => clearTimeout(timer);
  }, [showSubscriptionBanner]);

  // Callback for step components to report background save errors
  const handleSaveError = useCallback((step: number, message: string) => {
    setSaveError({ step, message });
    // Auto-dismiss after 5 seconds
    setTimeout(() => setSaveError(null), 5000);
  }, []);

  const getStepStatus = (stepNumber: number): StepStatus => {
    if (stepNumber === currentStep) return "active";
    if (completedSteps.includes(stepNumber)) return "completed";
    return "upcoming";
  };

  const handleNavigateToStep = (stepNumber: number) => {
    if (completedSteps.includes(stepNumber)) {
      setCurrentStep(stepNumber);
    }
  };

  // Keep the next step fully in view, respecting scroll margin offsets for the sticky header
  useEffect(() => {
    if (currentStep === 1) return;

    const nextStepElement = document.getElementById(`step-${currentStep}`);
    if (!nextStepElement) return;

    requestAnimationFrame(() => {
      nextStepElement.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest",
      });
    });
  }, [currentStep]);

  const handleStepComplete = async (stepNumber: number) => {
    setCompletedSteps((prev) =>
      prev.includes(stepNumber) ? prev : [...prev, stepNumber],
    );

    if (stepNumber === 7) {
      // Final step - complete onboarding and redirect
      setIsCompleting(true);
      try {
        const result = await completeOnboarding();
        if (result.success) {
          // Determine redirect destination
          const targetUrl = result.redirectTo ?? "/dashboard";

          // Brief delay before redirect
          setTimeout(() => {
            // Check if redirecting to Stripe checkout (external URL)
            if (targetUrl.startsWith("https://")) {
              window.location.href = targetUrl;
            } else {
              router.push(targetUrl);
            }
          }, 500);
        } else {
          const message = result.error || "Failed to complete onboarding.";
          console.error("Failed to complete onboarding:", message);
          handleSaveError(7, message);
          setIsCompleting(false);
        }
      } catch (error) {
        console.error("Error completing onboarding:", error);
        setIsCompleting(false);
      }
    } else {
      setCurrentStep(stepNumber + 1);
    }
  };

  const renderStepContent = (stepNumber: number) => {
    switch (stepNumber) {
      case 1:
        return (
          <StepProfileBasics
            profileId={profile.id}
            initialValues={{
              full_name: profile.full_name || "",
              username: profile.username || "",
            }}
            onComplete={() => handleStepComplete(1)}
            onSaveError={(msg) => handleSaveError(1, msg)}
          />
        );
      case 2:
        return (
          <StepProfessionalInfo
            onComplete={() => handleStepComplete(2)}
            onSaveError={(msg) => handleSaveError(2, msg)}
          />
        );
      case 3:
        return (
          <StepLanguagesServices
            onComplete={() => handleStepComplete(3)}
            onSaveError={(msg) => handleSaveError(3, msg)}
            existingServices={existingServices}
            existingPackages={existingPackages}
          />
        );
      case 4:
        return (
          <StepAvailability
            onComplete={() => handleStepComplete(4)}
            onSaveError={(msg) => handleSaveError(4, msg)}
          />
        );
      case 5:
        return (
          <StepCalendarSync
            onComplete={() => handleStepComplete(5)}
          />
        );
      case 6:
        return (
          <StepVideo
            onComplete={() => handleStepComplete(6)}
            onSaveError={(msg) => handleSaveError(6, msg)}
          />
        );
      case 7:
        return (
          <StepPayments
            profileId={profile.id}
            onComplete={() => handleStepComplete(7)}
            isCompleting={isCompleting}
            stripeReturnDetected={stripeReturnDetected}
            initialStripeChargesEnabled={profile.stripe_charges_enabled}
          />
        );
      default:
        return null;
    }
  };

  return (
    <section className="mx-auto w-full max-w-2xl">
      <WelcomeToast />
      <header className="mb-6 sm:mb-8 text-center">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">
          Welcome to TutorLingua!
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-muted-foreground px-4 sm:px-0">
          Complete these steps to get your tutor site ready for bookings
        </p>
      </header>

      {/* Subscription success banner */}
      {showSubscriptionBanner && (
        <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4 animate-in slide-in-from-top-2">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-emerald-800">
                Your free trial has started!
              </p>
              <p className="text-xs text-emerald-600 mt-1">
                You have 14 days to explore TutorLingua. Let&apos;s finish setting up your profile.
              </p>
            </div>
            <button
              onClick={() => setShowSubscriptionBanner(false)}
              className="text-emerald-400 hover:text-emerald-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Stripe Connect return success banner */}
      {showStripeReturnBanner && (
        <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4 animate-in slide-in-from-top-2">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-emerald-800">
                Stripe setup started!
              </p>
              <p className="text-xs text-emerald-600 mt-1">
                Click &quot;Continue&quot; to complete your profile and start accepting payments.
              </p>
            </div>
            <button
              onClick={() => setShowStripeReturnBanner(false)}
              className="text-emerald-400 hover:text-emerald-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Stripe refresh banner (user needs to re-enter info) */}
      {stripeRefresh && !showStripeReturnBanner && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4 animate-in slide-in-from-top-2">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800">
                Stripe needs more information
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                Click &quot;Set Up Card Payments&quot; to continue where you left off.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-0">
        {STEPS.map((step) => (
          <div key={step.id} id={`step-${step.id}`} className="scroll-mt-24 sm:scroll-mt-20">
            <TimelineStep
              stepNumber={step.id}
              title={step.title}
              description={step.description}
              status={getStepStatus(step.id)}
              isCompleted={completedSteps.includes(step.id)}
              isLastStep={step.id === 7}
              onNavigate={handleNavigateToStep}
            >
              {renderStepContent(step.id)}
            </TimelineStep>
          </div>
        ))}
      </div>

      {/* Error banner for failed background saves */}
      {saveError && (
        <div className="fixed bottom-4 right-4 z-50 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg max-w-sm animate-in slide-in-from-bottom-2">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">
                Failed to save Step {saveError.step}
              </p>
              <p className="text-xs text-red-600 mt-1">{saveError.message}</p>
            </div>
            <button
              onClick={() => setSaveError(null)}
              className="text-red-400 hover:text-red-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

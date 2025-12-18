"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { TimelineStep, StepStatus } from "./TimelineStep";
import { StepProfileBasics } from "./steps/StepProfileBasics";
import { StepProfessionalInfo } from "./steps/StepProfessionalInfo";
import { StepLanguagesServices } from "./steps/StepLanguagesServices";
import { StepAvailability } from "./steps/StepAvailability";
import { StepCalendarSync } from "./steps/StepCalendarSync";
import { StepVideo } from "./steps/StepVideo";
import { StepPayments } from "./steps/StepPayments";
import { completeOnboarding } from "@/lib/actions/onboarding";

type OnboardingProfile = {
  id: string;
  full_name: string | null;
  username: string | null;
  email: string | null;
};

type OnboardingTimelineProps = {
  profile: OnboardingProfile;
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
    title: "Payments",
    description: "Connect Stripe or add a payment link to start accepting payments",
  },
] as const;

export function OnboardingTimeline({ profile }: OnboardingTimelineProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isCompleting, setIsCompleting] = useState(false);

  const getStepStatus = (stepNumber: number): StepStatus => {
    if (stepNumber < currentStep) return "completed";
    if (stepNumber === currentStep) return "active";
    return "upcoming";
  };

  // Custom smooth scroll with easing for a polished feel
  const smoothScrollTo = useCallback((element: HTMLElement) => {
    const headerOffset = 80; // Account for sticky header
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.scrollY - headerOffset;

    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth",
    });
  }, []);

  const handleStepComplete = async (stepNumber: number) => {
    if (stepNumber === 7) {
      // Final step - complete onboarding and redirect
      setIsCompleting(true);
      try {
        const result = await completeOnboarding();
        if (result.success) {
          // Fire confetti celebration
          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
          });

          // Determine redirect destination
          const targetUrl = result.redirectTo ?? "/dashboard";

          // Delay redirect so user can see the celebration
          setTimeout(() => {
            // Check if redirecting to Stripe checkout (external URL)
            if (targetUrl.startsWith("https://")) {
              window.location.href = targetUrl;
            } else {
              router.push(targetUrl);
            }
          }, 2000);
        } else {
          console.error("Failed to complete onboarding:", result.error);
          setIsCompleting(false);
        }
      } catch (error) {
        console.error("Error completing onboarding:", error);
        setIsCompleting(false);
      }
    } else {
      setCurrentStep(stepNumber + 1);
      requestAnimationFrame(() => {
        const nextStepElement = document.getElementById(`step-${stepNumber + 1}`);
        if (nextStepElement) {
          smoothScrollTo(nextStepElement);
        }
      });
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
          />
        );
      case 2:
        return (
          <StepProfessionalInfo
            onComplete={() => handleStepComplete(2)}
          />
        );
      case 3:
        return (
          <StepLanguagesServices
            onComplete={() => handleStepComplete(3)}
          />
        );
      case 4:
        return (
          <StepAvailability
            onComplete={() => handleStepComplete(4)}
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
          />
        );
      case 7:
        return (
          <StepPayments
            profileId={profile.id}
            onComplete={() => handleStepComplete(7)}
            isCompleting={isCompleting}
          />
        );
      default:
        return null;
    }
  };

  return (
    <section className="mx-auto w-full max-w-2xl">
      <header className="mb-6 sm:mb-8 text-center">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">
          Welcome to TutorLingua!
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-muted-foreground px-4 sm:px-0">
          Complete these steps to get your tutor site ready for bookings
        </p>
      </header>

      <div className="space-y-0">
        {STEPS.map((step) => (
          <div key={step.id} id={`step-${step.id}`} className="scroll-mt-24 sm:scroll-mt-20">
            <TimelineStep
              stepNumber={step.id}
              title={step.title}
              description={step.description}
              status={getStepStatus(step.id)}
              isLastStep={step.id === 7}
            >
              {renderStepContent(step.id)}
            </TimelineStep>
          </div>
        ))}
      </div>
    </section>
  );
}

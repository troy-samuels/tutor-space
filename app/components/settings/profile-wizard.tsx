"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { ProfileWizardProvider } from "@/lib/contexts/profile-wizard-context";

type WizardStep = {
  id: number;
  title: string;
  description: string;
  component: React.ComponentType<{
    onNext: () => void;
    onBack: () => void;
    initialValues?: any;
  }>;
};

export function ProfileWizard({
  steps,
  initialValues = {},
  onComplete,
}: {
  steps: WizardStep[];
  initialValues?: any;
  onComplete?: () => void;
}) {
  return (
    <ProfileWizardProvider initialValues={initialValues} onComplete={onComplete}>
      <WizardContent steps={steps} onComplete={onComplete} />
    </ProfileWizardProvider>
  );
}

function WizardContent({
  steps,
  onComplete,
}: {
  steps: WizardStep[];
  onComplete?: () => void;
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = steps.length;

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else if (onComplete) {
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = steps[currentStep];
  const StepComponent = currentStepData.component;
  const progressPercentage = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="mx-auto w-full max-w-3xl">
      {/* Header */}
      <div className="mb-8 space-y-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">
            {currentStepData.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {currentStepData.description}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">
              Step {currentStep + 1} of {totalSteps}
            </span>
            <span className="text-muted-foreground">
              {Math.round(progressPercentage)}% complete
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-brand-cream">
            <div
              className="h-full rounded-full bg-brand-brown transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(index)}
                  disabled={index > currentStep}
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition ${
                    index < currentStep
                      ? "border-brand-brown bg-brand-brown text-brand-white"
                      : index === currentStep
                      ? "animate-pulse border-brand-brown bg-brand-brown text-brand-white shadow-lg"
                      : "border-gray-300 bg-white text-gray-400"
                  } ${index <= currentStep ? "cursor-pointer hover:shadow-md" : "cursor-not-allowed"}`}
                  aria-label={`Step ${index + 1}: ${step.title}`}
                  aria-current={index === currentStep ? "step" : undefined}
                >
                  {index < currentStep ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </button>
                <span
                  className={`hidden text-xs font-medium sm:block ${
                    index === currentStep
                      ? "text-brand-brown"
                      : index < currentStep
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {step.title.split(" ")[0]}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`mx-2 h-0.5 w-8 transition sm:w-16 ${
                    index < currentStep ? "bg-brand-brown" : "bg-gray-300"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="rounded-3xl border border-brand-brown/20 bg-white/90 p-6 shadow-sm backdrop-blur sm:p-8">
        <StepComponent
          onNext={handleNext}
          onBack={handleBack}
          initialValues={initialValues}
        />
      </div>

      {/* Navigation Footer */}
      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={handleBack}
          disabled={currentStep === 0}
          className="inline-flex h-11 items-center justify-center rounded-full border-2 border-brand-brown/30 bg-white px-6 text-sm font-semibold text-brand-brown transition hover:bg-brand-brown/5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Back
        </button>

        <div className="text-sm text-muted-foreground">
          {currentStep < totalSteps - 1 ? (
            <span>Press Continue when ready</span>
          ) : (
            <span>Last step!</span>
          )}
        </div>
      </div>
    </div>
  );
}

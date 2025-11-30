"use client";

import { Check, Clock, Save, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  PageBuilderWizardProvider,
  usePageBuilderWizard,
  WIZARD_STEPS,
  type InitialWizardData,
} from "./wizard-context";
import { WizardProgress } from "./wizard-progress";
import { StepBrand } from "./steps/step-brand";
import { StepLayout } from "./steps/step-layout";
import { StepContent } from "./steps/step-content";
import { StepPages } from "./steps/step-pages";
import { SimplifiedPreview } from "./preview/simplified-preview";

type EditorProfile = {
  id: string;
  full_name: string;
  username: string;
  tagline: string;
  bio: string;
  avatar_url: string | null;
  email?: string | null;
  stripe_payment_link?: string | null;
};

type ServiceLite = {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number | null;
  price: number | null;
  currency: string | null;
};

type PageBuilderWizardProps = {
  profile: EditorProfile;
  services: ServiceLite[];
  students: Array<{ id: string; name: string; hasContact: boolean }>;
  defaultReviewFormUrl: string;
  initialSiteData: InitialWizardData | null;
};

export function PageBuilderWizard(props: PageBuilderWizardProps) {
  const initialData: InitialWizardData = props.initialSiteData || {
    site: null,
    services: [],
    reviews: [],
    resources: [],
    profile: props.profile,
    allServices: props.services,
  };

  // Merge profile into initial data
  if (!initialData.profile) {
    initialData.profile = props.profile;
  }
  if (!initialData.allServices) {
    initialData.allServices = props.services;
  }

  return (
    <PageBuilderWizardProvider initialData={initialData}>
      <WizardContent
        profile={props.profile}
        services={props.services}
        reviews={initialData.reviews}
      />
    </PageBuilderWizardProvider>
  );
}

type WizardContentProps = {
  profile: EditorProfile;
  services: ServiceLite[];
  reviews: Array<{ id?: string; author_name: string; quote: string }>;
};

function WizardContent({ profile, services, reviews }: WizardContentProps) {
  const { state, saveDraft, publish } = usePageBuilderWizard();
  const { currentStep, status, autoSaveStatus, lastSaved, isPublishing } = state;

  const currentStepData = WIZARD_STEPS[currentStep];

  // Transform reviews for StepPages component
  const reviewsForStep = reviews.map((r) => ({
    id: r.id,
    author: r.author_name,
    quote: r.quote,
  }));

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-border/60 bg-background/90 p-4 shadow-sm backdrop-blur">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-foreground">Build Your Page</h1>
          {status === "published" ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              <Check className="h-3.5 w-3.5" />
              Published
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
              <Clock className="h-3.5 w-3.5" />
              Draft
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {autoSaveStatus === "saving" ? (
            <span className="text-xs text-muted-foreground">Saving...</span>
          ) : autoSaveStatus === "saved" ? (
            <span className="text-xs text-emerald-600">
              Saved{" "}
              {lastSaved
                ? `at ${lastSaved.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`
                : ""}
            </span>
          ) : autoSaveStatus === "error" ? (
            <span className="text-xs text-red-600">Error saving</span>
          ) : null}
          <Button
            onClick={saveDraft}
            variant="outline"
            size="sm"
            className="rounded-full"
          >
            <Save className="h-4 w-4 mr-1.5" />
            Save Draft
          </Button>
          <Button
            onClick={publish}
            size="sm"
            className="rounded-full"
            disabled={isPublishing}
          >
            <Rocket className="h-4 w-4 mr-1.5" />
            {isPublishing ? "Publishing..." : "Publish"}
          </Button>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.4fr)] lg:items-start">
        {/* Editor */}
        <div className="space-y-6">
          {/* Progress */}
          <section className="rounded-3xl border border-border/60 bg-background/90 p-6 shadow-sm backdrop-blur">
            <WizardProgress />
          </section>

          {/* Current step content */}
          <section className="rounded-3xl border border-border/60 bg-background/90 p-6 shadow-sm backdrop-blur">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-foreground">
                {currentStepData.title}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {currentStepData.description}
              </p>
            </div>

            {/* Step components */}
            {currentStep === 0 && <StepBrand />}
            {currentStep === 1 && <StepLayout />}
            {currentStep === 2 && <StepContent />}
            {currentStep === 3 && (
              <StepPages services={services} reviews={reviewsForStep} />
            )}
          </section>
        </div>

        {/* Preview */}
        <SimplifiedPreview profile={profile} services={services} reviews={reviewsForStep} />
      </div>
    </div>
  );
}

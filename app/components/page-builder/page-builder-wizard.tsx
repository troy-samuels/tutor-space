"use client";

import { Check, Clock, Save, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  PageBuilderWizardProvider,
  usePageBuilderWizard,
  type InitialWizardData,
} from "./wizard-context";
import {
  InlineProgressWheel,
  calculateSectionCompletion,
} from "./circular-progress-wheel";
import { SectionWrapper } from "./section-wrapper";
import { MobilePreviewToggle } from "./mobile-preview-toggle";
import { StepProfile } from "./steps/step-profile";
import { StepContentUnified } from "./steps/step-content-unified";
import { StepStyle } from "./steps/step-style";
import { SimplifiedPreview } from "./preview/simplified-preview";
import { useMemo } from "react";

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
  const { status, autoSaveStatus, lastSaved, isPublishing, avatarUrl, faq } = state;

  const previewUrl = useMemo(() => {
    if (!state.siteId) return null;
    const base = process.env.NEXT_PUBLIC_APP_URL || "https://tutorlingua.co";
    return `${base}/pages/${state.siteId}/preview`;
  }, [state.siteId]);

  // Calculate section completion for progress wheel
  const sectionCompletion = calculateSectionCompletion({
    content: state.content,
    pages: state.pages,
    faq,
    avatarUrl,
  });

  // Transform reviews for StepContentUnified component
  const reviewsForStep = reviews.map((r) => ({
    id: r.id,
    author: r.author_name,
    quote: r.quote,
  }));

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/30 bg-background p-4">
        <div className="flex items-center gap-4">
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
          <div className="hidden sm:block border-l border-border/50 pl-4">
            <InlineProgressWheel completion={sectionCompletion} />
          </div>
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
          {previewUrl && (
            <Button
              asChild
              variant="secondary"
              size="sm"
              className="rounded-full"
            >
              <a href={previewUrl} target="_blank" rel="noreferrer">
                Preview link
              </a>
            </Button>
          )}
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
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.4fr)] lg:items-start">
        {/* Editor - All sections in single scrollable column */}
        <div className="space-y-4">
          {/* Profile Section */}
          <SectionWrapper
            title="Profile"
            description="Photo, name, about"
            isComplete={sectionCompletion.profile}
          >
            <StepProfile fullName={profile.full_name} />
          </SectionWrapper>

          {/* Content Section */}
          <SectionWrapper
            title="Content"
            description="Services, FAQ, reviews"
            isComplete={sectionCompletion.content}
          >
            <StepContentUnified services={services} reviews={reviewsForStep} />
          </SectionWrapper>

          {/* Style Section */}
          <SectionWrapper
            title="Style"
            description="Colors, fonts, layout"
            isComplete={sectionCompletion.style}
          >
            <StepStyle />
          </SectionWrapper>

          {/* Bottom action buttons (for mobile) */}
          <div className="flex flex-col gap-2 pb-20 lg:hidden">
            <Button
              onClick={saveDraft}
              variant="outline"
              className="w-full rounded-full"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
            <Button
              onClick={publish}
              className="w-full rounded-full"
              disabled={isPublishing}
            >
              <Rocket className="h-4 w-4 mr-2" />
              {isPublishing ? "Publishing..." : "Publish Site"}
            </Button>
          </div>
        </div>

        {/* Preview - Desktop (sticky sidebar) */}
        <div className="hidden lg:block lg:sticky lg:top-4">
          <SimplifiedPreview
            profile={{ ...profile, avatar_url: avatarUrl }}
            services={services}
            reviews={reviewsForStep}
          />
        </div>

        {/* Preview - Mobile (toggle panel) */}
        <MobilePreviewToggle>
          <SimplifiedPreview
            profile={{ ...profile, avatar_url: avatarUrl }}
            services={services}
            reviews={reviewsForStep}
          />
        </MobilePreviewToggle>
      </div>
    </div>
  );
}

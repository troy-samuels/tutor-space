"use client";

import { useState } from "react";
import { Loader2, Video, Check, ExternalLink } from "lucide-react";
import { saveOnboardingStep } from "@/lib/actions/onboarding";

type StepVideoProps = {
  onComplete: () => void;
};

type VideoProvider = "zoom_personal" | "google_meet" | "microsoft_teams" | "custom" | "none";

export function StepVideo({ onComplete }: StepVideoProps) {
  const [selectedProvider, setSelectedProvider] = useState<VideoProvider | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [customPlatformName, setCustomPlatformName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateUrl = (url: string, provider: VideoProvider): boolean => {
    if (!url.trim()) return false;

    try {
      new URL(url);
    } catch {
      return false;
    }

    if (provider === "zoom_personal" && !url.includes("zoom.us")) {
      return false;
    }
    if (provider === "google_meet" && !url.includes("meet.google.com")) {
      return false;
    }
    if (provider === "microsoft_teams" &&
        !url.includes("teams.microsoft.com") &&
        !url.includes("teams.live.com")) {
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!selectedProvider) {
      setErrors({ submit: "Please select a video platform" });
      return;
    }

    // Validate URL for providers that need one
    if (selectedProvider !== "none") {
      if (!videoUrl.trim()) {
        setErrors({ submit: "Please enter your meeting link" });
        return;
      }
      if (!validateUrl(videoUrl, selectedProvider)) {
        if (selectedProvider === "zoom_personal") {
          setErrors({ submit: "Please enter a valid Zoom link (must contain zoom.us)" });
        } else if (selectedProvider === "google_meet") {
          setErrors({ submit: "Please enter a valid Google Meet link (must contain meet.google.com)" });
        } else if (selectedProvider === "microsoft_teams") {
          setErrors({ submit: "Please enter a valid Microsoft Teams link (must contain teams.microsoft.com or teams.live.com)" });
        } else {
          setErrors({ submit: "Please enter a valid URL" });
        }
        return;
      }
      if (selectedProvider === "custom" && !customPlatformName.trim()) {
        setErrors({ submit: "Please enter the platform name" });
        return;
      }
    }

    setIsSaving(true);
    setErrors({});

    try {
      const result = await saveOnboardingStep(6, {
        video_provider: selectedProvider,
        video_url: selectedProvider !== "none" ? videoUrl : undefined,
        custom_video_name: selectedProvider === "custom" ? customPlatformName : undefined,
      });

      if (result.success) {
        onComplete();
      } else {
        setErrors({ submit: result.error || "Failed to save. Please try again." });
      }
    } catch (error) {
      console.error("Error saving video settings:", error);
      setErrors({ submit: "An error occurred. Please try again." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = async () => {
    setIsSkipping(true);
    setErrors({});

    try {
      const result = await saveOnboardingStep(6, {
        video_provider: "none",
      });

      if (result.success) {
        onComplete();
      } else {
        setErrors({ submit: result.error || "Failed to save. Please try again." });
      }
    } catch (error) {
      console.error("Error skipping step:", error);
      setErrors({ submit: "An error occurred. Please try again." });
    } finally {
      setIsSkipping(false);
    }
  };

  const providers = [
    {
      id: "zoom_personal" as const,
      name: "Zoom Personal Room",
      description: "Use your permanent Zoom room. Works with free Zoom accounts.",
      placeholder: "https://zoom.us/j/1234567890",
      helpText: "Find this in your Zoom app under Meetings → Personal Room",
      setupUrl: "https://zoom.us/meeting",
      popular: true,
    },
    {
      id: "microsoft_teams" as const,
      name: "Microsoft Teams",
      description: "Use a reusable Teams meeting link. Great for business accounts.",
      placeholder: "https://teams.microsoft.com/l/meetup-join/...",
      helpText: "In Teams: Calendar → Meet now → Get a link to share",
      helpLink: "https://support.microsoft.com/en-us/office/create-a-link-or-code-for-joining-a-teams-meeting-775bd09d-bfbe-4c1d-998f-e22a35f8e3a9",
      helpLinkText: "Need help? Learn how to get your Teams link →",
      setupUrl: "https://teams.microsoft.com",
      popular: true,
    },
    {
      id: "google_meet" as const,
      name: "Google Meet",
      description: "Use a reusable Google Meet link. 60-minute limit on free accounts.",
      placeholder: "https://meet.google.com/xxx-yyyy-zzz",
      helpText: "Create one at meet.google.com → New meeting → Create for later",
      setupUrl: "https://meet.google.com",
      popular: false,
    },
    {
      id: "custom" as const,
      name: "Other Platform",
      description: "WhatsApp Video, FaceTime, or any other video platform",
      placeholder: "https://...",
      helpText: "Enter your meeting room URL",
      popular: false,
    },
    {
      id: "none" as const,
      name: "I'll send links manually",
      description: "You'll share meeting links with students yourself via email or messaging",
      placeholder: "",
      helpText: "",
      popular: false,
    },
  ];

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Add your video meeting link so students can easily join lessons. This link will be included in booking confirmations.
      </p>

      {/* Provider Selection */}
      <div className="space-y-3">
        {providers.map((provider) => (
          <div key={provider.id} className="relative">
            {/* Setup URL icon - top right */}
            {provider.setupUrl && (
              <a
                href={provider.setupUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute top-3 right-3 z-10 p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted transition"
                title={`Open ${provider.name}`}
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
            <button
              type="button"
              onClick={() => {
                setSelectedProvider(provider.id);
                setErrors({});
              }}
              disabled={isSaving || isSkipping}
              className={`flex w-full items-start gap-4 rounded-xl border p-4 pr-12 text-left transition ${
                selectedProvider === provider.id
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              } disabled:cursor-not-allowed disabled:opacity-50`}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  selectedProvider === provider.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {selectedProvider === provider.id && provider.id !== "none" ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <Video className="h-5 w-5" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    {provider.name}
                  </span>
                  {provider.popular && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                      Popular
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {provider.description}
                </p>
              </div>
            </button>
          </div>
        ))}
      </div>

      {/* URL Input (shown when a provider with URL is selected) */}
      {selectedProvider && selectedProvider !== "none" && (
        <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
          {selectedProvider === "custom" && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Platform Name
              </label>
              <input
                type="text"
                value={customPlatformName}
                onChange={(e) => setCustomPlatformName(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="e.g., Microsoft Teams, WhatsApp Video"
                disabled={isSaving || isSkipping}
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Meeting Link
            </label>
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder={providers.find(p => p.id === selectedProvider)?.placeholder}
              disabled={isSaving || isSkipping}
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              {providers.find(p => p.id === selectedProvider)?.helpText}
            </p>
            {providers.find(p => p.id === selectedProvider)?.helpLink && (
              <a
                href={providers.find(p => p.id === selectedProvider)?.helpLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline mt-1 inline-flex items-center gap-1"
              >
                {providers.find(p => p.id === selectedProvider)?.helpLinkText || "Learn more →"}
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Info box */}
      <div className="rounded-xl bg-blue-50 p-4">
        <p className="text-xs text-blue-800">
          Your meeting link will be included in booking confirmation emails and visible to students in their portal. You can change this later in Settings → Video.
        </p>
      </div>

      {errors.submit && (
        <p className="text-sm text-red-600">{errors.submit}</p>
      )}

      {/* Action buttons */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={handleSkip}
          disabled={isSaving || isSkipping}
          className="inline-flex h-10 items-center justify-center rounded-full border border-border px-6 text-sm font-semibold text-muted-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSkipping ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Skipping...
            </>
          ) : (
            "Skip for now"
          )}
        </button>

        {selectedProvider && selectedProvider !== "none" && (
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isSkipping}
            className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Continue"
            )}
          </button>
        )}
      </div>
    </div>
  );
}

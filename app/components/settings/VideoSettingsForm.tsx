"use client";

import { useState, useTransition } from "react";
import { Video, Check, ExternalLink, AlertCircle } from "lucide-react";
import { updateVideoSettings } from "@/lib/actions/profile";

interface VideoSettingsFormProps {
  initialData: {
    video_provider: string;
    zoom_personal_link: string;
    google_meet_link: string;
    calendly_link: string;
    custom_video_url: string;
    custom_video_name: string;
  };
}

function getProviderDisplayName(provider: string, customName?: string): string {
  switch (provider) {
    case "zoom_personal":
      return "Zoom Personal Room";
    case "google_meet":
      return "Google Meet";
    case "calendly":
      return "Calendly";
    case "custom":
      return customName || "Custom Platform";
    case "none":
      return "Manual (no automatic link)";
    default:
      return "Not configured";
  }
}

function getCurrentUrl(data: VideoSettingsFormProps["initialData"]): string | null {
  switch (data.video_provider) {
    case "zoom_personal":
      return data.zoom_personal_link || null;
    case "google_meet":
      return data.google_meet_link || null;
    case "calendly":
      return data.calendly_link || null;
    case "custom":
      return data.custom_video_url || null;
    default:
      return null;
  }
}

export default function VideoSettingsForm({
  initialData,
}: VideoSettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [formData, setFormData] = useState(initialData);
  const [savedData, setSavedData] = useState(initialData);

  const currentUrl = getCurrentUrl(savedData);
  const hasConfiguredVideo = savedData.video_provider && savedData.video_provider !== "none" && currentUrl;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const result = await updateVideoSettings(formData);

      if (result.error) {
        setMessage({ type: "error", text: result.error });
      } else {
        setMessage({
          type: "success",
          text: "Video settings updated! Students will see this link in their booking confirmations.",
        });
        setSavedData(formData);
      }
    });
  };

  const providers = [
    {
      id: "zoom_personal",
      name: "Zoom Personal Room",
      description: "Use your permanent Zoom room. Works with free Zoom accounts.",
      popular: true,
      urlField: "zoom_personal_link" as const,
      placeholder: "https://zoom.us/j/1234567890",
      helpText: "Find this in your Zoom app under Meetings → Personal Room",
    },
    {
      id: "google_meet",
      name: "Google Meet",
      description: "Use a reusable Google Meet link. 60-minute limit on free accounts.",
      popular: false,
      urlField: "google_meet_link" as const,
      placeholder: "https://meet.google.com/xxx-yyyy-zzz",
      helpText: "Create one at meet.google.com → New meeting → Create for later",
    },
    {
      id: "calendly",
      name: "Redirect to Calendly",
      description: "Students will be sent to your Calendly page to book.",
      popular: false,
      urlField: "calendly_link" as const,
      placeholder: "https://calendly.com/yourname",
      helpText: "Your Calendly booking page URL",
      warning: "Using Calendly bypasses our booking system. You'll manage bookings in Calendly instead.",
    },
    {
      id: "custom",
      name: "Custom Video Platform",
      description: "Microsoft Teams, WhatsApp Video, or any other platform",
      popular: false,
      urlField: "custom_video_url" as const,
      placeholder: "https://...",
      helpText: "Enter your meeting room URL",
      hasCustomName: true,
    },
    {
      id: "none",
      name: "I'll send links manually",
      description: "You'll share meeting links with students yourself via email or messaging",
      popular: false,
      urlField: null,
      placeholder: "",
      helpText: "",
    },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Current Status Indicator */}
      {hasConfiguredVideo && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                <Check className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-900">
                  Currently using: {getProviderDisplayName(savedData.video_provider, savedData.custom_video_name)}
                </p>
                <p className="text-xs text-emerald-700 truncate max-w-[300px]">
                  {currentUrl}
                </p>
              </div>
            </div>
            <a
              href={currentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition"
            >
              <ExternalLink className="h-4 w-4" />
              Test Link
            </a>
          </div>
        </div>
      )}

      {/* Not Configured Warning */}
      {!hasConfiguredVideo && savedData.video_provider !== "none" && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
              <AlertCircle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-900">
                Video link not configured
              </p>
              <p className="text-xs text-amber-700">
                Choose a platform and add your meeting link so students can join lessons
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Provider Selection */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Video className="h-5 w-5 text-primary" />
          Choose Your Video Platform
        </h2>

        <div className="space-y-3">
          {providers.map((provider) => (
            <div
              key={provider.id}
              onClick={() =>
                setFormData({ ...formData, video_provider: provider.id })
              }
              className={`relative rounded-xl border-2 p-4 cursor-pointer transition ${
                formData.video_provider === provider.id
                  ? "border-primary bg-primary/5"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-full border-2 mt-0.5 ${
                    formData.video_provider === provider.id
                      ? "border-primary bg-primary"
                      : "border-gray-300"
                  }`}
                >
                  {formData.video_provider === provider.id && (
                    <Check className="h-3 w-3 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {provider.name}
                    </span>
                    {provider.popular && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">
                        POPULAR
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">
                    {provider.description}
                  </p>

                  {/* URL Input (conditional) */}
                  {formData.video_provider === provider.id && provider.urlField && (
                    <div className="mt-4 space-y-3">
                      {provider.hasCustomName && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Platform Name
                          </label>
                          <input
                            type="text"
                            value={formData.custom_video_name}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                custom_video_name: e.target.value,
                              })
                            }
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="e.g., Microsoft Teams, WhatsApp Video"
                            required={formData.video_provider === "custom"}
                          />
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Meeting Link
                        </label>
                        <input
                          type="url"
                          value={formData[provider.urlField]}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              [provider.urlField]: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                          placeholder={provider.placeholder}
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1.5">
                          {provider.helpText}
                        </p>
                        {provider.warning && (
                          <p className="text-xs text-amber-600 mt-2 flex items-start gap-1">
                            <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                            {provider.warning}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Success/Error Message */}
      {message && (
        <div
          className={`rounded-xl p-4 ${
            message.type === "success"
              ? "bg-emerald-50 border border-emerald-200"
              : "bg-red-50 border border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === "success" ? (
              <Check className="h-5 w-5 text-emerald-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
            <p
              className={`text-sm font-medium ${
                message.type === "success" ? "text-emerald-800" : "text-red-800"
              }`}
            >
              {message.text}
            </p>
          </div>
        </div>
      )}

      {/* Student Preview */}
      {formData.video_provider && formData.video_provider !== "none" && getCurrentUrl(formData) && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            How students will see it in booking confirmations:
          </h3>
          <div className="bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Video className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">
                Join on {getProviderDisplayName(formData.video_provider, formData.custom_video_name)}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {getCurrentUrl(formData)}
              </p>
            </div>
            <div className="text-xs text-primary font-medium">
              Click to join →
            </div>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 disabled:bg-primary/50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? "Saving..." : "Save Video Settings"}
        </button>
      </div>
    </form>
  );
}

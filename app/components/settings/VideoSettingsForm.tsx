"use client";

import { useState, useTransition } from "react";
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

export default function VideoSettingsForm({
  initialData,
}: VideoSettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [formData, setFormData] = useState(initialData);

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
          text: "Video settings updated successfully!",
        });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">
          Choose Your Video Platform
        </h2>

        <div className="space-y-4">
          {/* Zoom Personal Room */}
          <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition">
            <input
              type="radio"
              name="video_provider"
              value="zoom_personal"
              checked={formData.video_provider === "zoom_personal"}
              onChange={(e) =>
                setFormData({ ...formData, video_provider: e.target.value })
              }
              className="mt-1"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">
                  Zoom Personal Meeting Room
                </span>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                  POPULAR
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Use your permanent Zoom room. Works with free Zoom accounts.
              </p>
              {formData.video_provider === "zoom_personal" && (
                <div className="mt-3">
                  <input
                    type="url"
                    value={formData.zoom_personal_link}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        zoom_personal_link: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    placeholder="https://zoom.us/j/1234567890"
                    required={formData.video_provider === "zoom_personal"}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Find this in your Zoom app under Meetings → Personal Room
                  </p>
                </div>
              )}
            </div>
          </label>

          {/* Google Meet */}
          <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition">
            <input
              type="radio"
              name="video_provider"
              value="google_meet"
              checked={formData.video_provider === "google_meet"}
              onChange={(e) =>
                setFormData({ ...formData, video_provider: e.target.value })
              }
              className="mt-1"
            />
            <div className="flex-1">
              <span className="font-medium text-gray-900">Google Meet</span>
              <p className="text-sm text-gray-600 mt-1">
                Use a reusable Google Meet link. 60-minute limit on free accounts.
              </p>
              {formData.video_provider === "google_meet" && (
                <div className="mt-3">
                  <input
                    type="url"
                    value={formData.google_meet_link}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        google_meet_link: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    placeholder="https://meet.google.com/xxx-yyyy-zzz"
                    required={formData.video_provider === "google_meet"}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Create one at meet.google.com → New meeting → Create for later
                  </p>
                </div>
              )}
            </div>
          </label>

          {/* Calendly */}
          <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition">
            <input
              type="radio"
              name="video_provider"
              value="calendly"
              checked={formData.video_provider === "calendly"}
              onChange={(e) =>
                setFormData({ ...formData, video_provider: e.target.value })
              }
              className="mt-1"
            />
            <div className="flex-1">
              <span className="font-medium text-gray-900">
                Redirect to Calendly
              </span>
              <p className="text-sm text-gray-600 mt-1">
                Students will be sent to your Calendly page to book.
              </p>
              {formData.video_provider === "calendly" && (
                <div className="mt-3">
                  <input
                    type="url"
                    value={formData.calendly_link}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        calendly_link: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    placeholder="https://calendly.com/yourname"
                    required={formData.video_provider === "calendly"}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Your Calendly booking page URL
                  </p>
                  <p className="text-xs text-amber-600 mt-2">
                    ⚠️ Note: Using Calendly bypasses our booking system. You&apos;ll
                    manage bookings in Calendly instead.
                  </p>
                </div>
              )}
            </div>
          </label>

          {/* Custom Platform */}
          <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition">
            <input
              type="radio"
              name="video_provider"
              value="custom"
              checked={formData.video_provider === "custom"}
              onChange={(e) =>
                setFormData({ ...formData, video_provider: e.target.value })
              }
              className="mt-1"
            />
            <div className="flex-1">
              <span className="font-medium text-gray-900">
                Custom Video Platform
              </span>
              <p className="text-sm text-gray-600 mt-1">
                Microsoft Teams, WhatsApp Video, or any other platform
              </p>
              {formData.video_provider === "custom" && (
                <div className="mt-3 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Platform Name
                    </label>
                    <input
                      type="text"
                      value={formData.custom_video_name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          custom_video_name: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      placeholder="e.g., Microsoft Teams, WhatsApp Video"
                      required={formData.video_provider === "custom"}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Meeting URL
                    </label>
                    <input
                      type="url"
                      value={formData.custom_video_url}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          custom_video_url: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      placeholder="https://..."
                      required={formData.video_provider === "custom"}
                    />
                  </div>
                </div>
              )}
            </div>
          </label>

          {/* None / Manual */}
          <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition">
            <input
              type="radio"
              name="video_provider"
              value="none"
              checked={formData.video_provider === "none"}
              onChange={(e) =>
                setFormData({ ...formData, video_provider: e.target.value })
              }
              className="mt-1"
            />
            <div className="flex-1">
              <span className="font-medium text-gray-900">
                I&apos;ll send links manually
              </span>
              <p className="text-sm text-gray-600 mt-1">
                You&apos;ll share meeting links with students yourself via email or messaging
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Success/Error Message */}
      {message && (
        <div
          className={`rounded-lg p-4 ${
            message.type === "success"
              ? "bg-green-50 border border-green-200"
              : "bg-red-50 border border-red-200"
          }`}
        >
          <p
            className={`text-sm ${
              message.type === "success" ? "text-green-800" : "text-red-800"
            }`}
          >
            {message.text}
          </p>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? "Saving..." : "Save Video Settings"}
        </button>
      </div>
    </form>
  );
}

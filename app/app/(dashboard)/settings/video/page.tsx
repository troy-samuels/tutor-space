import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import VideoSettingsForm from "@/components/settings/VideoSettingsForm";

export default async function VideoSettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get current video settings
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "video_provider, zoom_personal_link, google_meet_link, calendly_link, custom_video_url, custom_video_name"
    )
    .eq("id", user.id)
    .single();

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Video Conferencing</h1>
        <p className="text-gray-600 mt-2">
          Choose how you&apos;ll conduct your online lessons
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <svg
              className="w-5 h-5 text-blue-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-blue-900">
              Use Your Own Video Platform
            </h3>
            <p className="text-sm text-blue-800 mt-1">
              Most tutors use their free Zoom Personal Meeting Room or Google Meet.
              Just paste your link once and we&apos;ll include it in all booking confirmations.
              No API integrations or monthly costs required.
            </p>
          </div>
        </div>
      </div>

      <VideoSettingsForm
        initialData={{
          video_provider: profile?.video_provider || "none",
          zoom_personal_link: profile?.zoom_personal_link || "",
          google_meet_link: profile?.google_meet_link || "",
          calendly_link: profile?.calendly_link || "",
          custom_video_url: profile?.custom_video_url || "",
          custom_video_name: profile?.custom_video_name || "",
        }}
      />

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">💡 Platform Guides</h2>

        <div className="space-y-4 text-sm text-gray-700">
          <div>
            <h3 className="font-medium text-gray-900">Finding Your Zoom Personal Meeting Room</h3>
            <ol className="mt-2 ml-4 list-decimal space-y-1">
              <li>Open the Zoom app or go to zoom.us</li>
              <li>Click on &quot;Meetings&quot; → &quot;Personal Room&quot;</li>
              <li>Copy your Personal Meeting Room link (e.g., https://zoom.us/j/1234567890)</li>
              <li>Paste it above</li>
            </ol>
            <p className="mt-1 text-xs text-gray-600">
              ⏰ Free Zoom accounts have 40-minute limit on group calls, but 1-on-1 lessons are unlimited
            </p>
          </div>

          <div>
            <h3 className="font-medium text-gray-900">Creating a Google Meet Link</h3>
            <ol className="mt-2 ml-4 list-decimal space-y-1">
              <li>Go to meet.google.com</li>
              <li>Click &quot;New meeting&quot; → &quot;Create a meeting for later&quot;</li>
              <li>Copy the meeting link (e.g., https://meet.google.com/abc-defg-hij)</li>
              <li>Paste it above</li>
            </ol>
            <p className="mt-1 text-xs text-gray-600">
              ⏰ Free Google Meet has 60-minute limit
            </p>
          </div>

          <div>
            <h3 className="font-medium text-gray-900">Using Calendly</h3>
            <p className="mt-1">
              If you already use Calendly, students will be redirected to your Calendly page
              instead of using our booking system. Your Calendly link should look like:
              https://calendly.com/yourname
            </p>
          </div>

          <div>
            <h3 className="font-medium text-gray-900">Other Platforms</h3>
            <p className="mt-1">
              You can also use Microsoft Teams, WhatsApp Video, FaceTime, or any other
              platform by selecting &quot;Custom video platform&quot; and pasting your meeting link.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { launchTopics, type LaunchTopicId } from "@/lib/constants/launch-topics";
import { sendOnboardingChecklistEmail } from "@/lib/emails/engagement";

const topicIds = new Set<LaunchTopicId>(launchTopics.map((topic) => topic.id));

export async function setLaunchTopic(topic: LaunchTopicId) {
  if (!topicIds.has(topic)) {
    return { error: "Please choose a valid launch kit topic." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to be signed in to choose a launch kit." };
  }

  const { data: existingProfile, error: profileError } = await supabase
    .from("profiles")
    .select("launch_sprint_started_at, launch_topic")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("[LaunchSprint] Failed to load profile", profileError);
    return { error: "We couldn’t load your sprint progress. Try again." };
  }

  const now = new Date().toISOString();
  const startTimestamp = existingProfile.launch_sprint_started_at ?? now;

  const { error } = await supabase
    .from("profiles")
    .update({
      launch_topic: topic,
      launch_sprint_started_at: startTimestamp,
    })
    .eq("id", user.id);

  if (error) {
    console.error("[LaunchSprint] Failed to set launch topic", error);
    return { error: "We couldn’t save your selection. Please try again." };
  }

  const isFirstSelection = !existingProfile.launch_topic;

  if (isFirstSelection && user?.email) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.tutorlingua.co";
    const checklist = [
      {
        label: "Polish your profile",
        description: "Upload your photo, languages, and credibility blocks.",
        link: `${appUrl}/settings/profile`,
      },
      {
        label: "Publish services & pricing",
        description: "Add at least one 1:1 lesson or package.",
        link: `${appUrl}/services`,
      },
      {
        label: "Connect payments",
        description: "Share Stripe or preferred payment links.",
        link: `${appUrl}/settings/payments`,
      },
      {
        label: "Share your booking link",
        description: "Send /book/{username} to leads and parents.",
        link: `${appUrl}/book/${user.user_metadata?.username ?? ""}`,
      },
    ];

    sendOnboardingChecklistEmail({
      to: user.email,
      tutorName: user.user_metadata?.full_name ?? "Tutor",
      checklist,
    }).catch((err) => {
      console.error("[LaunchSprint] Failed to send onboarding email", err);
    });
  }

  revalidatePath("/onboarding");
  revalidatePath("/dashboard");
  return { success: true };
}

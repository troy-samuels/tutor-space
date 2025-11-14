import type { LaunchTopicId } from "@/lib/constants/launch-topics";

export const emailTemplates = [
  {
    id: "welcome",
    label: "Welcome & Next Steps",
    subject: "Welcome aboard! Here’s how to get started",
    recommendedFor: ["kids_immersion", "heritage_learners"] as LaunchTopicId[],
    body: `Hi {{student_name}},

I’m excited to kick off our lessons together. To make sure we stay aligned:
- Send me your goals or any materials you’d like me to review.
- Add our upcoming sessions to your calendar so nothing slips.
- Reach out anytime if you need an extra resource or practice tip.

Let’s make amazing progress!
{{tutor_name}}`,
  },
  {
    id: "reminder",
    label: "Session Reminder",
    subject: "Quick reminder about your upcoming lesson",
    recommendedFor: ["exam_prep", "business_fluency"] as LaunchTopicId[],
    body: `Hi {{student_name}},

Just a reminder that we’re meeting soon. Please have your notes or homework ready so we can jump right in.

If you need to reschedule, reply here at least 12 hours in advance.

See you soon,
{{tutor_name}}`,
  },
  {
    id: "progress",
    label: "Progress Update",
    subject: "Your recent wins and what’s next",
    recommendedFor: ["exam_prep", "business_fluency", "seasonal_promo"] as LaunchTopicId[],
    body: `Hi {{student_name}},

Here’s what you crushed recently:
- [Add skill or improvement]
- [Add next focus]

For next time, please review [resource or task]. I’m proud of your momentum—keep going!

{{tutor_name}}`,
  },
  {
    id: "reengage",
    label: "Re-engage inactive students",
    subject: "Ready to jump back in?",
    recommendedFor: ["heritage_learners", "seasonal_promo"] as LaunchTopicId[],
    body: `Hi {{student_name}},

It’s been a little while since we worked together. I’d love to help you pick up where we left off (or start a fresh challenge).

If you book this week, I can hold your preferred time slot. Just reply or use your booking link.

Talk soon,
{{tutor_name}}`,
  },
] as const;

export type EmailTemplateId = (typeof emailTemplates)[number]["id"];

export const launchTopics = [
  {
    id: "exam_prep",
    label: "Exam Prep Accelerator",
    badge: "IELTS • DELF • AP",
    description: "Structured landing kit for tutors helping students pass high-stakes exams.",
  },
  {
    id: "kids_immersion",
    label: "Kids Immersion Club",
    badge: "Ages 5-12",
    description: "Colorful storytelling layout for parents booking immersive lessons.",
  },
  {
    id: "business_fluency",
    label: "Business Fluency Sprint",
    badge: "Corporate • Executives",
    description: "Professional hero, proof blocks, and CTAs for busy professionals.",
  },
  {
    id: "heritage_learners",
    label: "Heritage Learner Track",
    badge: "Family-focused",
    description: "Journey-focused layout for teens and adults reconnecting with heritage languages.",
  },
  {
    id: "seasonal_promo",
    label: "Seasonal Promo Booster",
    badge: "Limited Time",
    description: "Countdown-ready template for back-to-school, holidays, or new-year challenges.",
  },
] as const;

export type LaunchTopicId = (typeof launchTopics)[number]["id"];

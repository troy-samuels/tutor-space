import {
  Video,
  PlayCircle,
  Captions,
  Zap,
  Scissors,
  Map,
  type LucideIcon,
} from "lucide-react";

export type StudioFeatureId =
  | "classroom"
  | "recordings"
  | "transcripts"
  | "drills"
  | "clips"
  | "roadmaps";

export type StudioFeature = {
  id: StudioFeatureId;
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  cta: string;
};

export const STUDIO_FEATURES: StudioFeature[] = [
  {
    id: "classroom",
    icon: Video,
    title: "Native Video Classroom",
    description:
      "HD video conferencing with built-in recording and real-time transcription. No more Zoom links.",
    href: "/classroom/test",
    cta: "Test Studio",
  },
  {
    id: "recordings",
    icon: PlayCircle,
    title: "Lesson Recordings",
    description:
      "Every lesson automatically recorded and saved to the cloud. Students can replay anytime.",
    href: "/calendar",
    cta: "View Calendar",
  },
  {
    id: "transcripts",
    icon: Captions,
    title: "AI Transcription",
    description:
      "Deepgram-powered speech-to-text creates searchable transcripts with speaker identification.",
    href: "/calendar",
    cta: "Start a Lesson",
  },
  {
    id: "drills",
    icon: Zap,
    title: "AI-Generated Drills",
    description:
      "Automatically create practice exercises from lesson content. Match, gap-fill, and scramble games.",
    href: "/students",
    cta: "View Students",
  },
  {
    id: "clips",
    icon: Scissors,
    title: "Marketing Clips",
    description:
      "AI extracts viral-worthy highlights from your lessons for social media marketing.",
    href: "/marketing/site",
    cta: "View Marketing",
  },
  {
    id: "roadmaps",
    icon: Map,
    title: "Learning Roadmaps",
    description:
      "Visual learning paths track student progress through customizable curriculum nodes.",
    href: "/students",
    cta: "View Students",
  },
];

export const STUDIO_FEATURE_MAP = STUDIO_FEATURES.reduce(
  (acc, feature) => {
    acc[feature.id] = feature;
    return acc;
  },
  {} as Record<StudioFeatureId, StudioFeature>
);

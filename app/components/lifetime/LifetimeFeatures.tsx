"use client";

import {
  Calendar,
  CreditCard,
  Globe,
  MessageSquare,
  Users,
  BarChart3,
  Link2,
  FileText,
  Check,
  Video,
  PlayCircle,
  Captions,
  Zap,
  Scissors,
  Map,
} from "lucide-react";

const features = [
  {
    icon: Calendar,
    title: "Smart Booking System",
    description: "Automated scheduling with Google & Outlook calendar sync. Never double-book again.",
  },
  {
    icon: CreditCard,
    title: "Payment Processing",
    description: "Accept payments via Stripe Connect. Get paid directly to your bank account.",
  },
  {
    icon: Globe,
    title: "Custom Website",
    description: "Your own branded tutor website with booking, testimonials, and services.",
  },
  {
    icon: Users,
    title: "Student CRM",
    description: "Track all your students, their progress, lesson history, and notes in one place.",
  },
  {
    icon: MessageSquare,
    title: "Messaging",
    description: "Built-in messaging system to communicate with students directly.",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description: "Track your revenue, bookings, and student growth with detailed insights.",
  },
  {
    icon: Link2,
    title: "Link in Bio",
    description: "Professional link hub for all your services, social media, and booking links.",
  },
  {
    icon: FileText,
    title: "Digital Products",
    description: "Sell ebooks, worksheets, and other digital downloads to your students.",
  },
];

const studioFeatures = [
  {
    icon: Video,
    title: "Native Video Classroom",
    description: "HD video conferencing with recording. No more Zoom links.",
  },
  {
    icon: PlayCircle,
    title: "Lesson Recordings",
    description: "Every lesson auto-saved to cloud. Students replay anytime.",
  },
  {
    icon: Captions,
    title: "AI Transcription",
    description: "Speech-to-text with searchable transcripts and speaker ID.",
  },
  {
    icon: Zap,
    title: "AI-Generated Drills",
    description: "Auto-create match, gap-fill, and scramble games from lessons.",
  },
  {
    icon: Scissors,
    title: "Marketing Clips",
    description: "AI extracts viral-worthy highlights for social media.",
  },
  {
    icon: Map,
    title: "Learning Roadmaps",
    description: "Visual learning paths tracking student progress.",
  },
];

export function LifetimeFeatures() {
  return (
    <section className="bg-muted py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Everything You Need to Run Your Tutoring Business
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            One platform to replace 10+ scattered tools. All included in your lifetime access.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-2xl bg-white p-6 shadow-sm transition-all hover:shadow-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Studio Features Section */}
        <div className="mt-16 pt-8 border-t border-primary/20">
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="rounded-full bg-amber-100 px-4 py-1.5 text-sm font-semibold text-amber-800">
              BONUS: Studio Features Included
            </span>
          </div>
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h3 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              AI-Powered Teaching Tools
            </h3>
            <p className="mt-3 text-lg text-gray-600">
              6 premium Studio features, normally $79/month extra
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {studioFeatures.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 p-6 shadow-sm transition-all hover:shadow-md border border-amber-200/50"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 transition-colors group-hover:bg-amber-200">
                  <feature.icon className="h-6 w-6 text-amber-700" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Additional benefits */}
        <div className="mt-16 rounded-2xl bg-white p-8 shadow-sm">
          <h3 className="text-xl font-semibold text-foreground text-center mb-8">
            Plus, you also get:
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              "Unlimited students",
              "Unlimited bookings",
              "Session packages & bundles",
              "Email reminders",
              "Calendar availability",
              "Multiple services",
              "Custom branding",
              "All future updates",
              "Priority support",
            ].map((benefit) => (
              <div key={benefit} className="flex items-center gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                  <Check className="h-4 w-4 text-primary" />
                </div>
                <span className="text-gray-700">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

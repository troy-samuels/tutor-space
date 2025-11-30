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

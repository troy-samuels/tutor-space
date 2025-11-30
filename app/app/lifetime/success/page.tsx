import Link from "next/link";
import { CheckCircle, ArrowRight, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Payment Successful | TutorLingua",
  description: "Your lifetime access purchase was successful. Create your account to get started.",
};

export default function LifetimeSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-brand-white to-brand-white">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="text-xl font-bold text-foreground">
            TutorLingua
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6 py-20">
        <div className="mx-auto max-w-lg text-center">
          {/* Success icon */}
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle className="h-12 w-12 text-primary" />
          </div>

          {/* Success message */}
          <h1 className="mt-8 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Payment Successful!
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Welcome to TutorLingua! You now have lifetime access to the platform.
          </p>

          {/* Next steps */}
          <div className="mt-10 rounded-2xl bg-white p-8 shadow-lg border border-gray-100">
            <h2 className="text-xl font-semibold text-foreground">
              Next Step: Create Your Account
            </h2>
            <p className="mt-3 text-gray-600">
              Create your TutorLingua account using the same email you used for payment.
              Your lifetime access will be automatically applied.
            </p>

            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
              <Mail className="h-4 w-4" />
              <span>Use the same email you paid with</span>
            </div>

            <Link href="/signup?lifetime=true">
              <Button size="lg" className="mt-6 w-full h-12 text-base font-semibold">
                Create Your Account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>

          {/* What happens next */}
          <div className="mt-10 text-left">
            <h3 className="text-lg font-semibold text-foreground text-center mb-6">
              What Happens Next?
            </h3>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  1
                </div>
                <div>
                  <p className="font-medium text-foreground">Create your account</p>
                  <p className="text-sm text-gray-600">
                    Sign up with the email you used for payment
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  2
                </div>
                <div>
                  <p className="font-medium text-foreground">Complete onboarding</p>
                  <p className="text-sm text-gray-600">
                    Set up your profile, services, and availability
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  3
                </div>
                <div>
                  <p className="font-medium text-foreground">Start booking students</p>
                  <p className="text-sm text-gray-600">
                    Share your booking page and grow your tutoring business
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Support note */}
          <p className="mt-10 text-sm text-gray-500">
            Need help? Contact us at{" "}
            <a
              href="mailto:hello@tutorlingua.co"
              className="text-primary hover:underline"
            >
              hello@tutorlingua.co
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}

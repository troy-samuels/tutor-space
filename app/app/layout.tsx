import type { Metadata, Viewport } from "next";
import {
  Geist_Mono,
  Manrope,
  Mansalva,
} from "next/font/google";
import Script from "next/script";
import { NextIntlClientProvider } from "next-intl";
import { cookies } from "next/headers";
import "./globals.css";
import { PageViewTracker } from "@/components/providers/PageViewTracker";
import { GoogleAnalytics } from "@/components/providers/GoogleAnalytics";
import { defaultLocale, locales } from "@/lib/i18n/config";
import { CampaignBannerSlot } from "@/components/marketing/CampaignBannerSlot";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { ServiceWorkerRegistration } from "@/components/pwa/ServiceWorkerRegistration";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const mansalva = Mansalva({
  variable: "--font-mansalva",
  weight: "400",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Language Tutor Platform - Bookings, Payments & CRM for Independent Tutors | TutorLingua",
  description:
    "Replace 10+ tools with one platform. Language tutors get booking pages, payments, student CRM, and AI lesson planning. Free forever. No commissions. Start in 15 minutes.",
  keywords: [
    "language tutor platform",
    "tutor booking system",
    "independent tutor software",
    "tutor CRM",
    "online tutoring platform",
    "calendly alternative for tutors",
    "tutor website builder",
    "language teacher booking software",
    "tutor corner",
    "AI lesson planner",
  ],
  authors: [{ name: "TutorLingua" }],
  creator: "TutorLingua",
  publisher: "TutorLingua",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "TutorLingua – Built for language tutors",
    description:
      "Launch your tutor site, automate bookings and payments, manage students, and leverage AI tools with TutorLingua.",
    siteName: "TutorLingua",
    images: [
      {
        url: "/og-image.png?v=2",
        width: 1200,
        height: 630,
        alt: "TutorLingua – Platform for Language Tutors",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TutorLingua – Built for language tutors",
    description:
      "Run your tutoring business from one tab with TutorLingua: branded site, bookings, payments, CRM, and AI assistance.",
    images: ["/og-image.png?v=2"],
    creator: "@tutorlingua.co",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/brand/logo-icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
      { url: "/icons/icon-512.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
    shortcut: "/brand/logo-icon.svg",
    apple: [
      { url: "/icons/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
      { url: "/icons/icon-512.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TutorLingua",
  },
};

export const viewport: Viewport = {
  themeColor: "#1A1917",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value ?? defaultLocale;
  const locale = (locales as readonly string[]).includes(cookieLocale)
    ? cookieLocale
    : defaultLocale;

  let messages;
  try {
    messages = (await import(`@/messages/${locale}.json`)).default;
  } catch {
    messages = (await import("@/messages/en.json")).default;
  }

  return (
    <html lang={locale}>
      <body
        className={[
          manrope.variable,
          mansalva.variable,
          geistMono.variable,
          "antialiased",
        ].join(" ")}
      >
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="lazyOnload"
        />
        <GoogleAnalytics />
        <CampaignBannerSlot />
        <NextIntlClientProvider locale={locale} messages={messages}>
          <PageViewTracker />
          {children}
          <ServiceWorkerRegistration />
          <InstallPrompt />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

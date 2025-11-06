import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { cookies } from "next/headers";
import "./globals.css";
import { AuthProvider } from "@/components/providers/auth-provider";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { defaultLocale, locales } from "@/lib/i18n/config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TutorLingua – The operating system for language tutors",
  description:
    "TutorLingua gives independent language tutors a branded site, smart bookings, payments, CRM, and AI-powered teaching tools in one place.",
  keywords: [
    "tutor corner",
    "language tutor platform",
    "tutor booking system",
    "tutor CRM",
    "AI lesson planner",
    "online tutoring software",
  ],
  authors: [{ name: "TutorLingua" }],
  creator: "TutorLingua",
  publisher: "TutorLingua",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "TutorLingua – The operating system for language tutors",
    description:
      "Launch your tutor site, automate bookings and payments, manage students, and leverage AI tools with TutorLingua.",
    siteName: "TutorLingua",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "TutorLingua – Platform for Language Tutors",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TutorLingua – The operating system for language tutors",
    description:
      "Run your tutoring business from one tab with TutorLingua: branded site, bookings, payments, CRM, and AI assistance.",
    images: ["/og-image.png"],
    creator: "@tutorhub",
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
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AuthProvider>
            <LocaleSwitcher />
            {children}
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

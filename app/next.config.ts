import path from "path";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  // outputFileTracingRoot only needed for monorepo setups - disabled for Vercel deployment
  // outputFileTracingRoot: path.resolve(process.cwd(), ".."),
  // Remove X-Powered-By header (security best practice)
  poweredByHeader: false,
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/@:username",
        destination: "/profile/:username",
      },
    ];
  },
  // Security headers for CASA compliance
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Prevents clickjacking attacks (CASA Medium)
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          // Prevents MIME type sniffing (CASA Low)
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // Controls referrer information
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // Content Security Policy (CASA Medium)
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Scripts: self, inline (Next.js requires), Google, Stripe, LiveKit, Google Analytics
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com https://js.stripe.com https://*.livekit.cloud https://video.tutorlingua.co https://www.googletagmanager.com",
              // Styles: self, inline (Tailwind/styled-jsx)
              "style-src 'self' 'unsafe-inline'",
              // Images: self, data URIs, blobs, HTTPS sources (Supabase storage, Unsplash, etc.)
              "img-src 'self' blob: data: https:",
              // Fonts: self, data URIs, Google Fonts
              "font-src 'self' data: https://fonts.gstatic.com",
              // Connect: API calls to Supabase, Stripe, LiveKit, Deepgram, OpenAI, Google Analytics
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://*.livekit.cloud wss://*.livekit.cloud wss://video.tutorlingua.co https://video.tutorlingua.co https://api.deepgram.com https://api.openai.com https://api.resend.com https://www.google-analytics.com https://www.googletagmanager.com https://*.google-analytics.com https://lon1.digitaloceanspaces.com",
              // Frames: Stripe checkout, Google OAuth
              "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://accounts.google.com",
              // Media: self, Supabase storage for audio/video
              "media-src 'self' https://*.supabase.co https://lon1.digitaloceanspaces.com blob:",
              // Workers: self for service workers
              "worker-src 'self' blob:",
            ].join("; "),
          },
          // Permissions Policy (formerly Feature-Policy)
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(self), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);

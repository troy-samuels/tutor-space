import path from "path";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

type RemotePattern = {
  protocol?: "http" | "https";
  hostname: string;
  port?: string;
  pathname?: string;
  search?: string;
};

const supabaseImagePattern: RemotePattern | null = (() => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return null;
  try {
    const parsed = new URL(supabaseUrl);
    const protocol = parsed.protocol.replace(":", "");
    if (protocol !== "http" && protocol !== "https") return null;
    return {
      protocol: protocol as "http" | "https",
      hostname: parsed.hostname,
      pathname: "/**",
    };
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  // outputFileTracingRoot only needed for monorepo setups - disabled for Vercel deployment
  // outputFileTracingRoot: path.resolve(process.cwd(), ".."),
  // Remove X-Powered-By header (security best practice)
  poweredByHeader: false,
  // Exclude packages with test files that break Turbopack bundling
  serverExternalPackages: ["thread-stream", "pino", "pino-pretty"],
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
      ...(supabaseImagePattern ? [supabaseImagePattern] : []),
    ],
  },
  async rewrites() {
    return {
      beforeFiles: [
        // Calculator subdomain - only rewrite root path to /calculator page
        // Static files (_next/*) are served normally without rewriting
        {
          source: "/",
          has: [{ type: "host", value: "calculator.tutorlingua.co" }],
          destination: "/calculator",
        },
      ],
      afterFiles: [
        {
          source: "/@:username",
          destination: "/profile/:username",
        },
      ],
      fallback: [],
    };
  },
  async redirects() {
    return [
      // Legacy URL patterns - redirect old URLs to new canonical paths
      {
        source: "/tutor/:username",
        destination: "/profile/:username",
        permanent: true,
      },
      {
        source: "/tutors/:username",
        destination: "/profile/:username",
        permanent: true,
      },
      {
        source: "/teacher/:username",
        destination: "/profile/:username",
        permanent: true,
      },
      // Redirect trailing slashes to non-trailing (SEO best practice)
      {
        source: "/:path+/",
        destination: "/:path+",
        permanent: true,
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
              "default-src 'self' https://*.tutorlingua.co",
              // Scripts: self, inline (Next.js requires), Google, Stripe, LiveKit, Google Analytics, TutorLingua subdomains
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.tutorlingua.co https://accounts.google.com https://apis.google.com https://js.stripe.com https://*.livekit.cloud https://video.tutorlingua.co https://www.googletagmanager.com",
              // Styles: self, inline (Tailwind/styled-jsx), Google Identity Services, TutorLingua subdomains
              "style-src 'self' 'unsafe-inline' https://*.tutorlingua.co https://accounts.google.com",
              // Images: self, data URIs, blobs, HTTPS sources (Supabase storage, Unsplash, etc.)
              "img-src 'self' blob: data: https:",
              // Fonts: self, data URIs, Google Fonts, TutorLingua subdomains
              "font-src 'self' data: https://fonts.gstatic.com https://*.tutorlingua.co",
              // Connect: API calls to Supabase, Stripe, LiveKit, Deepgram, OpenAI, Google Analytics, Google Identity Services, TutorLingua subdomains
              "connect-src 'self' https://*.tutorlingua.co https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://*.livekit.cloud wss://*.livekit.cloud wss://video.tutorlingua.co https://video.tutorlingua.co https://api.deepgram.com https://api.openai.com https://api.resend.com https://www.google-analytics.com https://www.googletagmanager.com https://*.google-analytics.com https://lon1.digitaloceanspaces.com https://accounts.google.com",
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

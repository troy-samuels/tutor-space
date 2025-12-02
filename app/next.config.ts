import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const remotePatterns = supabaseUrl
  ? [
      {
        protocol: "https",
        hostname: new URL(supabaseUrl).hostname,
      },
    ]
  : [];

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns,
  },
  async rewrites() {
    return [
      {
        source: "/@:username",
        destination: "/profile/:username",
      },
    ];
  },
};

export default withNextIntl(nextConfig);

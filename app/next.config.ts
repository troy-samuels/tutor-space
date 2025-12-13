import path from "path";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.resolve(process.cwd(), ".."),
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
  webpack: (config, { nextRuntime, webpack }) => {
    // Ensure edge bundles (middleware) have a defined __dirname to satisfy CJS helpers
    if (nextRuntime === "edge") {
      // Replace __dirname at compile-time
      config.plugins.push(new webpack.DefinePlugin({ __dirname: JSON.stringify("/") }));
      // Add runtime guard in case any helper still expects __dirname
      config.plugins.push(
        new webpack.BannerPlugin({
          banner: 'if(typeof __dirname==="undefined"){globalThis.__dirname="/";}',
          raw: true,
          entryOnly: false,
        })
      );
    }
    return config;
  },
};

export default withNextIntl(nextConfig);

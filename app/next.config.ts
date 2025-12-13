import path from "path";
import * as webpack from "next/dist/compiled/webpack/webpack";
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
  webpack: (config, { nextRuntime }) => {
    // Ensure edge bundles (middleware) have a defined __dirname to satisfy CJS helpers
    if (nextRuntime === "edge") {
      const { webpack: webpackLib } = webpack;
      if (webpackLib?.DefinePlugin) {
        config.plugins.push(new webpackLib.DefinePlugin({ __dirname: JSON.stringify("/") }));
      }
    }
    return config;
  },
};

export default withNextIntl(nextConfig);

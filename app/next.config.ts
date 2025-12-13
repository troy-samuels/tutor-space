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
    if (nextRuntime === "edge") {
      // 1. Replace __dirname/__filename at compile time (when supported)
      config.plugins.unshift(
        new webpack.DefinePlugin({
          __dirname: JSON.stringify("/"),
          __filename: JSON.stringify("/index.js"),
        })
      );

      // 2. Inject a lexical __dirname/__filename for edge runtime (defense-in-depth)
      config.plugins.unshift(
        new webpack.BannerPlugin({
          banner:
            'var __dirname="/",__filename="/";try{globalThis.__dirname=__dirname;globalThis.__filename=__filename;globalThis.__tl_edge_dirname_shim=1;}catch{};',
          raw: true,
          entryOnly: false,
        })
      );

      // 3. Add fallbacks for Node.js built-ins that edge doesn't have
      config.resolve = config.resolve || {};
      config.resolve.fallback = {
        ...config.resolve.fallback,
        path: false,
        fs: false,
        os: false,
      };
    }
    return config;
  },
};

export default withNextIntl(nextConfig);

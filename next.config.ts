import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable strict mode for now to avoid double-render issues
  reactStrictMode: false,

  // Empty turbopack config to silence warning (Next.js 16 uses Turbopack by default)
  turbopack: {},

  // Handle canvas module for Webpack production builds (Vercel)
  webpack: (config, { isServer }) => {
    // Exclude canvas from being processed - it's optional for pdfjs-dist
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    };

    // Fallback for browser-only modules
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
      };
    }

    return config;
  },
  headers: async () => [
    {
      source: "/:path*",
      headers: [
        { key: "Cache-Control", value: "no-store, must-revalidate" },
      ],
    },
  ],
};

export default nextConfig;

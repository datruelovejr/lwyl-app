import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compiler: {
    removeConsole: {
      exclude: ['warn'],
    },
  },
  turbopack: {
    resolveAlias: {
      canvas: { browser: '' },
    },
  },
  // Handle canvas module for Webpack production builds (Vercel)
  webpack: (config, { isServer }) => {
    // Exclude canvas from being processed - it's optional for pdfjs-dist
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    };

    // Mark problematic modules as external on server
    if (isServer) {
      config.externals = [...(config.externals || []), 'canvas'];
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

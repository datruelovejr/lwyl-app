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

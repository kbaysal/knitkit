import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
  turbopack: {
    resolveAlias: {
      canvas: { browser: "./empty-module.ts" },
    },
  },
};

export default nextConfig;

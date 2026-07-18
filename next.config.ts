import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  distDir: "build",
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
    ],
    minimumCacheTTL: 86400,
    formats: ["image/avif", "image/webp"],
    qualities: [20, 40, 60, 75, 80, 100],
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  distDir: "build",
  output: "standalone",
};

export default nextConfig;

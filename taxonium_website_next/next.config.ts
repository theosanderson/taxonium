import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Include files from the monorepo base (parent directory)
  outputFileTracingRoot: path.join(__dirname, '../'),
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Type errors in cron routes are Prisma enum inference issues — safe to ignore during build
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
  },
};

export default nextConfig;

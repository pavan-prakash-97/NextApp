// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "next-app-store.s3.ap-southeast-2.amazonaws.com",
      },
    ],
  },
};

export default nextConfig;

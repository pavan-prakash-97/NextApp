// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
// };

// export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "next-app-store.s3.ap-southeast-2.amazonaws.com",
      },
    ],
  },
};

module.exports = nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  experimental: {
    // Reuse visited dynamic pages in the client cache for 30 seconds
    staleTimes: {
      dynamic: 30,
    },
  },
  /* config options here */
};

export default nextConfig;

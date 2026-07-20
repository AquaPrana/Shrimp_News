import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "shrimp.news" },
      { protocol: "https", hostname: "www.shrimp.news" },
    ],
  },
};

export default nextConfig;

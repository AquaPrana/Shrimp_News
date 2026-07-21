import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "shrimp.news" },
      { protocol: "https", hostname: "www.shrimp.news" },
      { protocol: "https", hostname: "**.hostinger.com" },
      { protocol: "https", hostname: "**.hostingersite.com" },
      { protocol: "https", hostname: "**.amazonaws.com" },
      { protocol: "https", hostname: "**.cloudfront.net" },
    ],
  },
};

export default nextConfig;

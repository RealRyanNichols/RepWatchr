import type { NextConfig } from "next";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  outputFileTracingIncludes: {
    "/api/og/*": [
      "./public/images/og/repwatchr-logo.png",
      "./public/images/og/washington-accountability-blue-hour.jpg",
      "./public/images/og/marion-county-judge-2026-hero.jpg",
    ],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    imageSizes: [32, 48, 64, 96, 128, 192, 256, 384, 512],
    qualities: [75, 90, 96, 100],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "static.wixstatic.com",
        pathname: "/media/**",
      },
    ],
  },
};

export default nextConfig;

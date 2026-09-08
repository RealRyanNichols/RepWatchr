import type { NextConfig } from "next";
import { withBotId } from "botid/next/config";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  async redirects() {
    return [{
      source: "/:path*",
      has: [{ type: "host", value: "repwatchr.com" }],
      destination: "https://www.repwatchr.com/:path*",
      permanent: true,
    }];
  },
  turbopack: {
    root: projectRoot,
  },
  outputFileTracingIncludes: {
    "/api/og/*": [
      "./public/fonts/anton/Anton-Regular.ttf",
      "./public/images/og/repwatchr-logo.png",
      "./public/images/og/washington-accountability-blue-hour.jpg",
      "./public/images/og/marion-county-judge-2026-hero.jpg",
    ],
  },
  images: {
    localPatterns: [
      { pathname: "/images/officials/**" },
      { pathname: "/**", search: "" },
    ],
    formats: ["image/avif", "image/webp"],
    imageSizes: [32, 48, 64, 96, 128, 192, 256, 384, 512],
    qualities: [75, 90, 96, 100],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "static.wixstatic.com",
        pathname: "/media/**",
      },
      {
        protocol: "https",
        hostname: "directory.texastribune.org",
        pathname: "/static/images/headshots/**",
      },
      {
        protocol: "https",
        hostname: "www.txcourts.gov",
        pathname: "/media/**",
      },
      {
        protocol: "https",
        hostname: "www.glo.texas.gov",
        pathname: "/sites/default/files/**",
      },
      {
        protocol: "https",
        hostname: "www.texasagriculture.gov",
        pathname: "/Portals/0/forms/COMM/**",
      },
    ],
  },
};

export default withBotId(nextConfig);

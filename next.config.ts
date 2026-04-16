import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    if (process.env.VERCEL_ENV !== "production") {
      return [];
    }
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "^(.+)\\.vercel\\.app$",
          },
        ],
        destination: "https://www.repwatchr.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
